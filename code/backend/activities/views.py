from django.conf import settings
from django.db import connection
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from classrooms.models import ClassroomActivityAssignment
from .models import ScienceActivity, ScienceActivitySubmission, ActivityAnswer
import logging
import json

logger = logging.getLogger(__name__)


from typing import Optional

def _parse_bool(value: Optional[str]) -> Optional[bool]:
    if value is None:
        return None
    normalized = value.strip().lower()
    if normalized in {"true", "1", "yes", "y", "t"}:
        return True
    if normalized in {"false", "0", "no", "n", "f"}:
        return False
    return None


@api_view(["GET"])
@permission_classes([AllowAny])
def get_science_activities(request):
    """
    Return a lightweight list of science activities for dashboards/library views.
    Optional query params:
      - released: bool (filter by published status)
      - category: str (filter by NGSS category)
    """
    try:
        released_filter = _parse_bool(request.GET.get("released"))
        category = (request.GET.get("category") or "").strip()

        query = ScienceActivity.objects.all()
        if released_filter is True:
            query = query.filter(is_released=True)
        elif released_filter is False:
            query = query.filter(is_released=False)

        if category:
            query = query.filter(category__iexact=category)

        activities = list(
            query.order_by("-created_at", "activity_title").values(
                "activity_id",
                "activity_title",
                "pe",
                "lp",
                "lp_text",
                "category",
                "tags",
                "version",
                "is_released",
                "created_at",
                "updated_at",
            )
        )

        return Response(activities, status=200)
    except Exception as exc:
        return Response({"error": str(exc)}, status=500)


@api_view(["GET"])
@permission_classes([AllowAny])
def get_science_activity(request, activity_id):
    """
    Retrieve a single science activity with its related media files (images/videos)
    from the science_activity_images table.
    """
    try:
        activity = ScienceActivity.objects.get(activity_id=activity_id)

        # Fetch related media
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT file_path, description, media_type
                FROM public.science_activity_images
                WHERE activity_id = %s
                ORDER BY id ASC;
            """,
                [activity.id],
            )
            media_records = cursor.fetchall()

        media = []
        for path, desc, mtype in media_records:
            if not path:
                continue
            if path.startswith("http"):
                file_url = path
            else:
                # Use relative URL for media - will be proxied by frontend
                file_url = f"/media/{path}"

            media.append(
                {
                    "url": file_url,
                    "description": desc or "",
                    "media_type": mtype or "image",
                }
            )

        questions = [
            q.strip()
            for q in [
                activity.question_1,
                activity.question_2,
                activity.question_3,
                activity.question_4,
                activity.question_5,
            ]
            if q and q.strip()
        ]

        data = {
            "id": activity.id,
            "activity_id": activity.activity_id,
            "activity_title": activity.activity_title,
            "activity_task": activity.activity_task,
            "category": activity.category,
            "pe": activity.pe,
            "lp": activity.lp,
            "lp_text": activity.lp_text,
            "tags": activity.tags,
            "version": activity.version,
            "is_released": activity.is_released,
            "created_at": activity.created_at,
            "updated_at": activity.updated_at,
            "created_by_id": activity.created_by.id if activity.created_by else None,
            "media": media,
            "questions": questions,
        }

        return Response(data, status=200)

    except ScienceActivity.DoesNotExist:
        return Response({"error": "Activity not found"}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(["GET"])
@permission_classes([AllowAny])
def get_released_science_activities(request):
    """
    Retrieve released science activities (is_released = True).
    Used for classroom activity selection modal.
    """
    try:
        category = request.GET.get("category", "").strip().upper()
        valid_categories = {"PS", "LS", "ESS", "ETS"}

        query = ScienceActivity.objects.filter(is_released=True)
        if category in valid_categories:
            query = query.filter(category=category)

        activities = query.values(
            "id",
            "activity_id",
            "activity_title",
            "activity_task",
            "category",
            "pe",
            "lp",
            "lp_text",
            "tags",
            "created_at",
            "updated_at",
            "version",
            "created_by_id",
        ).order_by("-created_at")

        return Response(list(activities), status=200)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(["GET"])
@permission_classes([AllowAny])
def get_activity_counts(request):
    """
    Count how many released science activities exist per category.
    """
    try:
        categories = ["PS", "LS", "ESS", "ETS"]
        counts = {
            cat: ScienceActivity.objects.filter(is_released=True, category=cat).count()
            for cat in categories
        }
        return Response(counts, status=200)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def submit_activity_attempt(request, activity_id):
    """
    Endpoint for students to submit their answers for a science activity.
    Expects JSON body with 'answers' field containing their responses.
    """
    user = request.user
    classroom_id = request.data.get("classroom")
    answers = request.data.get("answers", {})

    try:
        science_activity = ScienceActivity.objects.get(activity_id=activity_id)
    except ScienceActivity.DoesNotExist:
        return Response({"detail": "Science activity not found."}, status=404)

    if not isinstance(answers, dict):
        return Response(
            {"detail": "Invalid answers format. Expected a dictionary."}, status=400
        )

    assignment_qs = ClassroomActivityAssignment.objects.filter(
        student=user,
        classroom_activity__activity_id=science_activity.activity_id,
    )
    if classroom_id:
        assignment_qs = assignment_qs.filter(
            classroom_activity__classroom_id=classroom_id
        )

    classroom_assignment = assignment_qs.select_related(
        "classroom_activity", "classroom_activity__assigned_by"
    ).first()

    if not classroom_assignment:
        return Response(
            {
                "detail": "No assignment found for this activity in the specified classroom."
            },
            status=403,
        )

    # Get or create the submission record (without activity_answers)
    submission, created = ScienceActivitySubmission.objects.get_or_create(
        activity=science_activity,
        student=user,
        defaults={
            "teacher": classroom_assignment.classroom_activity.assigned_by,
            "submitted_at": timezone.now(),
            "status": "submitted",
            "attempt_number": 1,
        },
    )

    if not created:
        submission.attempt_number = (submission.attempt_number or 1) + 1
        submission.status = "submitted"
        submission.submitted_at = timezone.now()
        submission.teacher = classroom_assignment.classroom_activity.assigned_by
        submission.save(
            update_fields=[
                "attempt_number",
                "status",
                "submitted_at",
                "teacher",
            ]
        )

    # Get question texts from the activity
    questions = [
        q.strip()
        for q in [
            science_activity.question_1,
            science_activity.question_2,
            science_activity.question_3,
            science_activity.question_4,
            science_activity.question_5,
        ]
        if q and q.strip()
    ]

    # Upsert each answer into the normalized activity_answers table
    for idx_str, answer_text in answers.items():
        idx = int(idx_str)
        question_num = idx + 1  # Convert 0-based index to 1-based question number
        question_text = questions[idx] if idx < len(questions) else f"Question {question_num}"

        ActivityAnswer.objects.update_or_create(
            submission=submission,
            question_number=question_num,
            defaults={
                "question_text": question_text,
                "student_answer": answer_text or "",
            },
        )

    classroom_assignment.status = "submitted"
    classroom_assignment.submitted_at = timezone.now()
    classroom_assignment.save(update_fields=["status", "submitted_at"])

    # Trigger AI grading asynchronously (best-effort, non-blocking)
    ai_grading_result = None
    try:
        ai_grading_result = _grade_submission_with_ai(submission, science_activity)
    except Exception as e:
        logger.warning(f"AI grading failed for submission {submission.id}: {e}")
        # Continue - AI grading failure shouldn't block submission

    response_data = {
        "detail": "Activity attempt submitted successfully.",
        "submission_id": submission.id,
        "attempt_number": submission.attempt_number,
    }
    
    if ai_grading_result:
        response_data["ai_grading"] = {
            "status": "completed",
            "overall_score": ai_grading_result.get("overall_score"),
            "answers_graded": ai_grading_result.get("answers_graded", 0),
        }
    else:
        response_data["ai_grading"] = {"status": "pending"}

    return Response(response_data, status=201 if created else 200)


def _grade_submission_with_ai(submission, activity):
    """
    Grade a submission using the AI service.
    Updates the ActivityAnswer records with AI feedback.
    Returns grading results dict or None if AI service unavailable.
    """
    try:
        from grading.ai_service import get_ai_service
    except ImportError:
        logger.warning("Grading module not available")
        return None
    
    ai_service = get_ai_service()
    if not ai_service.is_configured():
        logger.info("AI service not configured, skipping auto-grading")
        return None
    
    # Get all answers for this submission
    answers = ActivityAnswer.objects.filter(submission=submission).order_by("question_number")
    if not answers.exists():
        return None
    
    grading_results = []
    total_score = 0
    max_possible = 0
    
    for answer in answers:
        if not answer.student_answer:
            continue
            
        try:
            result = ai_service.evaluate_student_work(
                question=answer.question_text,
                student_answer=answer.student_answer,
                context=f"Activity: {activity.activity_title or activity.activity_id}",
            )
            
            # Parse the evaluation result
            try:
                evaluation = json.loads(result["evaluation"])
                question_score = evaluation.get("score", 0)
                feedback = evaluation.get("feedback", result["evaluation"])
                strengths = evaluation.get("strengths", [])
                improvements = evaluation.get("improvements", [])
                
                # Build comprehensive feedback
                feedback_parts = [feedback]
                if strengths:
                    feedback_parts.append(f"\n\nStrengths: {', '.join(strengths)}")
                if improvements:
                    feedback_parts.append(f"\n\nAreas to improve: {', '.join(improvements)}")
                
                full_feedback = "".join(feedback_parts)
            except (json.JSONDecodeError, TypeError):
                question_score = 0
                full_feedback = result.get("evaluation", "AI evaluation completed.")
            
            # Update the answer with AI feedback
            answer.ai_feedback = full_feedback
            answer.score = question_score
            answer.save(update_fields=["ai_feedback", "score", "updated_at"])
            
            grading_results.append({
                "question_number": answer.question_number,
                "score": question_score,
                "feedback": full_feedback,
            })
            
            total_score += question_score
            max_possible += 100
            
        except Exception as e:
            logger.error(f"Error grading answer {answer.id}: {e}")
            grading_results.append({
                "question_number": answer.question_number,
                "error": str(e),
            })
    
    # Update submission overall score and status
    if max_possible > 0:
        normalized_score = round((total_score / max_possible) * 100, 2)
    else:
        normalized_score = 0
    
    submission.score = normalized_score
    submission.status = "graded"
    submission.feedback_overview = f"AI grading completed. Score: {normalized_score}%"
    submission.save(update_fields=["score", "status", "feedback_overview"])
    
    # Log the grading session
    try:
        from grading.models import GradingSession
        GradingSession.objects.create(
            user=submission.student,
            activity_id=submission.activity.id,
            prompt=f"Auto-grade submission #{submission.id}",
            response=json.dumps(grading_results),
            model_used=ai_service._model or "unknown",
        )
    except Exception as e:
        logger.warning(f"Failed to log grading session: {e}")
    
    return {
        "overall_score": normalized_score,
        "answers_graded": len([r for r in grading_results if "error" not in r]),
        "results": grading_results,
    }
