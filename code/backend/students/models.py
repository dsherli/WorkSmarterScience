from django.db import models
from django.contrib.auth.models import User

if not hasattr(User, "role"):
    User.add_to_class("role", models.CharField(max_length=20, blank=True, null=True))


class StudentProfile(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="student_profile"
    )
    school = models.CharField(max_length=255, blank=True)
    grade = models.CharField(max_length=50, blank=True)

    def __str__(self):
        return f"{self.user.username} profile"
