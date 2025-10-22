from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from .ai_service import get_ai_service
from .serializers import (
    EvaluateWorkSerializer,
    ChatCompletionSerializer,
    FeedbackSerializer,
    GradingSessionSerializer,
    RubricSerializer,
    AssessmentSubmissionSerializer,
    GradeSubmissionRequest,
    CriterionScoreSerializer
)
from .models import GradingSession, Rubric, AssessmentSubmission, CriterionScore


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def evaluate_work(request):
    """
    Evaluate student work using AI
    
    POST /api/grading/evaluate/
    Body: {
        "question": "What is photosynthesis?",
        "student_answer": "Process where plants make food...",
        "rubric": "Optional rubric text",
        "context": "Optional context",
        "activity_id": 123
    }
    """
    serializer = EvaluateWorkSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    ai_service = get_ai_service()
    if not ai_service.is_configured():
        return Response(
            {"error": "AI service not configured. Contact administrator."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    
    try:
        result = ai_service.evaluate_student_work(
            question=serializer.validated_data["question"],
            student_answer=serializer.validated_data["student_answer"],
            rubric=serializer.validated_data.get("rubric"),
            context=serializer.validated_data.get("context")
        )
        
        # Log the grading session
        GradingSession.objects.create(
            user=request.user,
            activity_id=serializer.validated_data.get("activity_id"),
            prompt=f"Q: {serializer.validated_data['question']}\nA: {serializer.validated_data['student_answer']}",
            response=result["content"],
            model_used=result["model"],
            tokens_used=result.get("tokens_used")
        )
        
        return Response({
            "evaluation": result["content"],
            "model": result["model"],
            "tokens_used": result.get("tokens_used")
        })
    
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def chat_completion(request):
    """
    General purpose chat completion endpoint
    
    POST /api/grading/chat/
    Body: {
        "messages": [
            {"role": "system", "content": "You are a helpful assistant"},
            {"role": "user", "content": "Hello!"}
        ],
        "temperature": 0.7,
        "max_tokens": 500
    }
    """
    serializer = ChatCompletionSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    ai_service = get_ai_service()
    if not ai_service.is_configured():
        return Response(
            {"error": "AI service not configured. Contact administrator."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    
    try:
        result = ai_service.chat_completion(
            messages=serializer.validated_data["messages"],
            temperature=serializer.validated_data.get("temperature", 0.7),
            max_tokens=serializer.validated_data.get("max_tokens")
        )
        
        # Log the session (simplified)
        messages_str = str(serializer.validated_data["messages"])
        GradingSession.objects.create(
            user=request.user,
            prompt=messages_str[:500],  # Truncate if too long
            response=result["content"][:500],
            model_used=result["model"],
            tokens_used=result.get("tokens_used")
        )
        
        return Response({
            "content": result["content"],
            "model": result["model"],
            "tokens_used": result.get("tokens_used"),
            "finish_reason": result.get("finish_reason")
        })
    
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_feedback(request):
    """
    Generate educational feedback or assistance
    
    POST /api/grading/feedback/
    Body: {
        "prompt": "Can you explain the water cycle?",
        "context": "Optional context about the student's current work",
        "temperature": 0.7
    }
    """
    serializer = FeedbackSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    ai_service = get_ai_service()
    if not ai_service.is_configured():
        return Response(
            {"error": "AI service not configured. Contact administrator."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    
    try:
        result = ai_service.generate_feedback(
            prompt=serializer.validated_data["prompt"],
            context=serializer.validated_data.get("context"),
            temperature=serializer.validated_data.get("temperature", 0.7)
        )
        
        # Log the session
        GradingSession.objects.create(
            user=request.user,
            prompt=serializer.validated_data["prompt"],
            response=result["content"],
            model_used=result["model"],
            tokens_used=result.get("tokens_used")
        )
        
        return Response({
            "feedback": result["content"],
            "model": result["model"],
            "tokens_used": result.get("tokens_used")
        })
    
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["GET"])
def health_check(request):
    """
    Check if AI service is configured and ready
    
    GET /api/grading/health/
    """
    ai_service = get_ai_service()
    is_configured = ai_service.is_configured()
    
    service_type = "None"
    if is_configured:
        if hasattr(ai_service.client, "azure_endpoint"):
            service_type = "Azure OpenAI"
        else:
            service_type = "OpenAI"
    
    return Response({
        "configured": is_configured,
        "model": ai_service.model if is_configured else None,
        "service": service_type
    })


# Rubric Management ViewSet

class RubricViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing grading rubrics
    
    LIST:   GET    /api/grading/rubrics/
    CREATE: POST   /api/grading/rubrics/
    GET:    GET    /api/grading/rubrics/{id}/
    UPDATE: PUT    /api/grading/rubrics/{id}/
    PATCH:  PATCH  /api/grading/rubrics/{id}/
    DELETE: DELETE /api/grading/rubrics/{id}/
    """
    queryset = Rubric.objects.all()
    serializer_class = RubricSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter rubrics - teachers see all, students see active only"""
        queryset = super().get_queryset()
        
        # Filter by activity_id if provided
        activity_id = self.request.query_params.get("activity_id")
        if activity_id:
            queryset = queryset.filter(activity_id=activity_id)
        
        # Only show active rubrics to non-staff
        if not self.request.user.is_staff:
            queryset = queryset.filter(is_active=True)
        
        return queryset
    
    def perform_create(self, serializer):
        """Set created_by to current user"""
        serializer.save(created_by=self.request.user)


class AssessmentSubmissionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing assessment submissions
    
    LIST:   GET    /api/grading/submissions/
    CREATE: POST   /api/grading/submissions/
    GET:    GET    /api/grading/submissions/{id}/
    UPDATE: PUT    /api/grading/submissions/{id}/
    """
    queryset = AssessmentSubmission.objects.all()
    serializer_class = AssessmentSubmissionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter submissions - students see only their own, teachers see all"""
        queryset = super().get_queryset()
        
        if not self.request.user.is_staff:
            queryset = queryset.filter(student=self.request.user)
        
        # Filter by activity_id if provided
        activity_id = self.request.query_params.get("activity_id")
        if activity_id:
            queryset = queryset.filter(activity_id=activity_id)
        
        # Filter by status if provided
        status_filter = self.request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset
    
    @action(detail=True, methods=["post"], url_path="grade")
    def grade_submission(self, request, pk=None):
        """
        Grade a submission using AI with its associated rubric
        
        POST /api/grading/submissions/{id}/grade/
        Body: {
            "context": "Optional additional context"
        }
        """
        submission = self.get_object()
        
        # Check if submission already graded
        if submission.status == "graded":
            return Response(
                {"message": "Submission already graded. Viewing existing grade."},
                status=status.HTTP_200_OK
            )
        
        # Check if rubric is attached
        if not submission.rubric:
            return Response(
                {"error": "No rubric attached to this submission"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get AI service
        ai_service = get_ai_service()
        if not ai_service.is_configured():
            return Response(
                {"error": "AI service not configured. Contact administrator."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        
        # Update status
        submission.status = "grading"
        submission.save()
        
        try:
            # Prepare rubric data
            rubric = submission.rubric
            rubric_data = {
                "title": rubric.title,
                "total_points": rubric.total_points,
                "criteria": [
                    {
                        "name": criterion.name,
                        "description": criterion.description,
                        "max_points": criterion.max_points,
                        "weight": criterion.weight
                    }
                    for criterion in rubric.criteria.all()
                ]
            }
            
            # Grade with AI
            context = request.data.get("context", "")
            result = ai_service.grade_with_rubric(
                question=submission.question_text,
                student_answer=submission.answer_text,
                rubric_data=rubric_data,
                context=context
            )
            
            # Save results
            submission.score = result["total_score"]
            submission.max_score = result["max_score"]
            submission.feedback = result["overall_feedback"]
            submission.status = "graded"
            submission.graded_at = timezone.now()
            submission.graded_by_ai = True
            submission.ai_model_used = result.get("model_used", "unknown")
            submission.tokens_used = result.get("tokens_used")
            submission.save()
            
            # Save criterion scores
            for criterion_result in result["criterion_results"]:
                # Find matching criterion
                criterion = rubric.criteria.filter(name=criterion_result["criterion_name"]).first()
                if criterion:
                    CriterionScore.objects.create(
                        submission=submission,
                        criterion=criterion,
                        points_earned=criterion_result["points_earned"],
                        feedback=criterion_result["feedback"]
                    )
            
            # Log session
            GradingSession.objects.create(
                user=request.user,
                activity_id=submission.activity_id,
                prompt=f"Rubric: {rubric.title}\nQ: {submission.question_text}\nA: {submission.answer_text}",
                response=result["overall_feedback"],
                model_used=result.get("model_used", "unknown"),
                tokens_used=result.get("tokens_used")
            )
            
            # Return updated submission
            serializer = self.get_serializer(submission)
            return Response(serializer.data)
        
        except Exception as e:
            # Revert status on error
            submission.status = "submitted"
            submission.save()
            
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=["post"], url_path="review")
    def teacher_review(self, request, pk=None):
        """
        Allow teacher to override AI grade
        
        POST /api/grading/submissions/{id}/review/
        Body: {
            "teacher_score": 85.0,
            "teacher_feedback": "Additional feedback"
        }
        """
        if not request.user.is_staff:
            return Response(
                {"error": "Only teachers can review submissions"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        submission = self.get_object()
        
        submission.teacher_score = request.data.get("teacher_score")
        submission.teacher_feedback = request.data.get("teacher_feedback", "")
        submission.reviewed_by = request.user
        submission.reviewed_at = timezone.now()
        submission.status = "reviewed"
        submission.save()
        
        serializer = self.get_serializer(submission)
        return Response(serializer.data)
