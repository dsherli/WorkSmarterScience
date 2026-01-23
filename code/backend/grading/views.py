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
from rest_framework.parsers import MultiPartParser, FormParser
from .models import RubricCriterion
from .serializers import (
    EvaluateWorkRequestSerializer,
    ChatCompletionRequestSerializer,
    FeedbackRequestSerializer,
    GradeSubmissionRequestSerializer,
    RubricSerializer,
    GradingSessionSerializer,
    ActivityRubricMapSerializer,
    RubricImportSerializer,
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


# ==================== Rubric Mappings API ====================

class RubricMappingListView(generics.ListAPIView):
    """List all activity-to-rubric mappings."""
    
    serializer_class = ActivityRubricMapSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ActivityRubricMap.objects.select_related("rubric").order_by("-created_at")


from rest_framework.views import APIView

class RubricMappingSetView(APIView):
    """Create or update an activity-to-rubric mapping."""
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        activity_code = request.data.get("activity_code")
        rubric_id = request.data.get("rubric_id")
        assignment_id = request.data.get("assignment_id", "")
        
        if not activity_code:
            return Response(
                {"error": "activity_code is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not rubric_id:
            return Response(
                {"error": "rubric_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            rubric = Rubric.objects.get(id=rubric_id)
        except Rubric.DoesNotExist:
            return Response(
                {"error": f"Rubric with id {rubric_id} not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Upsert: update if exists, create if not
        mapping, created = ActivityRubricMap.objects.update_or_create(
            activity_code=activity_code,
            defaults={
                "rubric": rubric,
                "assignment_id": assignment_id,
            }
        )
        
        return Response({
            "id": mapping.id,
            "activity_code": mapping.activity_code,
            "rubric_id": rubric.id,
            "rubric_title": rubric.title,
            "assignment_id": mapping.assignment_id,
            "created_at": mapping.created_at,
            "created": created,
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class RubricImportView(APIView):
    """Import a rubric from JSON file and optionally map it to an activity."""
    
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        file = request.FILES.get("file")
        activity_code = request.data.get("activity_code")
        
        if not file:
            return Response(
                {"error": "No file provided"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            content = file.read().decode("utf-8")
            data = json.loads(content)
        except (json.JSONDecodeError, UnicodeDecodeError) as e:
            return Response(
                {"error": f"Invalid JSON file: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate the data
        serializer = RubricImportSerializer(data=data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        validated = serializer.validated_data
        
        # Create the rubric
        rubric = Rubric.objects.create(
            title=validated["title"],
            description=validated.get("description", ""),
            total_points=validated.get("total_points", 100),
            created_by=request.user,
            is_active=True,
        )
        
        # Create the criteria
        criteria = validated.get("criteria", [])
        for idx, criterion_data in enumerate(criteria):
            RubricCriterion.objects.create(
                rubric=rubric,
                name=criterion_data.get("name") or criterion_data.get("title", f"Criterion {idx + 1}"),
                description=criterion_data.get("description", ""),
                max_points=criterion_data.get("max_points", 10),
                weight=criterion_data.get("weight", 1.0),
                order=criterion_data.get("order", idx),
            )
        
        # Recalculate total points
        rubric.total_points = rubric.calculate_total_points() or validated.get("total_points", 100)
        rubric.save(update_fields=["total_points"])
        
        response_data = {
            "rubric_id": rubric.id,
            "rubric_title": rubric.title,
            "criteria_count": len(criteria),
            "total_points": rubric.total_points,
        }
        
        # Optionally map to activity
        if activity_code:
            mapping, created = ActivityRubricMap.objects.update_or_create(
                activity_code=activity_code,
                defaults={"rubric": rubric}
            )
            response_data["mapping"] = {
                "id": mapping.id,
                "activity_code": mapping.activity_code,
                "rubric_id": rubric.id,
                "rubric_title": rubric.title,
            }
        
        return Response(response_data, status=status.HTTP_201_CREATED)


# ==================== Assessment Submission API ====================

from .models import AssessmentSubmission, CriterionScore
from .serializers import AssessmentSubmissionSerializer


class SubmissionListCreateView(generics.ListCreateAPIView):
    """List all submissions or create a new one."""
    
    serializer_class = AssessmentSubmissionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = AssessmentSubmission.objects.select_related(
            "student", "rubric"
        ).prefetch_related("criterion_scores")
        
        # Filter by activity_id if provided
        activity_id = self.request.query_params.get("activity_id")
        if activity_id:
            queryset = queryset.filter(activity_id=activity_id)
        
        # Filter by status if provided
        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Students can only see their own submissions
        if not self.request.user.is_staff:
            queryset = queryset.filter(student=self.request.user)
        
        return queryset.order_by("-submitted_at")
    
    def perform_create(self, serializer):
        serializer.save(student=self.request.user, status="submitted")


class SubmissionDetailView(generics.RetrieveAPIView):
    """Retrieve a single submission."""
    
    serializer_class = AssessmentSubmissionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = AssessmentSubmission.objects.select_related(
            "student", "rubric"
        ).prefetch_related("criterion_scores")
        
        # Students can only see their own submissions
        if not self.request.user.is_staff:
            queryset = queryset.filter(student=self.request.user)
        
        return queryset


class SubmissionGradeView(APIView):
    """Grade a submission using AI."""
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        try:
            submission = AssessmentSubmission.objects.select_related("rubric").get(pk=pk)
        except AssessmentSubmission.DoesNotExist:
            return Response(
                {"error": "Submission not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        ai_service = get_ai_service()
        if not ai_service.is_configured():
            return Response(
                {"error": "AI service not configured"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        context = request.data.get("context", "")
        
        # Build rubric text if available
        rubric_text = None
        if submission.rubric:
            criteria = submission.rubric.criteria.all()
            rubric_text = json.dumps([
                {
                    "name": c.name,
                    "description": c.description,
                    "max_points": c.max_points,
                }
                for c in criteria
            ], indent=2)
        
        try:
            # Update status
            submission.status = "grading"
            submission.save(update_fields=["status"])
            
            result = ai_service.evaluate_student_work(
                question=submission.question_text,
                student_answer=submission.answer_text,
                rubric=rubric_text,
                context=context,
            )
            
            # Parse evaluation
            try:
                evaluation = json.loads(result["evaluation"])
                score = evaluation.get("score", 0)
                feedback = evaluation.get("feedback", result["evaluation"])
            except (json.JSONDecodeError, TypeError):
                score = 0
                feedback = result["evaluation"]
            
            # Update submission
            submission.status = "graded"
            submission.score = score
            submission.max_score = submission.rubric.total_points if submission.rubric else 100
            submission.feedback = feedback
            submission.graded_at = timezone.now()
            submission.graded_by_ai = True
            submission.ai_model_used = result.get("model", "unknown")
            submission.tokens_used = result.get("tokens_used")
            submission.save()
            
            # Log session
            GradingSession.objects.create(
                user=request.user,
                activity_id=submission.activity_id,
                prompt=f"Grade submission #{pk}",
                response=feedback,
                model_used=submission.ai_model_used,
                tokens_used=submission.tokens_used,
            )
            
            return Response(AssessmentSubmissionSerializer(submission).data)
            
        except Exception as e:
            logger.error(f"Error grading submission {pk}: {e}")
            submission.status = "submitted"
            submission.save(update_fields=["status"])
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class SubmissionReviewView(APIView):
    """Allow teacher to review and override AI grading."""
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        try:
            submission = AssessmentSubmission.objects.get(pk=pk)
        except AssessmentSubmission.DoesNotExist:
            return Response(
                {"error": "Submission not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        teacher_score = request.data.get("teacher_score")
        teacher_feedback = request.data.get("teacher_feedback")
        
        if teacher_score is not None:
            submission.teacher_score = teacher_score
        if teacher_feedback is not None:
            submission.teacher_feedback = teacher_feedback
        
        submission.status = "reviewed"
        submission.reviewed_by = request.user
        submission.reviewed_at = timezone.now()
        submission.save()
        
        return Response(AssessmentSubmissionSerializer(submission).data)
