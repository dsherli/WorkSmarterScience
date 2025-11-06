from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes, action, parser_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
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
from .models import GradingSession, Rubric, AssessmentSubmission, CriterionScore, ActivityRubricMap, RubricCriterion
from activities.models import ScienceActivity
from django.contrib.auth.decorators import user_passes_test
from django.db import transaction
import json


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


# --- Rubric import & mapping endpoints ---

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def rubric_mappings(request):
    """List current activity->rubric mappings with rubric titles."""
    mappings = ActivityRubricMap.objects.select_related("rubric").all()
    data = [
        {
            "activity_code": m.activity_code,
            "rubric_id": m.rubric.id,
            "rubric_title": m.rubric.title,
            "assignment_id": m.assignment_id,
            "created_at": m.created_at,
        }
        for m in mappings
    ]
    return Response(data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def set_rubric_mapping(request):
    """Set or update a mapping between an activity_code and a rubric_id."""
    if not request.user.is_staff:
        return Response({"error": "Only staff can set mappings"}, status=status.HTTP_403_FORBIDDEN)

    activity_code = request.data.get("activity_code")
    rubric_id = request.data.get("rubric_id")
    assignment_id = request.data.get("assignment_id", "")
    if not activity_code or not rubric_id:
        return Response({"error": "activity_code and rubric_id are required"}, status=status.HTTP_400_BAD_REQUEST)
    try:
        rubric = Rubric.objects.get(id=rubric_id)
    except Rubric.DoesNotExist:
        return Response({"error": "Rubric not found"}, status=status.HTTP_404_NOT_FOUND)

    mapping, _ = ActivityRubricMap.objects.update_or_create(
        activity_code=activity_code,
        defaults={"rubric": rubric, "assignment_id": assignment_id},
    )
    return Response({
        "activity_code": mapping.activity_code,
        "rubric_id": mapping.rubric.id,
        "rubric_title": mapping.rubric.title,
        "assignment_id": mapping.assignment_id,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def import_rubric_upload(request):
    """Upload a rubric JSON file and (optionally) map it to an activity_code.

    Form fields:
      - file: uploaded JSON
      - activity_code: optional (string like '013.03-c02')
      - user_id: optional (creator); defaults to request.user.id
    """
    if not request.user.is_staff:
        return Response({"error": "Only staff can import rubrics"}, status=status.HTTP_403_FORBIDDEN)

    if "file" not in request.FILES:
        return Response({"error": "Missing file"}, status=status.HTTP_400_BAD_REQUEST)

    activity_code = request.POST.get("activity_code")
    creator = request.user

    try:
        raw = request.FILES["file"].read().decode("utf-8")
        data = json.loads(raw)
    except Exception as e:
        return Response({"error": f"Invalid JSON: {e}"}, status=status.HTTP_400_BAD_REQUEST)

    # Build rubric from JSON (similar to management command)
    learning_target = data.get("learning_target", "")
    rubric_description = learning_target
    if "metadata" in data:
        md = data["metadata"]
        rubric_description += f"\n\nSource: {md.get('source_document', 'N/A')}"
        if md.get("aligned_ngss"):
            rubric_description += f"\nAligned to: {', '.join(md['aligned_ngss'])}"

    with transaction.atomic():
        rubric = Rubric.objects.create(
            title=data.get("task_title", data.get("assignment_id", "Untitled Rubric")),
            description=rubric_description,
            total_points=data.get("max_score", 100),
            created_by=creator,
            is_active=True,
        )

        # Create criteria with enriched description
        for idx, criterion_data in enumerate(data.get("criteria", [])):
            criterion_title = criterion_data.get("title", f"Criterion {idx+1}")
            description = criterion_title + "\n\n"

            levels = criterion_data.get("levels", [])
            if levels:
                description += "Performance Levels:\n"
                for level in levels:
                    level_name = level.get("name", "Unknown")
                    level_score = level.get("score")
                    level_desc = level.get("description", "")
                    if level_score is not None:
                        description += f"• {level_name} ({level_score} pts): {level_desc}\n"
                    else:
                        description += f"• {level_name}: {level_desc}\n"
                description += "\n"

            examples = criterion_data.get("examples", {})
            if examples:
                description += "Examples:\n"
                for k, v in examples.items():
                    if v:
                        description += f"• {k.title()}: {v}\n"
                description += "\n"

            auto_eval = criterion_data.get("auto_eval_rules", {})
            if auto_eval:
                description += "Evaluation Guidelines:\n"
                if auto_eval.get("keywords_proficient"):
                    description += f"Look for: {', '.join(auto_eval['keywords_proficient'])}\n"
                if auto_eval.get("keywords_incorrect"):
                    description += f"Avoid: {', '.join(auto_eval['keywords_incorrect'])}\n"
                if isinstance(auto_eval.get("pattern_checks"), dict):
                    for ck, cv in auto_eval["pattern_checks"].items():
                        description += f"{ck}: {cv}\n"

            # Determine max_points from levels or weight
            max_points = 0
            if levels:
                scores = [lvl.get("score", 0) for lvl in levels if lvl.get("score") is not None]
                if scores:
                    max_points = max(scores)
            if max_points == 0:
                # Default weight if missing: split evenly across criteria (avoid div by zero)
                criteria_count = max(len(data.get("criteria", [])), 1)
                weight = criterion_data.get("weight", 1.0 / criteria_count)
                max_points = int(weight * data.get("max_score", 100)) or 1

            RubricCriterion.objects.create(
                rubric=rubric,
                name=criterion_data.get("id", criterion_title),
                description=description.strip(),
                max_points=max_points,
                weight=criterion_data.get("weight", 1.0),
                order=idx,
            )

        # Optionally create mapping
        mapping_payload = None
        if activity_code:
            mapping, _ = ActivityRubricMap.objects.update_or_create(
                activity_code=activity_code,
                defaults={
                    "rubric": rubric,
                    "assignment_id": data.get("assignment_id", ""),
                },
            )
            mapping_payload = {
                "activity_code": mapping.activity_code,
                "rubric_id": mapping.rubric.id,
                "rubric_title": mapping.rubric.title,
                "assignment_id": mapping.assignment_id,
            }

    return Response({
        "message": "Rubric imported successfully",
        "rubric_id": rubric.id,
        "rubric_title": rubric.title,
        "mapped": mapping_payload is not None,
        "mapping": mapping_payload,
    }, status=status.HTTP_201_CREATED)


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
    
    def perform_create(self, serializer):
        """Set student to current user"""
        serializer.save(student=self.request.user)
    
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
        
        # Ensure a rubric is attached; if missing, try to auto-map from activity_code
        if not submission.rubric:
            mapping = None
            # Heuristic: submission.activity_id is an integer like 5 for codes like '005.04-c01'
            try:
                prefix = f"{int(submission.activity_id):03d}."
                mapping = ActivityRubricMap.objects.select_related("rubric").filter(activity_code__startswith=prefix).first()
            except Exception:
                mapping = None

            # Fallback: try to load ScienceActivity by any means and map via exact code
            if not mapping:
                try:
                    # Prefer finding by code in the questions/context is not viable here; try DB id pk then
                    activity = ScienceActivity.objects.filter(id=submission.activity_id).first()
                    if activity:
                        mapping = ActivityRubricMap.objects.select_related("rubric").filter(activity_code=activity.activity_id).first()
                except Exception:
                    mapping = None

            if mapping:
                submission.rubric = mapping.rubric
                submission.save(update_fields=["rubric"]) 
            else:
                return Response(
                    {"error": "No rubric attached and no mapping found for this activity"},
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
            # New default: level-based grading per question
            request_context = request.data.get("context", "")

            # If a rubric is attached, include a concise rubric summary in the context
            rubric_summary = ""
            if submission.rubric:
                r = submission.rubric
                rubric_summary_lines = [
                    f"Rubric: {r.title}",
                ]
                # Add top-level description if present
                if r.description:
                    rubric_summary_lines.append(r.description)
                rubric_summary_lines.append("Criteria (use to inform levels):")
                for c in r.criteria.all():
                    rubric_summary_lines.append(f"- {c.name}: {c.description}")
                rubric_summary = "\n".join(rubric_summary_lines)

            combined_context = request_context
            if rubric_summary:
                combined_context = (request_context + "\n\n" if request_context else "") + rubric_summary

            lvl_result = ai_service.grade_levels_by_question(
                question_text=submission.question_text,
                answer_text=submission.answer_text,
                context=combined_context,
            )

            # Save minimal results (no points)
            submission.score = None
            submission.max_score = None
            submission.feedback = lvl_result.get("overall_feedback", "")
            submission.status = "graded"
            submission.graded_at = timezone.now()
            submission.graded_by_ai = True
            submission.ai_model_used = lvl_result.get("model_used", "unknown")
            submission.tokens_used = lvl_result.get("tokens_used")
            submission.save()

            # Clear any existing criterion scores since we are not using points here
            submission.criterion_scores.all().delete()

            # Log session
            GradingSession.objects.create(
                user=request.user,
                activity_id=submission.activity_id,
                prompt=f"Level grading per question\nQ: {submission.question_text}\nA: {submission.answer_text}",
                response=lvl_result.get("overall_feedback", ""),
                model_used=lvl_result.get("model_used", "unknown"),
                tokens_used=lvl_result.get("tokens_used"),
            )

            # Return submission plus question_levels in payload
            serializer = self.get_serializer(submission)
            data = serializer.data
            data["question_levels"] = lvl_result.get("questions", [])
            return Response(data)
        
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
