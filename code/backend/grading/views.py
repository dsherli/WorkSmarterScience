"""
Grading App Views
API endpoints for AI-powered grading, feedback, and rubric management.
"""

import json
import logging
from django.utils import timezone
from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from activities.models import ScienceActivitySubmission, ActivityAnswer
from .models import GradingSession, Rubric, ActivityRubricMap
from .ai_service import get_ai_service
from .serializers import (
    EvaluateWorkRequestSerializer,
    ChatCompletionRequestSerializer,
    FeedbackRequestSerializer,
    GradeSubmissionRequestSerializer,
    RubricSerializer,
    GradingSessionSerializer,
)

logger = logging.getLogger(__name__)


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    """
    Check if AI service is configured and available.
    Returns configuration status for frontend display.
    """
    ai_service = get_ai_service()
    return Response(ai_service.get_config_info())


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def evaluate_work(request):
    """
    Evaluate student work using AI.
    
    Request body:
    {
        "question": "What is photosynthesis?",
        "student_answer": "Plants make food from sunlight...",
        "rubric": "Optional grading criteria",
        "context": "Optional additional context",
        "activity_id": 123
    }
    """
    serializer = EvaluateWorkRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    ai_service = get_ai_service()
    if not ai_service.is_configured():
        return Response(
            {"error": "AI service not configured. Please set up API keys."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    
    data = serializer.validated_data
    
    try:
        result = ai_service.evaluate_student_work(
            question=data["question"],
            student_answer=data["student_answer"],
            rubric=data.get("rubric"),
            context=data.get("context"),
        )
        
        # Log the grading session
        GradingSession.objects.create(
            user=request.user,
            activity_id=data.get("activity_id"),
            prompt=f"Q: {data['question']}\nA: {data['student_answer']}",
            response=result["evaluation"],
            model_used=result["model"],
            tokens_used=result.get("tokens_used"),
        )
        
        return Response(result)
        
    except Exception as e:
        logger.error(f"AI evaluation error: {e}")
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def chat_completion(request):
    """
    Send a chat completion request to the AI model.
    
    Request body:
    {
        "messages": [
            {"role": "system", "content": "You are a helpful assistant"},
            {"role": "user", "content": "Explain the water cycle"}
        ],
        "temperature": 0.7,
        "max_tokens": 500
    }
    """
    serializer = ChatCompletionRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    ai_service = get_ai_service()
    if not ai_service.is_configured():
        return Response(
            {"error": "AI service not configured"},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    
    data = serializer.validated_data
    
    try:
        result = ai_service.chat_completion(
            messages=data["messages"],
            temperature=data.get("temperature", 0.7),
            max_tokens=data.get("max_tokens"),
        )
        return Response(result)
        
    except Exception as e:
        logger.error(f"Chat completion error: {e}")
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_feedback(request):
    """
    Generate educational feedback or explanation.
    
    Request body:
    {
        "prompt": "Can you explain cellular respiration?",
        "context": "Optional context",
        "temperature": 0.7
    }
    """
    serializer = FeedbackRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    ai_service = get_ai_service()
    if not ai_service.is_configured():
        return Response(
            {"error": "AI service not configured"},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    
    data = serializer.validated_data
    
    try:
        result = ai_service.generate_feedback(
            prompt=data["prompt"],
            context=data.get("context"),
            temperature=data.get("temperature", 0.7),
        )
        return Response(result)
        
    except Exception as e:
        logger.error(f"Feedback generation error: {e}")
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def grade_submission(request):
    """
    Grade a science activity submission using AI.
    Grades each answer individually and stores feedback in activity_answers table.
    
    Request body:
    {
        "submission_id": 123,
        "rubric_json": { optional rubric override }
    }
    """
    serializer = GradeSubmissionRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    ai_service = get_ai_service()
    if not ai_service.is_configured():
        return Response(
            {"error": "AI service not configured"},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    
    submission_id = serializer.validated_data["submission_id"]
    rubric_override = serializer.validated_data.get("rubric_json")
    
    try:
        submission = ScienceActivitySubmission.objects.select_related("activity").get(
            id=submission_id
        )
    except ScienceActivitySubmission.DoesNotExist:
        return Response(
            {"error": "Submission not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check permissions - only the teacher assigned to grade can do this
    if submission.teacher_id and submission.teacher_id != request.user.id:
        # Allow if user is a teacher (has teacher profile)
        if not hasattr(request.user, "teacher_profile"):
            return Response(
                {"error": "Not authorized to grade this submission"},
                status=status.HTTP_403_FORBIDDEN
            )
    
    # Get the rubric - try override first, then mapped rubric, then default
    rubric_data = rubric_override
    if not rubric_data:
        # Try to find a mapped rubric for this activity
        activity_code = submission.activity.activity_id
        rubric_map = ActivityRubricMap.objects.filter(activity_code=activity_code).first()
        if rubric_map:
            rubric_data = {
                "title": rubric_map.rubric.title,
                "criteria": [
                    {
                        "title": c.name,
                        "description": c.description,
                        "max_points": c.max_points,
                        "weight": c.weight,
                    }
                    for c in rubric_map.rubric.criteria.all()
                ],
                "max_score": rubric_map.rubric.total_points,
            }
    
    # Get all answers for this submission
    answers = ActivityAnswer.objects.filter(submission=submission).order_by("question_number")
    
    if not answers.exists():
        return Response(
            {"error": "No answers found for this submission"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    grading_results = []
    total_score = 0
    max_possible = 0
    total_tokens = 0
    
    # Grade each answer
    for answer in answers:
        try:
            # Build the rubric text for this question
            rubric_text = None
            if rubric_data and "criteria" in rubric_data:
                rubric_text = json.dumps(rubric_data["criteria"], indent=2)
            
            result = ai_service.evaluate_student_work(
                question=answer.question_text,
                student_answer=answer.student_answer or "",
                rubric=rubric_text,
                context=f"Activity: {submission.activity.activity_title}",
            )
            
            # Parse the evaluation result
            try:
                evaluation = json.loads(result["evaluation"])
                question_score = evaluation.get("score", 0)
                feedback = evaluation.get("feedback", result["evaluation"])
            except (json.JSONDecodeError, TypeError):
                # If not JSON, use the raw text as feedback
                question_score = 0
                feedback = result["evaluation"]
            
            # Update the answer with AI feedback
            answer.ai_feedback = feedback
            answer.score = question_score
            answer.save(update_fields=["ai_feedback", "score", "updated_at"])
            
            grading_results.append({
                "question_number": answer.question_number,
                "question_text": answer.question_text,
                "student_answer": answer.student_answer,
                "score": question_score,
                "feedback": feedback,
            })
            
            total_score += question_score
            max_possible += 100  # Each question is out of 100
            total_tokens += result.get("tokens_used", 0) or 0
            
        except Exception as e:
            logger.error(f"Error grading answer {answer.id}: {e}")
            grading_results.append({
                "question_number": answer.question_number,
                "error": str(e),
            })
    
    # Update the submission status and overall score
    if max_possible > 0:
        normalized_score = (total_score / max_possible) * 100
    else:
        normalized_score = 0
    
    submission.status = "graded"
    submission.score = round(normalized_score, 2)
    submission.feedback_overview = f"AI grading completed for {len(grading_results)} questions."
    submission.save(update_fields=["status", "score", "feedback_overview"])
    
    # Log the grading session
    GradingSession.objects.create(
        user=request.user,
        activity_id=submission.activity.id,
        prompt=f"Grade submission #{submission_id} with {len(answers)} answers",
        response=json.dumps(grading_results),
        model_used=ai_service._model or "unknown",
        tokens_used=total_tokens,
    )
    
    return Response({
        "submission_id": submission.id,
        "status": "graded",
        "overall_score": submission.score,
        "answers_graded": len(grading_results),
        "tokens_used": total_tokens,
        "results": grading_results,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def update_teacher_feedback(request):
    """
    Allow teacher to update/override AI feedback for an answer.
    
    Request body:
    {
        "answer_id": 123,
        "teacher_feedback": "Good work, but consider...",
        "score": 85
    }
    """
    answer_id = request.data.get("answer_id")
    teacher_feedback = request.data.get("teacher_feedback")
    score = request.data.get("score")
    
    if not answer_id:
        return Response(
            {"error": "answer_id is required"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        answer = ActivityAnswer.objects.select_related("submission").get(id=answer_id)
    except ActivityAnswer.DoesNotExist:
        return Response(
            {"error": "Answer not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Update fields
    if teacher_feedback is not None:
        answer.teacher_feedback = teacher_feedback
    if score is not None:
        answer.score = score
    
    answer.save(update_fields=["teacher_feedback", "score", "updated_at"])
    
    return Response({
        "answer_id": answer.id,
        "teacher_feedback": answer.teacher_feedback,
        "score": float(answer.score) if answer.score else None,
        "updated_at": answer.updated_at,
    })


class RubricListCreateView(generics.ListCreateAPIView):
    """List all rubrics or create a new one."""
    
    serializer_class = RubricSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Rubric.objects.filter(is_active=True).prefetch_related("criteria")
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class RubricDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a rubric."""
    
    serializer_class = RubricSerializer
    permission_classes = [IsAuthenticated]
    queryset = Rubric.objects.prefetch_related("criteria")


class GradingSessionListView(generics.ListAPIView):
    """List grading sessions for audit/analytics."""
    
    serializer_class = GradingSessionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = GradingSession.objects.select_related("user")
        
        # Filter by user if not staff
        if not self.request.user.is_staff:
            queryset = queryset.filter(user=self.request.user)
        
        # Optional filters
        activity_id = self.request.query_params.get("activity_id")
        if activity_id:
            queryset = queryset.filter(activity_id=activity_id)
        
        return queryset.order_by("-created_at")[:100]
