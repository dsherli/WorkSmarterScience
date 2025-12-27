import json
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from grading.models import Rubric, RubricCriterion, ActivityRubricMap


class Command(BaseCommand):
    help = "Import a rubric from a JSON file and optionally map it to an activity_code"

    def add_arguments(self, parser):
        parser.add_argument("--file", required=True, help="Path to rubric JSON file")
        parser.add_argument("--activity-code", dest="activity_code", help="Optional activity code to map (e.g., 005.04-c01)")
        parser.add_argument("--created-by", dest="created_by", type=int, default=None, help="Optional user id for created_by")

    def handle(self, *args, **options):
        file_path = options["file"]
        activity_code = options.get("activity_code")
        created_by = options.get("created_by")

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception as e:
            raise CommandError(f"Failed to read JSON: {e}")

        user = None
        if created_by is not None:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                user = User.objects.get(id=created_by)
            except User.DoesNotExist:
                raise CommandError(f"User with id {created_by} does not exist")

        # Build description from JSON (mirrors API logic)
        learning_target = data.get("learning_target", "")
        rubric_description = learning_target
        if "metadata" in data:
            md = data["metadata"]
            if rubric_description:
                rubric_description += "\n\n"
            rubric_description += f"Source: {md.get('source_document', 'N/A')}"
            if md.get("aligned_ngss"):
                rubric_description += f"\nAligned to: {', '.join(md['aligned_ngss'])}"

        title = data.get("task_title") or data.get("assignment") or data.get("assignment_id") or "Untitled Rubric"
        total_points = data.get("max_score", 100)

        with transaction.atomic():
            rubric = Rubric.objects.create(
                title=title,
                description=rubric_description,
                total_points=total_points,
                created_by=user or self._get_admin_user(),
                is_active=True,
            )

            criteria = data.get("criteria", [])
            for idx, c in enumerate(criteria):
                name = c.get("id") or c.get("title") or f"Criterion {idx+1}"

                # Enrich description with levels and examples
                desc_parts = []
                if c.get("question"):
                    desc_parts.append(c["question"]) 
                levels = c.get("levels", [])
                if levels:
                    desc_parts.append("Performance Levels:")
                    for lvl in levels:
                        lvl_name = lvl.get("name", "Unknown")
                        lvl_desc = lvl.get("descriptor") or lvl.get("description", "")
                        desc_parts.append(f"• {lvl_name}: {lvl_desc}")
                if c.get("examples"):
                    desc_parts.append("Examples:")
                    for k, v in c["examples"].items():
                        if v:
                            desc_parts.append(f"• {k.title()}: {v}")

                # Determine max_points from levels or use weight split
                max_points = 0
                scores = [lvl.get("score") for lvl in levels if isinstance(lvl.get("score"), (int, float))]
                if scores:
                    max_points = int(max(scores))
                if max_points == 0:
                    criteria_count = max(len(criteria), 1)
                    weight = c.get("weight", 1.0 / criteria_count)
                    max_points = int(weight * total_points) or 1

                RubricCriterion.objects.create(
                    rubric=rubric,
                    name=name,
                    description="\n".join(desc_parts).strip(),
                    max_points=max_points,
                    weight=c.get("weight", 1.0),
                    order=idx,
                )

            mapped = None
            if activity_code:
                mapping, _ = ActivityRubricMap.objects.update_or_create(
                    activity_code=activity_code,
                    defaults={
                        "rubric": rubric,
                        "assignment_id": data.get("assignment_id") or data.get("assignment") or "",
                    },
                )
                mapped = mapping

        self.stdout.write(self.style.SUCCESS(f"Imported rubric '{rubric.title}' (id={rubric.id})"))
        if mapped:
            self.stdout.write(self.style.SUCCESS(f"Mapped activity_code '{mapped.activity_code}' -> rubric_id {rubric.id}"))

    def _get_admin_user(self):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = User.objects.filter(is_superuser=True).first()
        if user:
            return user
        # fallback to any staff or the first user
        return User.objects.filter(is_staff=True).first() or User.objects.first()
