from urllib.parse import urljoin

from django.conf import settings
from django.db import connection
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import ScienceActivity


@api_view(["GET"])
@permission_classes([AllowAny])
def get_science_activities(request):
    """
    Retrieve all science activities.
    This endpoint is used for the dashboard list view.
    """
    try:
        activities = ScienceActivity.objects.all().values(
            "activity_id",
            "activity_title",
            "pe",
            "lp",
            "lp_text",
        )
        return Response(list(activities))
    except Exception:
        # If backing table doesn't exist in local dev, return empty list instead of 500
        return Response([], status=200)


@api_view(["GET"])
@permission_classes([AllowAny])
def get_science_activity(request, activity_id):
    """
    Retrieve a single science activity with its related media files (images/videos)
    from the science_activity_images table.
    """
    try:
        # 1. load activity
        activity = ScienceActivity.objects.get(activity_id=activity_id)
        # 2. search image
        media_records = []
        query = """
            SELECT file_path, description, media_type
            FROM public.science_activity_images
            WHERE activity_id = %s
            ORDER BY id ASC;
        """
        identifiers = [activity.activity_id, activity.id]

        with connection.cursor() as cursor:
            for identifier in identifiers:
                try:
                    cursor.execute(query, [identifier])
                    media_records = cursor.fetchall()
                except Exception:
                    media_records = []

                if media_records:
                    break

        # 3. JSON
        media = []

        def _normalise_media_path(raw_path: str) -> str:
            clean = (raw_path or "").strip()
            if not clean:
                return ""

            clean = clean.replace("\\", "/").lstrip("/")
            if "media/" in clean:
                clean = clean.split("media/", 1)[1]
            if clean.startswith("backend/"):
                remainder = clean[len("backend/") :]
                if remainder.startswith("media/"):
                    clean = remainder[len("media/") :]
                else:
                    clean = remainder
            return clean

        public_media_base = getattr(settings, "PUBLIC_MEDIA_BASE_URL", "").strip()
        if public_media_base:
            media_base_url = public_media_base.rstrip("/") + "/"
        else:
            media_base_url = request.build_absolute_uri(settings.MEDIA_URL)
            media_base_url = (
                media_base_url if media_base_url.endswith("/") else f"{media_base_url}/"
            )

        for path, desc, mtype in media_records:
            if not path:
                continue

            if path.startswith("http"):
                file_url = path
            else:
                normalised_path = _normalise_media_path(path)
                if not normalised_path:
                    continue
                file_url = urljoin(media_base_url, normalised_path)

            media.append(
                {
                    "url": file_url,
                    "description": desc or "",
                    "media_type": mtype or "image",
                }
            )

        # 4. questions
        questions = [
            q.strip()
            for q in [
                activity.question_1,
                activity.question_2,
                activity.question_3,
                activity.question_4,
                activity.question_5,
            ]
            if q and q.strip()
        ]

        # 5. response
        data = {
            "activity_title": activity.activity_title,
            "activity_task": activity.activity_task,
            "media": media,
            "questions": questions,
        }

        return Response(data, status=200)

    except ScienceActivity.DoesNotExist:
        return Response({"error": "Activity not found"}, status=404)

    except Exception as e:
        # error handling
        return Response({"error": str(e)}, status=500)
