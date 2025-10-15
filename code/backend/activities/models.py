from django.db import models

class ScienceActivity(models.Model):
    activity_id = models.CharField(max_length=50)
    pe = models.CharField(max_length=50)
    lp = models.CharField(max_length=50)
    lp_text = models.TextField()
    activity_title = models.CharField(max_length=255)
    activity_task = models.TextField(null=True, blank=True)
    activity_image = models.ImageField(upload_to='activities/', blank=True, null=True)
    image_description = models.TextField(null=True, blank=True)
    question_1 = models.TextField(null=True, blank=True)
    question_2 = models.TextField(null=True, blank=True)
    question_3 = models.TextField(null=True, blank=True)
    question_4 = models.TextField(null=True, blank=True)
    question_5 = models.TextField(null=True, blank=True)

    class Meta:
        db_table = '"public"."science_activity"'
        managed = False
