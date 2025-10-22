from rest_framework import serializers
from .models import GradingSession, Rubric, RubricCriterion, AssessmentSubmission, CriterionScore


class GradingSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = GradingSession
        fields = ["id", "activity_id", "prompt", "response", "model_used", "tokens_used", "created_at"]
        read_only_fields = ["id", "created_at", "model_used", "tokens_used"]


class RubricCriterionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RubricCriterion
        fields = ["id", "name", "description", "max_points", "weight", "order"]
        read_only_fields = ["id"]


class RubricSerializer(serializers.ModelSerializer):
    criteria = RubricCriterionSerializer(many=True, read_only=False)
    created_by_username = serializers.CharField(source="created_by.username", read_only=True)
    
    class Meta:
        model = Rubric
        fields = [
            "id", "title", "description", "activity_id", "created_by", "created_by_username",
            "created_at", "updated_at", "is_active", "total_points", "criteria"
        ]
        read_only_fields = ["id", "created_by", "created_at", "updated_at"]
    
    def create(self, validated_data):
        criteria_data = validated_data.pop("criteria", [])
        rubric = Rubric.objects.create(**validated_data)
        
        for criterion_data in criteria_data:
            RubricCriterion.objects.create(rubric=rubric, **criterion_data)
        
        return rubric
    
    def update(self, instance, validated_data):
        criteria_data = validated_data.pop("criteria", None)
        
        # Update rubric fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update criteria if provided
        if criteria_data is not None:
            # Delete existing criteria and recreate
            instance.criteria.all().delete()
            for criterion_data in criteria_data:
                RubricCriterion.objects.create(rubric=instance, **criterion_data)
        
        return instance


class CriterionScoreSerializer(serializers.ModelSerializer):
    criterion_name = serializers.CharField(source="criterion.name", read_only=True)
    criterion_max_points = serializers.IntegerField(source="criterion.max_points", read_only=True)
    
    class Meta:
        model = CriterionScore
        fields = [
            "id", "criterion", "criterion_name", "criterion_max_points",
            "points_earned", "feedback", "teacher_points", "teacher_feedback", "final_points"
        ]
        read_only_fields = ["id", "points_earned", "feedback", "final_points"]


class AssessmentSubmissionSerializer(serializers.ModelSerializer):
    criterion_scores = CriterionScoreSerializer(many=True, read_only=True)
    student_username = serializers.CharField(source="student.username", read_only=True)
    rubric_title = serializers.CharField(source="rubric.title", read_only=True)
    
    class Meta:
        model = AssessmentSubmission
        fields = [
            "id", "student", "student_username", "activity_id", "question_text", "answer_text",
            "rubric", "rubric_title", "status", "score", "max_score", "feedback",
            "submitted_at", "graded_at", "graded_by_ai", "ai_model_used", "tokens_used",
            "teacher_score", "teacher_feedback", "reviewed_by", "reviewed_at",
            "final_score", "percentage", "criterion_scores"
        ]
        read_only_fields = [
            "id", "student", "submitted_at", "graded_at", "graded_by_ai", "ai_model_used",
            "tokens_used", "final_score", "percentage"
        ]


class GradeSubmissionRequest(serializers.Serializer):
    """Request to grade a submission with a rubric"""
    submission_id = serializers.IntegerField()
    context = serializers.CharField(required=False, allow_blank=True, help_text="Optional additional context")


class EvaluateWorkSerializer(serializers.Serializer):
    """Serializer for student work evaluation requests"""
    question = serializers.CharField()
    student_answer = serializers.CharField()
    rubric = serializers.CharField(required=False, allow_blank=True)
    context = serializers.CharField(required=False, allow_blank=True)
    activity_id = serializers.IntegerField(required=False)


class ChatCompletionSerializer(serializers.Serializer):
    """Serializer for general chat completion requests"""
    messages = serializers.ListField(
        child=serializers.DictField(),
        help_text="Array of message objects with 'role' and 'content' keys"
    )
    temperature = serializers.FloatField(default=0.7, min_value=0.0, max_value=2.0)
    max_tokens = serializers.IntegerField(required=False, allow_null=True)


class FeedbackSerializer(serializers.Serializer):
    """Serializer for general feedback/assistance requests"""
    prompt = serializers.CharField()
    context = serializers.CharField(required=False, allow_blank=True)
    temperature = serializers.FloatField(default=0.7, min_value=0.0, max_value=2.0)
