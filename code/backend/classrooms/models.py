from django.db import models
from django.contrib.auth.models import User
import random
import string


class Classroom(models.Model):
    GRADE_LEVEL_CHOICES = [
        ('elementary', 'Elementary'),
        ('middle', 'Middle'),
        ('high', 'High'),
    ]
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('archived', 'Archived'),
        ('deleted', 'Deleted'),
    ]

    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    grade_level = models.CharField(max_length=20, choices=GRADE_LEVEL_CHOICES)
    school = models.CharField(max_length=50)
    code = models.CharField(max_length=10, unique=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    term = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table = 'classroom'

    def __str__(self):
        return f"{self.name} ({self.code})"

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = ''.join(random.choices(string.ascii_letters + string.digits, k=5))
        super().save(*args, **kwargs)
