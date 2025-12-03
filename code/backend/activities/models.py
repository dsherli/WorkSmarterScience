from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.utils import timezone


class ScienceActivity(models.Model):
    id = models.BigAutoField(primary_key=True)
    activity_id = models.CharField(max_length=50, unique=True)
    activity_title = models.CharField(max_length=255, null=True, blank=True)
    activity_task = models.TextField(null=True, blank=True)

    pe = models.CharField(max_length=50, null=True, blank=True)
    lp = models.CharField(max_length=50, null=True, blank=True)
    lp_text = models.TextField(null=True, blank=True)

    question_1 = models.TextField(null=True, blank=True)
    question_2 = models.TextField(null=True, blank=True)
    question_3 = models.TextField(null=True, blank=True)
    question_4 = models.TextField(null=True, blank=True)
    question_5 = models.TextField(null=True, blank=True)

    is_released = models.BooleanField(default=False)
    created_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(null=True, blank=True)

    version = models.FloatField(default=0.1)

    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    category = models.CharField(max_length=50, null=True, blank=True)
    tags = models.JSONField(null=True, blank=True)

    class Meta:
        db_table = 'science_activity'
        managed = True

    def __str__(self):
        return f"{self.activity_id} - {self.activity_title or 'Untitled'} (v{self.version:.1f})"


class ScienceActivityImages(models.Model):
    id = models.BigAutoField(primary_key=True)
    activity = models.ForeignKey(
        ScienceActivity,
        on_delete=models.CASCADE,
        db_column="activity_id",
        related_name="media_files",
    )
    file_path = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    media_type = models.CharField(max_length=20, default="image")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = '"public"."science_activity_images"'
        managed = False


class ScienceActivitySubmission(models.Model):
    STATUS_CHOICES = [
        ("assigned", "Assigned"),
        ("in_progress", "In Progress"),
        ("submitted", "Submitted"),
        ("graded", "Graded"),
    ]

    id = models.BigAutoField(primary_key=True)
    activity = models.ForeignKey(
        ScienceActivity,
        on_delete=models.DO_NOTHING,
        db_column="activity_id",
        to_field="id",
        related_name="submissions",
    )
    student = models.ForeignKey(
        User,
        on_delete=models.DO_NOTHING,
        db_column="student_id",
        to_field="id",
        related_name="activity_submissions",
    )
    teacher = models.ForeignKey(
        User,
        on_delete=models.DO_NOTHING,
        db_column="teacher_id",
        to_field="id",
        related_name="reviewed_activity_submissions",
        null=True,
        blank=True,
    )
    submitted_at = models.DateTimeField(blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="submitted",
    )
    score = models.DecimalField(null=True, blank=True, max_digits=5, decimal_places=2)
    feedback_overview = models.TextField(null=True, blank=True)
    attempt_number = models.IntegerField(default=1)

    class Meta:
        db_table = '"public"."activity_submissions"'
        managed = False

    def __str__(self):
        return f"Submission #{self.id} - activity {self.activity_id} - student {self.student_id}"


@receiver(pre_save, sender=ScienceActivity)
def update_version_and_timestamp(sender, instance, **kwargs):
    instance.updated_at = timezone.now()

    if not instance.pk:
        return

    try:
        old_instance = ScienceActivity.objects.get(pk=instance.pk)

        fields_to_check = [
            "activity_title",
            "activity_task",
            "pe",
            "lp",
            "lp_text",
            "category",
            "tags",
        ]
        if any(
            getattr(instance, f) != getattr(old_instance, f) for f in fields_to_check
        ):
            instance.version = round(old_instance.version + 0.1, 1)
    except ScienceActivity.DoesNotExist:
        pass
