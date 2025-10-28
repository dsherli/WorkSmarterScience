from django.db import models


class ScienceActivity(models.Model):
    id = models.BigAutoField(primary_key=True)
    activity_id = models.CharField(max_length=50, unique=True)
    pe = models.CharField(max_length=50, null=True, blank=True)
    lp = models.CharField(max_length=50, null=True, blank=True)
    lp_text = models.TextField(null=True, blank=True)
    activity_title = models.CharField(max_length=255, null=True, blank=True)
    activity_task = models.TextField(null=True, blank=True)
    question_1 = models.TextField(null=True, blank=True)
    question_2 = models.TextField(null=True, blank=True)
    question_3 = models.TextField(null=True, blank=True)
    question_4 = models.TextField(null=True, blank=True)
    question_5 = models.TextField(null=True, blank=True)

    class Meta:
        db_table = '"public"."science_activity"'
        managed = False

    def __str__(self):
        return f"{self.activity_id} - {self.activity_title or 'Untitled'}"


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

    def __str__(self):
        return f"{self.activity.activity_id} - {self.file_path}"
