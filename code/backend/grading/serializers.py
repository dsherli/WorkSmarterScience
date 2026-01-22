"""
Grading App Serializers
Handles serialization for rubrics, submissions, and grading results.
"""

from rest_framework import serializers
from .models import Rubric, RubricCriterion, AssessmentSubmission, CriterionScore, GradingSession


class RubricCriterionSerializer(serializers.ModelSerializer):
    """Serializer for individual rubric criteria."""
    
    class Meta:
        model = RubricCriterion
        fields = ["id", "name", "description", "max_points", "weight", "order"]


class RubricSerializer(serializers.ModelSerializer):
    """Serializer for rubrics with their criteria."""
    
    criteria = RubricCriterionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Rubric
        fields = [
            "id", "title", "description", "activity_id", 
            "total_points", "is_active", "criteria",
            "created_at", "updated_at"
        ]


class CriterionScoreSerializer(serializers.ModelSerializer):
    """Serializer for criterion-level scores."""
    
    criterion_name = serializers.CharField(source="criterion.name", read_only=True)
    max_points = serializers.IntegerField(source="criterion.max_points", read_only=True)
    
    class Meta:
        model = CriterionScore
        fields = [
            "id", "criterion", "criterion_name", "max_points",
            "points_earned", "feedback", "teacher_points", "teacher_feedback",
            "final_points"
        ]


class AssessmentSubmissionSerializer(serializers.ModelSerializer):
    """Serializer for assessment submissions."""
    
    criterion_scores = CriterionScoreSerializer(many=True, read_only=True)
    student_username = serializers.CharField(source="student.username", read_only=True)
    
    class Meta:
        model = AssessmentSubmission
        fields = [
            "id", "student", "student_username", "activity_id",
            "question_text", "answer_text", "rubric",
            "status", "score", "max_score", "feedback",
            "submitted_at", "graded_at", "graded_by_ai", "ai_model_used",
            "teacher_score", "teacher_feedback", "reviewed_by", "reviewed_at",
            "final_score", "percentage", "criterion_scores"
        ]


class GradingSessionSerializer(serializers.ModelSerializer):
    """Serializer for grading session logs."""
    
    username = serializers.CharField(source="user.username", read_only=True)
    
    class Meta:
        model = GradingSession
        fields = [
            "id", "user", "username", "activity_id",
            "prompt", "response", "model_used", "tokens_used", "created_at"
        ]


# Request/Response serializers for API endpoints

class EvaluateWorkRequestSerializer(serializers.Serializer):
    """Request serializer for evaluating student work."""
    
    question = serializers.CharField(required=True)
    student_answer = serializers.CharField(required=True)
    rubric = serializers.CharField(required=False, allow_blank=True)
    context = serializers.CharField(required=False, allow_blank=True)
    activity_id = serializers.IntegerField(required=False)


class ChatCompletionRequestSerializer(serializers.Serializer):
    """Request serializer for chat completions."""
    
    messages = serializers.ListField(
        child=serializers.DictField(),
        required=True
    )
    temperature = serializers.FloatField(required=False, default=0.7)
    max_tokens = serializers.IntegerField(required=False)


class FeedbackRequestSerializer(serializers.Serializer):
    """Request serializer for generating feedback."""
    
    prompt = serializers.CharField(required=True)
    context = serializers.CharField(required=False, allow_blank=True)
    temperature = serializers.FloatField(required=False, default=0.7)


class GradeSubmissionRequestSerializer(serializers.Serializer):
    """Request serializer for grading a science activity submission."""
    
    submission_id = serializers.IntegerField(required=True, help_text="ID of the ScienceActivitySubmission")
    rubric_json = serializers.JSONField(required=False, help_text="Optional rubric JSON override")
