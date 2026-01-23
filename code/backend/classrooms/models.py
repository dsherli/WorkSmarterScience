from django.db import models
from django.contrib.auth.models import User
import random
import string


class Classroom(models.Model):
    GRADE_LEVEL_CHOICES = [
        ("elementary", "Elementary"),
        ("middle", "Middle"),
        ("high", "High"),
    ]
    STATUS_CHOICES = [
        ("active", "Active"),
        ("archived", "Archived"),
        ("deleted", "Deleted"),
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
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    term = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table = "classroom"

    def __str__(self):
        return f"{self.name} ({self.code})"

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = "".join(
                random.choices(string.ascii_letters + string.digits, k=5)
            )
        super().save(*args, **kwargs)


class ClassroomTable(models.Model):
    classroom = models.ForeignKey(
        Classroom, related_name="tables", on_delete=models.CASCADE
    )
    name = models.CharField(max_length=50)
    x_position = models.FloatField(default=0)
    y_position = models.FloatField(default=0)
    rotation = models.FloatField(default=0)

    class Meta:
        db_table = "classroom_table"

    def __str__(self):
        return f"{self.name} - {self.classroom.name}"


class TableMessage(models.Model):
    table = models.ForeignKey(
        ClassroomTable, related_name="messages", on_delete=models.CASCADE
    )
    sender = models.ForeignKey(User, related_name="table_messages", on_delete=models.CASCADE)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "table_message"
        ordering = ["timestamp"]


class Enrollment(models.Model):
    classroom = models.ForeignKey(
        Classroom, related_name="enrollments", on_delete=models.CASCADE
    )
    student = models.ForeignKey(
        User, related_name="classroom_enrollments", on_delete=models.CASCADE
    )
    assigned_table = models.ForeignKey(
        ClassroomTable,
        related_name="students",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("classroom", "student")
        db_table = "classroom_enrollment"


class ClassroomActivity(models.Model):
    classroom = models.ForeignKey(
        Classroom, related_name="activities", on_delete=models.CASCADE
    )
    activity_id = models.CharField(max_length=50)
    assigned_at = models.DateTimeField(auto_now_add=True)
    assigned_by = models.ForeignKey(
        User,
        related_name="classroom_activity_assignments_created",
        on_delete=models.CASCADE,
        blank=True,
        null=True,
    )
    due_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        unique_together = ("classroom", "activity_id")
        db_table = "classroom_activity"

    def __str__(self):
        return f"{self.activity_id} -> {self.classroom.name}"


class ClassroomActivityAssignment(models.Model):
    STATUS_CHOICES = [
        ("assigned", "Assigned"),
        ("submitted", "Submitted"),
        ("completed", "Completed"),
        ("late", "Late"),
    ]

    classroom_activity = models.ForeignKey(
        ClassroomActivity, related_name="student_assignments", on_delete=models.CASCADE
    )
    student = models.ForeignKey(
        User, related_name="activity_assignments", on_delete=models.CASCADE
    )
    due_at = models.DateTimeField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="assigned")
    submitted_at = models.DateTimeField(blank=True, null=True)
    score = models.FloatField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("classroom_activity", "student")
        db_table = "classroom_activity_assignment"

    def __str__(self):
        return f"{self.student.username} -> {self.classroom_activity.activity_id}"
