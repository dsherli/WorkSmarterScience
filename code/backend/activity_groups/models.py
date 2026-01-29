from django.conf import settings
from django.db import models


class ActivityGroupSet(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        CLOSED = "closed", "Closed"
        ARCHIVED = "archived", "Archived"

    # Links to ClassroomActivity (classroom-level assignment), not individual student assignments
    classroom_activity = models.OneToOneField(
        "classrooms.ClassroomActivity",
        on_delete=models.CASCADE,
        related_name="activity_group_set",
        null=True,  # Temporarily nullable for migration, can be made non-null later
        blank=True,
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
        db_index=True,
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="created_activity_group_sets",
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"GroupSet for classroom_activity {self.classroom_activity_id}"


class ActivityGroup(models.Model):
    group_set = models.ForeignKey(
        ActivityGroupSet,
        on_delete=models.CASCADE,
        related_name="groups",
    )
    label = models.CharField(max_length=255)
    archived_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["group_set", "label"]
        unique_together = ("group_set", "label")
        indexes = [
            models.Index(fields=["group_set", "archived_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.label} (set {self.group_set_id})"


class ActivityGroupMembership(models.Model):
    group_set = models.ForeignKey(
        ActivityGroupSet,
        on_delete=models.CASCADE,
        related_name="memberships",
    )
    activity_group = models.ForeignKey(
        ActivityGroup,
        on_delete=models.CASCADE,
        related_name="memberships",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="activity_group_memberships",
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["group_set", "user"],
                name="unique_group_set_membership_per_user",
            ),
        ]
        indexes = [
            models.Index(fields=["activity_group"]),
            models.Index(fields=["user"]),
        ]

    def __str__(self) -> str:
        return f"{self.user_id} in group {self.activity_group_id}"


class GroupAIRun(models.Model):
    class RunReason(models.TextChoices):
        SUBMISSION_SUMMARY = "submission_summary", "Submission Summary"
        FOLLOW_UP_GENERATION = "follow_up_generation", "Follow Up Generation"
        MANUAL_REVIEW = "manual_review", "Manual Review"

    activity_group = models.ForeignKey(
        ActivityGroup,
        on_delete=models.CASCADE,
        related_name="ai_runs",
    )
    run_reason = models.CharField(
        max_length=50,
        choices=RunReason.choices,
        default=RunReason.SUBMISSION_SUMMARY,
        db_index=True,
    )
    input_response_ids = models.JSONField(default=list)
    synthesized_summary_text = models.TextField()
    model_name = models.CharField(max_length=100)
    model_params = models.JSONField(default=dict)
    released_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the questions were released to students. Null means not released."
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["activity_group", "created_at"]),
        ]

    def __str__(self) -> str:
        return f"AI run {self.id} for group {self.activity_group_id}"


class GroupAIPrompt(models.Model):
    class PromptType(models.TextChoices):
        FOLLOW_UP = "follow_up", "Follow Up"
        REFLECTION = "reflection", "Reflection"
        EXTENSION = "extension", "Extension"
        CHECK_IN = "check_in", "Check In"

    group_ai_run = models.ForeignKey(
        GroupAIRun,
        on_delete=models.CASCADE,
        related_name="prompts",
    )
    prompt_order = models.PositiveSmallIntegerField()
    prompt_text = models.TextField()
    prompt_type = models.CharField(
        max_length=50,
        choices=PromptType.choices,
        db_index=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["group_ai_run", "prompt_order"]
        constraints = [
            models.UniqueConstraint(
                fields=["group_ai_run", "prompt_order"],
                name="unique_prompt_order_per_run",
            ),
        ]

    def __str__(self) -> str:
        return f"Prompt {self.prompt_order} for run {self.group_ai_run_id}"
