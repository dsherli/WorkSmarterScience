from django.db import models

class ScienceActivity(models.Model):
    activity_id = models.CharField(max_length=50)
    pe = models.CharField(max_length=50)
    lp = models.CharField(max_length=50)
    lp_text = models.TextField()
    activity_title = models.CharField(max_length=255)
    activity_task = models.TextField(null=True, blank=True)
    question_1 = models.TextField(null=True, blank=True)
    question_2 = models.TextField(null=True, blank=True)
    question_3 = models.TextField(null=True, blank=True)
    question_4 = models.TextField(null=True, blank=True)
    question_5 = models.TextField(null=True, blank=True)

    class Meta:
        db_table = '"public"."science_activity"'
        managed = False


class ScienceActivityImage(models.Model):
    """
    Images associated with science activities.
    Separate table with foreign key relationship to ScienceActivity.
    """
    activity = models.ForeignKey(
        ScienceActivity,
        on_delete=models.CASCADE,
        related_name='images',
        db_column='activity_id'
    )
    file_path = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    media_type = models.CharField(max_length=50, null=True, blank=True)
    uploaded_at = models.DateTimeField()

    class Meta:
        db_table = '"public"."science_activity_images"'
        managed = False

