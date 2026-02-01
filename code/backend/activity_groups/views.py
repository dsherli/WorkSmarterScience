from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Prefetch
from django.shortcuts import get_object_or_404
from django.db import transaction
import logging

from .models import (
    ActivityGroup,
    ActivityGroupSet,
    ActivityGroupMembership,
    GroupAIRun,
    GroupAIPrompt,
)
from .serializers import (
    GroupAIPromptSerializer,
    GroupWithPromptsSerializer,
    GroupAIRunSerializer,
)
from grading.ai_service import get_ai_service
from grading.models import Rubric, RubricCriterion
from activities.models import ScienceActivity, ScienceActivitySubmission, ActivityAnswer
from classrooms.models import ClassroomActivity, ClassroomTable, Enrollment

logger = logging.getLogger(__name__)


def _generate_questions_for_group(group, user, num_questions=4):
    """
    Internal helper function to generate AI discussion questions for a group.
    
    Args:
        group: ActivityGroup instance
        user: User requesting the generation (for authorization check)
        num_questions: Number of questions to generate
    
    Returns:
        dict with 'success', 'data' or 'error' keys
    """
    from grading.ai_service import get_ai_service
    from grading.models import RubricCriterion
    
    # Verify the user is authorized (teacher of the classroom)
    classroom_activity = group.group_set.classroom_activity
    classroom = classroom_activity.classroom
    
    if classroom.created_by != user:
        return {"success": False, "error": "You do not have permission to generate questions for this group"}
    
    # Get AI service
    ai_service = get_ai_service()
    if not ai_service.is_configured():
        return {"success": False, "error": "AI service not configured. Please set up API keys."}
    
    # Get the activity
    activity_id = classroom_activity.activity_id
    try:
        activity = ScienceActivity.objects.get(activity_id=activity_id)
    except ScienceActivity.DoesNotExist:
        return {"success": False, "error": f"Activity {activity_id} not found"}
    
    # Build activity metadata
    activity_metadata = {
        "title": activity.activity_title or activity.activity_id,
        "task": activity.activity_task or "",
        "questions": [
            q for q in [
                activity.question_1,
                activity.question_2,
                activity.question_3,
                activity.question_4,
                activity.question_5,
            ] if q and q.strip()
        ],
        "pe": activity.pe,
        "lp": activity.lp,
        "lp_text": activity.lp_text,
    }
    
    # Get rubric criteria if exists
    rubric_criteria = []
    try:
        from grading.models import ActivityRubricMap
        rubric_map = ActivityRubricMap.objects.filter(
            activity_code=activity.activity_id
        ).select_related("rubric").first()
        
        if rubric_map and rubric_map.rubric:
            criteria = RubricCriterion.objects.filter(rubric=rubric_map.rubric)
            rubric_criteria = [
                {
                    "name": c.name,
                    "description": c.description,
                    "max_points": c.max_points,
                    "weight": c.weight,
                }
                for c in criteria
            ]
    except Exception as e:
        logger.warning(f"Could not fetch rubric: {e}")
    
    # Get all group members
    member_ids = list(
        ActivityGroupMembership.objects.filter(
            activity_group=group
        ).values_list("user_id", flat=True)
    )
    
    if not member_ids:
        return {"success": False, "error": "No students in this group"}
    
    logger.debug(f"Group {group.id} ({group.label}) has members: {member_ids}")
    logger.debug(f"Looking for submissions for activity pk={activity.id}, activity_id={activity.activity_id}")
    
    # Get student submissions for this activity
    submissions = ScienceActivitySubmission.objects.filter(
        activity=activity,
        student_id__in=member_ids
    ).prefetch_related("answers")
    
    logger.debug(f"Found {submissions.count()} submissions")
    
    # Build student responses data
    student_responses = []
    response_ids = []
    
    for submission in submissions:
        answers = list(submission.answers.all())
        logger.debug(f"Submission {submission.id} by student {submission.student_id} has {len(answers)} answers")
        if answers:
            response_ids.append(submission.id)
            student_responses.append({
                "student_id": submission.student_id,
                "answers": [
                    {
                        "question_number": a.question_number,
                        "question_text": a.question_text,
                        "student_answer": a.student_answer or "",
                        "ai_feedback": a.ai_feedback or "",
                    }
                    for a in answers
                ]
            })
    
    if not student_responses:
        # Additional debug info
        all_submissions = ScienceActivitySubmission.objects.filter(activity=activity)
        logger.warning(f"No student responses found. Total submissions for activity: {all_submissions.count()}")
        
        return {
            "success": False,
            "error": f"No student submissions found for this group. Group members: {list(member_ids)}. Students need to complete the assessment first."
        }
    
    try:
        # Call AI service to generate questions
        result = ai_service.generate_group_discussion_questions(
            activity_metadata=activity_metadata,
            rubric_criteria=rubric_criteria,
            student_responses=student_responses,
            num_questions=num_questions,
        )
        
        # Create GroupAIRun record
        ai_run = GroupAIRun.objects.create(
            activity_group=group,
            run_reason=GroupAIRun.RunReason.FOLLOW_UP_GENERATION,
            input_response_ids=response_ids,
            synthesized_summary_text=result.get("summary", ""),
            model_name=result.get("model", "unknown"),
            model_params={"tokens_used": result.get("tokens_used"), "num_questions": num_questions},
        )
        
        # Create GroupAIPrompt records
        for question in result.get("questions", []):
            GroupAIPrompt.objects.create(
                group_ai_run=ai_run,
                prompt_order=question.get("prompt_order", 1),
                prompt_text=question.get("prompt_text", ""),
                prompt_type=question.get("prompt_type", "follow_up"),
            )
        
        # Return success with the created run
        from .serializers import GroupAIRunSerializer
        serializer = GroupAIRunSerializer(ai_run)
        return {"success": True, "data": serializer.data}
        
    except Exception as e:
        logger.error(f"Error generating discussion questions: {e}")
        return {"success": False, "error": f"Failed to generate questions: {str(e)}"}


def create_groups_from_tables(classroom_activity, user):
    """
    Create ActivityGroupSet and ActivityGroups based on ClassroomTable assignments.
    
    This function syncs the ActivityGroup structure with the ClassroomTable structure,
    creating groups for each table that has students assigned to it.
    
    Args:
        classroom_activity: ClassroomActivity instance (the classroom-level activity assignment)
        user: The user creating the groups (typically the teacher)
    
    Returns:
        tuple: (group_set, created_count) - the group set and number of groups created
    """
    classroom = classroom_activity.classroom
    
    # Get or create the group set
    group_set, set_created = ActivityGroupSet.objects.get_or_create(
        classroom_activity=classroom_activity,
        defaults={"created_by": user}
    )
    
    # Get all tables in this classroom that have students assigned
    tables_with_students = ClassroomTable.objects.filter(
        classroom=classroom,
        students__isnull=False  # Has enrollments assigned
    ).distinct().prefetch_related("students__student")
    
    created_count = 0
    
    with transaction.atomic():
        for table in tables_with_students:
            # Get students assigned to this table
            enrollments = Enrollment.objects.filter(assigned_table=table)
            
            if not enrollments.exists():
                continue
            
            # Create or get the activity group for this table
            group, group_created = ActivityGroup.objects.get_or_create(
                group_set=group_set,
                label=table.name,
            )
            
            if group_created:
                created_count += 1
            
            # Sync memberships - add students who are assigned to this table
            for enrollment in enrollments:
                ActivityGroupMembership.objects.get_or_create(
                    group_set=group_set,
                    activity_group=group,
                    user=enrollment.student,
                )
    
    return group_set, created_count


class StudentCurrentPromptsView(generics.ListAPIView):
    serializer_class = GroupAIPromptSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # assignment_id here is actually ClassroomActivity.id (classroom-level)
        classroom_activity_id = self.kwargs["assignment_id"]
        user = self.request.user
        group = (
            ActivityGroup.objects.filter(
                group_set__classroom_activity_id=classroom_activity_id,
                group_set__classroom_activity__classroom__status__in=["active", "archived"],
                memberships__user=user,
            )
            .prefetch_related("ai_runs")
            .first()
        )
        latest_run = group.ai_runs.order_by("-created_at").first() if group else None
        return (
            GroupAIPrompt.objects.filter(group_ai_run=latest_run).order_by(
                "prompt_order"
            )
            if latest_run
            else GroupAIPrompt.objects.none()
        )


class TeacherGroupsWithPromptsView(generics.ListAPIView):
    serializer_class = GroupWithPromptsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # assignment_id here is actually ClassroomActivity.id (classroom-level)
        classroom_activity_id = self.kwargs["assignment_id"]
        
        # Try to auto-create groups from tables if none exist
        try:
            classroom_activity = ClassroomActivity.objects.select_related(
                "classroom"
            ).get(
                pk=classroom_activity_id,
                classroom__status__in=["active", "archived"]
            )
            
            # Check if groups already exist
            existing_groups = ActivityGroup.objects.filter(
                group_set__classroom_activity_id=classroom_activity_id
            ).exists()
            
            if not existing_groups:
                # Auto-create from tables
                create_groups_from_tables(classroom_activity, self.request.user)
        except ClassroomActivity.DoesNotExist:
            pass
        
        return (
            ActivityGroup.objects.filter(
                group_set__classroom_activity_id=classroom_activity_id,
                group_set__classroom_activity__classroom__status__in=["active", "archived"]
            )
            .select_related("group_set")
            .prefetch_related(
                Prefetch(
                    "ai_runs",
                    queryset=GroupAIRun.objects.order_by(
                        "-created_at"
                    ).prefetch_related("prompts"),
                )
            )
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_group_questions(request, group_id):
    """
    Generate AI-powered discussion questions for a specific activity group.
    
    This endpoint:
    1. Fetches all student responses in the group for the assigned activity
    2. Retrieves activity metadata and rubric
    3. Calls the AI to generate follow-up discussion questions
    4. Stores the questions in GroupAIPrompt model
    
    Request body (optional):
    {
        "num_questions": 4  # Number of questions to generate (default: 4)
    }
    
    Returns:
        GroupAIRun with generated prompts
    """
    # Get the activity group
    group = get_object_or_404(
        ActivityGroup.objects.select_related("group_set__classroom_activity__classroom"),
        pk=group_id
    )
    
    # Get number of questions from request
    num_questions = request.data.get("num_questions", 4)
    
    # Use the helper function
    result = _generate_questions_for_group(
        group=group,
        user=request.user,
        num_questions=num_questions
    )
    
    if result.get("success"):
        return Response(result.get("data"), status=status.HTTP_201_CREATED)
    else:
        # Determine appropriate status code based on error
        error_msg = result.get("error", "Unknown error")
        if "permission" in error_msg.lower():
            return Response({"error": error_msg}, status=status.HTTP_403_FORBIDDEN)
        elif "not found" in error_msg.lower():
            return Response({"error": error_msg}, status=status.HTTP_404_NOT_FOUND)
        elif "not configured" in error_msg.lower():
            return Response({"error": error_msg}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        else:
            return Response({"error": error_msg}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_all_group_questions(request, assignment_id):
    """
    Generate AI-powered discussion questions for ALL groups in an assignment.
    
    This is a batch operation for teachers to generate questions for all groups at once.
    Groups are automatically created from classroom tables if they don't exist.
    
    Args:
        assignment_id: ClassroomActivity.id (the classroom-level activity assignment)
    
    Request body (optional):
    {
        "num_questions": 4  # Number of questions to generate per group (default: 4)
    }
    
    Returns:
        List of results for each group
    """
    # Get the classroom activity (classroom-level assignment)
    classroom_activity = get_object_or_404(
        ClassroomActivity.objects.select_related("classroom"),
        pk=assignment_id
    )
    
    # Verify teacher authorization
    classroom = classroom_activity.classroom
    if classroom.created_by != request.user:
        return Response(
            {"error": "You do not have permission to generate questions for this assignment"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Auto-create groups from classroom tables if they don't exist
    group_set, created_count = create_groups_from_tables(classroom_activity, request.user)
    
    if created_count > 0:
        logger.info(f"Auto-created {created_count} activity groups from classroom tables for classroom_activity {assignment_id}")
    
    # Get all groups
    groups = ActivityGroup.objects.filter(group_set=group_set, archived_at__isnull=True)
    
    if not groups.exists():
        return Response(
            {"error": "No active groups found. Make sure students are assigned to tables in the classroom."},
            status=status.HTTP_404_NOT_FOUND
        )
    
    results = []
    num_questions = request.data.get("num_questions", 4)
    
    for group in groups:
        # Generate questions for each group directly
        try:
            result = _generate_questions_for_group(
                group=group,
                user=request.user,
                num_questions=num_questions
            )
            results.append({
                "group_id": group.id,
                "group_label": group.label,
                "success": result.get("success", False),
                "data": result.get("data"),
                "error": result.get("error"),
            })
        except Exception as e:
            logger.error(f"Exception generating questions for group {group.id}: {e}")
            results.append({
                "group_id": group.id,
                "group_label": group.label,
                "success": False,
                "error": str(e),
            })
    
    successful = sum(1 for r in results if r["success"])
    return Response({
        "total_groups": len(results),
        "successful": successful,
        "failed": len(results) - successful,
        "results": results,
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def release_questions(request, assignment_id):
    """
    Release AI-generated questions to students for all groups in an assignment.
    
    This marks all the latest GroupAIRun records as released, allowing students
    to see the discussion questions.
    
    Args:
        assignment_id: ClassroomActivity.id (the classroom-level activity assignment)
    
    Request body (optional):
    {
        "release": true  # Set to false to un-release questions
    }
    
    Returns:
        Number of groups released
    """
    from django.utils import timezone
    
    # Get the classroom activity
    classroom_activity = get_object_or_404(
        ClassroomActivity.objects.select_related("classroom"),
        pk=assignment_id
    )
    
    # Verify teacher authorization
    classroom = classroom_activity.classroom
    if classroom.created_by != request.user:
        return Response(
            {"error": "You do not have permission to release questions for this assignment"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Check if we should release or un-release
    should_release = request.data.get("release", True)
    
    # Get all groups for this assignment
    groups = ActivityGroup.objects.filter(
        group_set__classroom_activity_id=assignment_id,
        archived_at__isnull=True
    )
    
    released_count = 0
    
    for group in groups:
        # Get the latest AI run for this group
        latest_run = group.ai_runs.order_by("-created_at").first()
        if latest_run and latest_run.prompts.exists():
            if should_release and not latest_run.released_at:
                latest_run.released_at = timezone.now()
                latest_run.save(update_fields=["released_at"])
                released_count += 1
            elif not should_release and latest_run.released_at:
                latest_run.released_at = None
                latest_run.save(update_fields=["released_at"])
                released_count += 1
    
    action = "released" if should_release else "un-released"
    return Response({
        "success": True,
        "message": f"Successfully {action} questions for {released_count} group(s)",
        "released_count": released_count,
        "is_released": should_release,
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_student_group_info(request, assignment_id):
    """
    Get the current student's group info and discussion prompts for an assignment.
    
    Args:
        assignment_id: ClassroomActivity.id (the classroom-level activity assignment)
    
    Returns group details, members, and AI-generated prompts (only if released by teacher).
    """
    user = request.user
    
    # Find the student's group for this classroom activity
    membership = ActivityGroupMembership.objects.filter(
        group_set__classroom_activity_id=assignment_id,
        user=user
    ).select_related(
        "activity_group",
        "group_set"
    ).first()
    
    if not membership:
        return Response(
            {"error": "You are not assigned to a group for this activity"},
            status=status.HTTP_404_NOT_FOUND
        )
    
    group = membership.activity_group
    
    # Get group members
    members = ActivityGroupMembership.objects.filter(
        activity_group=group
    ).select_related("user")
    
    member_list = [
        {
            "id": m.user.id,
            "username": m.user.username,
            "name": f"{m.user.first_name} {m.user.last_name}".strip() or m.user.username,
            "is_me": m.user.id == user.id,
        }
        for m in members
    ]
    
    # Get latest RELEASED AI run with prompts (only show released questions to students)
    latest_run = group.ai_runs.filter(
        released_at__isnull=False
    ).order_by("-created_at").first()
    
    prompts = []
    summary = ""
    is_released = False
    
    if latest_run:
        prompts = GroupAIPromptSerializer(
            latest_run.prompts.order_by("prompt_order"),
            many=True
        ).data
        summary = latest_run.synthesized_summary_text
        is_released = True
    
    return Response({
        "group": {
            "id": group.id,
            "label": group.label,
        },
        "members": member_list,
        "has_prompts": len(prompts) > 0,
        "is_released": is_released,
        "summary": summary,
        "prompts": prompts,
        "last_updated": latest_run.created_at if latest_run else None,
    })


@api_view(["PATCH", "DELETE"])
@permission_classes([IsAuthenticated])
def update_prompt(request, prompt_id):
    """
    Update or delete a specific AI-generated prompt (teacher only).
    
    PATCH: Update the prompt_text and/or prompt_type
    DELETE: Remove the prompt
    
    Only the teacher who owns the classroom can modify prompts.
    Cannot modify prompts that have already been released to students.
    """
    prompt = get_object_or_404(GroupAIPrompt, pk=prompt_id)
    
    # Get the classroom through the chain: prompt -> run -> group -> group_set -> classroom_activity -> classroom
    ai_run = prompt.group_ai_run
    group = ai_run.activity_group
    classroom_activity = group.group_set.classroom_activity
    classroom = classroom_activity.classroom
    
    # Verify teacher owns the classroom
    if classroom.created_by != request.user:
        return Response(
            {"error": "You do not have permission to modify this prompt"},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Check if questions have been released
    if ai_run.released_at is not None:
        return Response(
            {"error": "Cannot modify prompts that have been released to students. Please un-release first."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if request.method == "DELETE":
        prompt.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    # PATCH - update the prompt
    prompt_text = request.data.get("prompt_text")
    prompt_type = request.data.get("prompt_type")
    
    if prompt_text is not None:
        prompt.prompt_text = prompt_text
    
    if prompt_type is not None:
        if prompt_type not in [choice[0] for choice in GroupAIPrompt.PromptType.choices]:
            return Response(
                {"error": f"Invalid prompt_type. Must be one of: {[c[0] for c in GroupAIPrompt.PromptType.choices]}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        prompt.prompt_type = prompt_type
    
    prompt.save()
    
    serializer = GroupAIPromptSerializer(prompt)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def auto_group_students(request, assignment_id):
    """
    Automatically group students using AI based on their answers.
    
    Warning: This replaces existing groups for the assignment.
    
    Request body:
    {
        "strategy": "heterogeneous" | "homogeneous",
        "group_size": 4
    }
    """
    classroom_activity = get_object_or_404(
        ClassroomActivity.objects.select_related("classroom"),
        pk=assignment_id
    )
    
    # Verify permission
    if classroom_activity.classroom.created_by != request.user:
        return Response(
            {"error": "You do not have permission to group students for this assignment"},
            status=status.HTTP_403_FORBIDDEN
        )
        
    strategy = request.data.get("strategy", "heterogeneous")
    group_size = int(request.data.get("group_size", 4))
    
    # Fetch students
    from classrooms.models import Enrollment
    enrollments = Enrollment.objects.filter(classroom=classroom_activity.classroom).select_related("student")
    student_ids = [e.student.id for e in enrollments]
    student_map = {e.student.id: e.student for e in enrollments}
    
    if not student_ids:
        return Response({"error": "No students in this classroom"}, status=status.HTTP_400_BAD_REQUEST)

    # Fetch submissions
    submissions = ScienceActivitySubmission.objects.filter(
        activity__activity_id=classroom_activity.activity_id,
        student_id__in=student_ids
    ).prefetch_related("answers")
    
    submission_map = {s.student_id: s for s in submissions}
    
    # Prepare data for AI
    student_data = []
    for s_id, student in student_map.items():
        submission = submission_map.get(s_id)
        answers_text = ""
        if submission:
            for ans in submission.answers.all():
                answers_text += f"Q: {ans.question_text} A: {ans.student_answer}\n"
        else:
            answers_text = "No submission found."
            
        student_data.append({
            "id": s_id,
            "name": f"{student.first_name} {student.last_name}",
            "answers_text": answers_text
        })

    # Call AI
    ai_service = get_ai_service()
    try:
        result = ai_service.generate_student_groups(
            student_data=student_data,
            activity_context=f"Activity ID: {classroom_activity.activity_id}",
            strategy=strategy,
            group_size=group_size
        )
    except Exception as e:
        logger.error(f"Auto-grouping failed: {e}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    groups_data = result.get("groups", [])
    if not groups_data:
        return Response({"error": "AI returned no groups"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Save to DB
    with transaction.atomic():
        # Get or create set
        group_set, _ = ActivityGroupSet.objects.get_or_create(
            classroom_activity=classroom_activity,
            defaults={"created_by": request.user}
        )
        
        # CLEAR EXISTING GROUPS (Destructive!)
        group_set.groups.all().delete()
        
        created_groups = []
        for g_data in groups_data:
            group = ActivityGroup.objects.create(
                group_set=group_set,
                label=f"Group {g_data.get('group_id')} ({strategy})"
            )
            created_groups.append(group)
            
            # Add members
            for s_id in g_data.get("student_ids", []):
                student = student_map.get(s_id)
                if student:
                    ActivityGroupMembership.objects.create(
                        group_set=group_set,
                        activity_group=group,
                        user=student
                    )
                    
    return Response({
        "success": True,
        "groups_created": len(created_groups),
        "strategy": strategy
    })

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def summarize_group_discussion(request, group_id):
    """
    Summarize the discussion for a specific activity group (Table).
    """
    group = get_object_or_404(ActivityGroup, pk=group_id)
    
    # Permission check: User must be teacher of the classroom or a member of the group
    # For now, let's assume teacher-only or checking enrollment would be better.
    # We will fetch the ClassroomTable associated with this group to get messages.
    # Note: The current data model links ActivityGroup to ActivityGroupMembership, 
    # but the messages are stored in ClassroomTable (via TableMessage).
    # We need to find which table this group is assigned to, OR if we are using the new ActivityGroup chat.
    # Based on `TeacherGroupPage.tsx`, it seems `getMessages` calls `/classrooms/tables/${tableId}/messages/`.
    # AND `getTeacherGroups` returns `GroupInfo` which has `id`.
    # Let's assume the group_id passed here corresponds to an ActivityGroup, 
    # and we need to find the messages associated with the *User Members* of this group for this *Activity*.
    
    # WAIT. The user request says "summarize group discussion".
    # In `views.py`, we have `TableMessage` linked to `ClassroomTable`.
    # `ActivityGroup` is a logical grouping for an activity. 
    # Do we have a link between ActivityGroup and ClassroomTable?
    # Checking `models.py`... 
    # `ActivityGroup` has `group_set`. `ActivityGroupMembership` links `user`.
    # `ClassroomTable` links `classroom`.
    # If the system is using `ActivityGroup` for chat, we need to know where those messages are.
    # If the system uses `ClassroomTable` (physical tables) for chat, we need to know which table corresponds to this group.
    
    # Let's look at `TeacherGroupPage.tsx` again.
    # It calls `groupsApi.getMessages(tableId)`.
    # So the chat is happening at the `ClassroomTable` level.
    # BUT `auto_group_students` creates `ActivityGroup`s.
    # Does `auto_group_students` assign students to `ClassroomTable`s?
    # NO. It creates `ActivityGroupMembership`.
    
    # CRITICAL DISCONNECT:
    # 1. AI creates `ActivityGroup` (Logical).
    # 2. Chat happens in `ClassroomTable` (Physical/Socket).
    # We need to bridge this.
    # EITHER:
    # A) We assume 1 ActivityGroup = 1 ClassroomTable and we need to sync them.
    # B) We accept that we are summarizing `ActivityGroup` but there are no messages there yet?
    
    # Let's assume for this feature, the teacher wants to summarize a specific `ActivityGroup`.
    # If the student is in `ActivityGroup` X, they should likely be chatting in a channel for `ActivityGroup` X.
    # If the chat is actually implemented on `ClassroomTable`, then we need to know which Table `ActivityGroup` X represents.
    
    # For now, let's look at `TableMessage` model.
    # It has `table` (ClassroomTable).
    
    # PROPOSAL:
    # To implement "Summarize Discussion" for the AI Grouping feature:
    # The Frontend likely needs to know which Table ID corresponds to the Group ID.
    # OR we are moving towards "Activity-based Chat".
    
    # Let's assume we are summarizing a `ClassroomTable` for now, as that's where messages are.
    # So the endpoint should be `classrooms/tables/<int:table_id>/summarize/`.
    # AND/OR we update `ActivityGroup` to have a `table` foreign key?
    
    # Let's check `ClassroomTable` model again.
    pass

@api_view(["POST"])
@permission_classes([IsAuthenticated]) 
def summarize_table_discussion(request, table_id):
    """
    Summarize discussion for a specific table.
    """
    from classrooms.models import ClassroomTable, TableMessage
    
    table = get_object_or_404(ClassroomTable, pk=table_id)
    
    # Get messages
    messages = TableMessage.objects.filter(table=table).order_by("created_at")
    if not messages.exists():
        return Response({"summary": "No messages found."}, status=200)
    
    formatted_messages = [
        {"sender": m.author.first_name, "text": m.content, "timestamp": str(m.created_at)}
        for m in messages
    ]
    
    ai_service = get_ai_service()
    try:
        result = ai_service.summarize_discussion(
            messages=formatted_messages,
            discussion_topic=f"Table {table.name} Discussion"
        )
    except Exception as e:
        logger.error(f"Summarization failed: {e}")
        return Response({"error": str(e)}, status=500)
        
    return Response({
        "success": True,
        "summary": result.get("summary_data"),
        "table_id": table_id
    })
