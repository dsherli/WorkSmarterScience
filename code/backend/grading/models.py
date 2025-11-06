from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator


class GradingSession(models.Model):
    """Track AI grading sessions for audit and analytics"""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    activity_id = models.IntegerField(null=True, blank=True)
    prompt = models.TextField()
    response = models.TextField()
    model_used = models.CharField(max_length=100, default="gpt-4")
    tokens_used = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ["-created_at"]
    
    def __str__(self):
        return f"GradingSession {self.id} - {self.created_at}"


class Rubric(models.Model):
    """Grading rubric with multiple criteria"""
    
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    activity_id = models.IntegerField(null=True, blank=True, help_text="Associated activity/assessment")
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="rubrics")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    # Total points possible (sum of all criteria max points)
    total_points = models.IntegerField(default=100, validators=[MinValueValidator(1)])
    
    class Meta:
        ordering = ["-created_at"]
    
    def __str__(self):
        return f"{self.title} ({self.total_points} pts)"
    
    def calculate_total_points(self):
        """Calculate total points from all criteria"""
        return sum(criterion.max_points for criterion in self.criteria.all())


class RubricCriterion(models.Model):
    """Individual criterion within a rubric"""
    
    rubric = models.ForeignKey(Rubric, on_delete=models.CASCADE, related_name="criteria")
    name = models.CharField(max_length=255, help_text="e.g., 'Accuracy', 'Completeness', 'Clarity'")
    description = models.TextField(help_text="What to look for in this criterion")
    max_points = models.IntegerField(validators=[MinValueValidator(1)])
    weight = models.FloatField(
        default=1.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
        help_text="Weight of this criterion (0.0 to 1.0)"
    )
    order = models.IntegerField(default=0, help_text="Display order")
    
    class Meta:
        ordering = ["order", "id"]
        unique_together = ["rubric", "name"]
    
    def __str__(self):
        return f"{self.name} ({self.max_points} pts)"


class AssessmentSubmission(models.Model):
    """Student submission for an assessment"""
    
    STATUS_CHOICES = [
        ("submitted", "Submitted"),
        ("grading", "Grading in Progress"),
        ("graded", "Graded"),
        ("reviewed", "Reviewed by Teacher"),
    ]
    
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name="submissions")
    activity_id = models.IntegerField()
    question_text = models.TextField()
    answer_text = models.TextField()
    rubric = models.ForeignKey(Rubric, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Grading results
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="submitted")
    score = models.FloatField(null=True, blank=True, help_text="Total score received")
    max_score = models.FloatField(null=True, blank=True, help_text="Total points possible")
    feedback = models.TextField(blank=True, help_text="Overall feedback from AI")
    
    # Metadata
    submitted_at = models.DateTimeField(auto_now_add=True)
    graded_at = models.DateTimeField(null=True, blank=True)
    graded_by_ai = models.BooleanField(default=False)
    ai_model_used = models.CharField(max_length=100, blank=True)
    tokens_used = models.IntegerField(null=True, blank=True)
    
    # Teacher override
    teacher_score = models.FloatField(null=True, blank=True)
    teacher_feedback = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name="reviewed_submissions"
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ["-submitted_at"]
        indexes = [
            models.Index(fields=["student", "activity_id"]),
            models.Index(fields=["status"]),
        ]
    
    def __str__(self):
        return f"Submission by {self.student.username} - Activity {self.activity_id}"
    
    @property
    def final_score(self):
        """Return teacher score if available, otherwise AI score"""
        return self.teacher_score if self.teacher_score is not None else self.score
    
    @property
    def percentage(self):
        """Calculate percentage score"""
        if self.final_score is not None and self.max_score:
            return (self.final_score / self.max_score) * 100
        return None


class CriterionScore(models.Model):
    """Score for individual criterion in a submission"""
    
    submission = models.ForeignKey(AssessmentSubmission, on_delete=models.CASCADE, related_name="criterion_scores")
    criterion = models.ForeignKey(RubricCriterion, on_delete=models.CASCADE)
    
    # AI grading
    points_earned = models.FloatField(validators=[MinValueValidator(0)])
    feedback = models.TextField(help_text="Specific feedback for this criterion")
    
    # Teacher override
    teacher_points = models.FloatField(null=True, blank=True)
    teacher_feedback = models.TextField(blank=True)
    
    class Meta:
        unique_together = ["submission", "criterion"]
    
    def __str__(self):
        return f"{self.criterion.name}: {self.points_earned}/{self.criterion.max_points}"
    
    @property
    def final_points(self):
        """Return teacher points if available, otherwise AI points"""
        return self.teacher_points if self.teacher_points is not None else self.points_earned


class ActivityRubricMap(models.Model):
    """Map a Science Activity (by code) to a Rubric.

    We use the string activity code, e.g., '013.03-c02', to avoid mismatches
    with the integer-based Rubric.activity_id field.
    """

    activity_code = models.CharField(max_length=50, unique=True)
    rubric = models.ForeignKey(Rubric, on_delete=models.CASCADE, related_name="activity_mappings")
    assignment_id = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.activity_code} -> {self.rubric.title}"
