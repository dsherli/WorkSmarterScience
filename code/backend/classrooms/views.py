from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404

from rest_framework import generics, permissions, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from activities.models import ScienceActivity, ScienceActivitySubmission
from grading.models import GradingSession

from .models import (
    Classroom,
    Enrollment,
    ClassroomActivity,
    ClassroomActivityAssignment,
    ClassroomTable,
    Announcement,
    AnnouncementAttachment,
)
from .serializers import (
    ClassroomSerializer,
    EnrollmentJoinSerializer,
    ClassroomActivityAssignSerializer,
    ClassroomActivitySummarySerializer,
    ClassroomActivityAssignmentSubmissionSerializer,
    StudentAssignmentSerializer,
    ClassroomTableSerializer,
    TableMessageSerializer,
    AnnouncementSerializer,
    AnnouncementAttachmentSerializer,
)


def _activity_metadata(activity_ids):
    if not activity_ids:
        return {}

    records = ScienceActivity.objects.filter(activity_id__in=activity_ids).values(
        "activity_id", "activity_title", "pe", "lp", "lp_text"
    )
    return {record["activity_id"]: record for record in records}


class ClassroomListCreateView(generics.ListCreateAPIView):
    queryset = Classroom.objects.all()
    serializer_class = ClassroomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Classroom.objects.filter(created_by=self.request.user)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ClassroomDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Classroom.objects.all()
    serializer_class = ClassroomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Classroom.objects.filter(
            Q(created_by=user) | Q(enrollments__student=user)
        ).distinct()


class EnrollmentJoinView(generics.CreateAPIView):
    queryset = Enrollment.objects.all()
    serializer_class = EnrollmentJoinSerializer
    permission_classes = [permissions.IsAuthenticated]


class ClassroomMembershipListView(generics.ListAPIView):
    """
    return the classrooms the current user is enrolled in (as student)
    """

    serializer_class = ClassroomSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Classroom.objects.none()

        return (
            Classroom.objects.filter(enrollments__student=user)
            .select_related("created_by")
            .prefetch_related("enrollments")
            .distinct()
        )


class StudentJoinClassSerializer(serializers.Serializer):
    join_code = serializers.CharField(max_length=10, trim_whitespace=True)

    def validate_join_code(self, value):
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("Join code cannot be empty.")
        return cleaned


class StudentJoinClassView(APIView):
    # Joining a class requires an authenticated user. Return 401 for anonymous.
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = StudentJoinClassSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        join_code = serializer.validated_data["join_code"]

        try:
            classroom = Classroom.objects.get(code__iexact=join_code, status="active")
        except Classroom.DoesNotExist:
            return Response(
                {"detail": "Invalid class code or inactive classroom."},
                status=status.HTTP_404_NOT_FOUND,
            )

        student = request.user
        if not student or not getattr(student, "is_authenticated", False):
            return Response(
                {"detail": "Authentication credentials were not provided."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        if Enrollment.objects.filter(classroom=classroom, student=student).exists():
            return Response(
                {"detail": "You are already enrolled in this classroom."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        Enrollment.objects.create(classroom=classroom, student=student)
        classroom.refresh_from_db()

        response_data = ClassroomSerializer(
            classroom, context={"request": request}
        ).data
        return Response(response_data, status=status.HTTP_200_OK)


class ClassroomActivityAssignView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, classroom_id):
        classroom = get_object_or_404(
            Classroom, pk=classroom_id, created_by=request.user
        )

        serializer = ClassroomActivityAssignSerializer(
            data=request.data, context={"classroom": classroom}
        )
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data

        activity_id = validated["activity_id"]
        due_at = validated.get("due_at")
        students = validated["students"]

        with transaction.atomic():
            classroom_activity, created = ClassroomActivity.objects.get_or_create(
                classroom=classroom,
                activity_id=activity_id,
                defaults={"assigned_by": request.user, "due_at": due_at},
            )

            if not created:
                updates = []
                if due_at is not None and classroom_activity.due_at != due_at:
                    classroom_activity.due_at = due_at
                    updates.append("due_at")
                if classroom_activity.assigned_by_id != request.user.id:
                    classroom_activity.assigned_by = request.user
                    updates.append("assigned_by")
                if updates:
                    classroom_activity.save(update_fields=updates)

            assignments = []
            for student in students:
                defaults = {"due_at": due_at or classroom_activity.due_at}
                (
                    assignment,
                    assign_created,
                ) = ClassroomActivityAssignment.objects.select_for_update().get_or_create(
                    classroom_activity=classroom_activity,
                    student=student,
                    defaults=defaults,
                )
                if not assign_created and due_at is not None:
                    assignment.due_at = due_at
                    assignment.save(update_fields=["due_at"])
                assignments.append(assignment)

        activity_map = _activity_metadata([activity_id])
        data = StudentAssignmentSerializer(
            assignments, many=True, context={"activity_map": activity_map}
        ).data

        return Response(
            {
                "classroom_activity_id": classroom_activity.id,
                "assignment_count": len(assignments),
                "assignments": data,
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class ClassroomActivityListView(generics.ListAPIView):
    serializer_class = ClassroomActivitySummarySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        classroom_id = self.kwargs.get("classroom_id")
        user = self.request.user
        classroom = get_object_or_404(
            Classroom.objects.filter(Q(created_by=user) | Q(enrollments__student=user)).distinct(),
            pk=classroom_id
        )
        self.classroom = classroom
        return (
            ClassroomActivity.objects.filter(classroom=classroom)
            .prefetch_related("student_assignments")
            .order_by("-assigned_at")
        )

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        activity_ids = [activity.activity_id for activity in queryset]
        activity_map = _activity_metadata(activity_ids)
        context = self.get_serializer_context()
        context["activity_map"] = activity_map
        serializer = self.get_serializer(queryset, many=True, context=context)
        return Response(serializer.data)


class ClassroomActivitySubmissionListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, classroom_id, activity_id):
        classroom = get_object_or_404(
            Classroom, pk=classroom_id, created_by=request.user
        )
        classroom_activity = get_object_or_404(
            ClassroomActivity, classroom=classroom, activity_id=activity_id
        )

        assignments = (
            ClassroomActivityAssignment.objects.filter(
                classroom_activity=classroom_activity
            )
            .select_related("student")
            .order_by("student__last_name", "student__first_name", "student__username")
        )

        student_ids = [assignment.student_id for assignment in assignments]
        submission_map = {}
        if student_ids:
            submissions = (
                ScienceActivitySubmission.objects.filter(
                    activity__activity_id=activity_id, student_id__in=student_ids
                )
                .order_by("-submitted_at", "-id")
                .select_related("activity")
            )
            for submission in submissions:
                if submission.student_id not in submission_map:
                    submission_map[submission.student_id] = submission

        serializer = ClassroomActivityAssignmentSubmissionSerializer(
            assignments, many=True, context={"submission_map": submission_map}
        )

        activity_meta = _activity_metadata([activity_id]).get(activity_id, {})

        return Response(
            {
                "classroom": {"id": classroom.id, "name": classroom.name},
                "activity": {
                    "id": classroom_activity.id,
                    "activity_id": classroom_activity.activity_id,
                    "due_at": classroom_activity.due_at,
                    "title": activity_meta.get("activity_title"),
                    "pe": activity_meta.get("pe"),
                    "lp": activity_meta.get("lp"),
                    "lp_text": activity_meta.get("lp_text"),
                },
                "submissions": serializer.data,
            }
        )


class StudentAssignmentListView(generics.ListAPIView):
    serializer_class = StudentAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            ClassroomActivityAssignment.objects.filter(student=self.request.user)
            .select_related("classroom_activity__classroom")
            .order_by("due_at", "classroom_activity__assigned_at")
        )


class TeacherDashboardStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        classrooms = Classroom.objects.filter(created_by=user)
        
        # Calculate stats
        total_students = Enrollment.objects.filter(classroom__in=classrooms).values("student").distinct().count()
        active_activities = ClassroomActivity.objects.filter(classroom__in=classrooms).count()
        
        # Calculate average completion rate
        total_assignments = ClassroomActivityAssignment.objects.filter(
            classroom_activity__classroom__in=classrooms
        ).count()
        
        completed_assignments = ClassroomActivityAssignment.objects.filter(
            classroom_activity__classroom__in=classrooms,
            status__in=["submitted", "completed"]
        ).count()
        
        avg_completion = 0
        if total_assignments > 0:
            avg_completion = round((completed_assignments / total_assignments) * 100)
        
        # Count AI interactions (grading sessions by this teacher)
        ai_interactions = GradingSession.objects.filter(user=user).count()
        
        return Response({
            "total_students": total_students,
            "active_activities": active_activities,
            "avg_completion": avg_completion,
            "ai_interactions": ai_interactions
        })

class TeacherDashboardActivitiesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        classrooms = Classroom.objects.filter(created_by=user)
        
        # Get recent ClassroomActivities assigned to the teacher's classrooms
        activities = ClassroomActivity.objects.filter(
            classroom__in=classrooms
        ).prefetch_related("student_assignments").order_by("-assigned_at")[:10]
        
        activity_ids = [activity.activity_id for activity in activities]
        activity_map = _activity_metadata(activity_ids)
        
        serializer = ClassroomActivitySummarySerializer(
            activities, many=True, context={"activity_map": activity_map}
        )
        return Response(serializer.data)

class TeacherDashboardReviewsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        classrooms = Classroom.objects.filter(created_by=user)
        
        # Get activity IDs assigned to the teacher's classrooms
        classroom_activity_ids = ClassroomActivity.objects.filter(
            classroom__in=classrooms
        ).values_list("activity_id", flat=True)
        
        # Get submissions that need review (submitted but not graded)
        needs_review = ScienceActivitySubmission.objects.filter(
            activity__activity_id__in=classroom_activity_ids,
            status="submitted"
        ).select_related("activity", "student").order_by("-submitted_at")[:20]
        
        reviews = []
        for submission in needs_review:
            reviews.append({
                "id": submission.id,
                "type": "needs_review",
                "title": f"Review {submission.student.first_name or submission.student.username}'s submission",
                "time": submission.submitted_at.isoformat() if submission.submitted_at else None,
                "student": {
                    "id": submission.student.id,
                    "name": f"{submission.student.first_name or ''} {submission.student.last_name or ''}".strip() or submission.student.username,
                },
                "activity": {
                    "id": submission.activity.id,
                    "activity_id": submission.activity.activity_id,
                    "title": submission.activity.activity_title,
                },
                "status": submission.status,
            })
        
        return Response(reviews)


class StudentRecentActivityView(APIView):
    """Return recent activity for the current student."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # Get the student's recent submissions
        recent_submissions = ScienceActivitySubmission.objects.filter(
            student=user
        ).select_related("activity").order_by("-submitted_at")[:10]
        
        activities = []
        for submission in recent_submissions:
            activity_type = "submission"
            title = f"Submitted {submission.activity.activity_title or 'Activity'}"
            color = "text-green-500"
            
            if submission.status == "graded":
                activity_type = "grade"
                title = f"Received feedback on {submission.activity.activity_title or 'Activity'}"
                color = "text-blue-500"
            
            activities.append({
                "id": submission.id,
                "type": activity_type,
                "title": title,
                "time": submission.submitted_at.isoformat() if submission.submitted_at else None,
                "color": color,
                "activity": {
                    "id": submission.activity.id,
                    "activity_id": submission.activity.activity_id,
                    "title": submission.activity.activity_title,
                },
                "status": submission.status,
            })
        
        return Response(activities)


class AddStudentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        email = request.data.get("email")
        classroom_id = request.data.get("classroom_id")
        
        if not email:
            return Response({"detail": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        User = get_user_model()
        
        try:
            student = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"detail": "Student not found with that email"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # If classroom_id provided, use that classroom; otherwise pick the first one
        if classroom_id:
            classroom = get_object_or_404(
                Classroom, pk=classroom_id, created_by=request.user
            )
        else:
            classroom = Classroom.objects.filter(created_by=request.user).first()
            if not classroom:
                return Response(
                    {"detail": "No classroom found for this teacher"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Check if already enrolled
        if Enrollment.objects.filter(classroom=classroom, student=student).exists():
            return Response(
                {"detail": "Student already enrolled"},
                status=status.HTTP_400_BAD_REQUEST
            )

        Enrollment.objects.create(classroom=classroom, student=student)
        
        return Response({
            "detail": f"Student {student.username} added to {classroom.name}",
            "student": {
                "id": student.id,
                "username": student.username,
                "email": student.email,
            },
            "classroom": {
                "id": classroom.id,
                "name": classroom.name,
            }
        }, status=status.HTTP_200_OK)


class ClassroomTableListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, classroom_id):
        tables = ClassroomTable.objects.filter(classroom_id=classroom_id)
        serializer = ClassroomTableSerializer(tables, many=True)
        return Response(serializer.data)

    def post(self, request, classroom_id):
        # Handle bulk creation of tables
        classroom = get_object_or_404(Classroom, pk=classroom_id, created_by=request.user)
        
        data = request.data
        if isinstance(data, list):
            # Bulk create
            tables_to_create = []
            for item in data:
                tables_to_create.append(ClassroomTable(
                    classroom=classroom,
                    name=item.get("name"),
                    x_position=item.get("position", {}).get("x", 0),
                    y_position=item.get("position", {}).get("y", 0),
                    rotation=item.get("position", {}).get("rotation", 0),
                ))
            
            # Delete existing tables if needed? Or just append?
            # User flow implies "Create" replaces old setup or adds to it? 
            # Frontend: "setTables(newTables)" implies replacement locally.
            # Backend should probably clear existing tables if replacing layout.
            # Let's assume we clear existing tables for this classroom if param 'replace' is true
            if request.query_params.get("replace") == "true":
                ClassroomTable.objects.filter(classroom=classroom).delete()

            created_tables = ClassroomTable.objects.bulk_create(tables_to_create)
            serializer = ClassroomTableSerializer(created_tables, many=True)
            return Response(serializer.data, status=201)
        else:
            # Single create
            serializer = ClassroomTableSerializer(data=data)
            if serializer.is_valid():
                serializer.save(classroom=classroom)
                return Response(serializer.data, status=201)
            return Response(serializer.errors, status=400)

class ClassroomTableDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = ClassroomTable.objects.all()
    serializer_class = ClassroomTableSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = "pk"

    def perform_update(self, serializer):
        # Allow updating position/rotation directly
        serializer.save()

class AssignStudentToTableView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, classroom_id):
        student_id = request.data.get("student_id")
        table_id = request.data.get("table_id")
        
        classroom = get_object_or_404(Classroom, pk=classroom_id)
        
        # Verify enrollment
        enrollment = get_object_or_404(Enrollment, classroom=classroom, student_id=student_id)
        
        if table_id:
            table = get_object_or_404(ClassroomTable, pk=table_id, classroom=classroom)
            enrollment.assigned_table = table
        else:
            enrollment.assigned_table = None # Unassign
            
        enrollment.save()
        return Response({"status": "assigned" if table_id else "unassigned"}, status=200)

class TableMessageListCreateView(generics.ListCreateAPIView):
    serializer_class = TableMessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None # Simple polling, no pagination for now

    def get_queryset(self):
        table_id = self.kwargs.get("table_id")
        return TableMessage.objects.filter(table_id=table_id).select_related("sender").order_by("timestamp")

    def perform_create(self, serializer):
        table_id = self.kwargs.get("table_id")
        table = get_object_or_404(ClassroomTable, pk=table_id)
        serializer.save(sender=self.request.user, table=table)


class SimilarResponseGroupsView(APIView):
    """
    Analyze student submissions and group them by similarity based on scores.
    Groups students into: High Understanding, Developing, Basic Understanding
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, classroom_id, activity_id):
        classroom = get_object_or_404(
            Classroom, pk=classroom_id, created_by=request.user
        )
        
        # Get all submissions for this activity
        submissions = ScienceActivitySubmission.objects.filter(
            activity__activity_id=activity_id,
            status__in=["submitted", "graded"]
        ).select_related("student", "activity")
        
        # Build groups based on score ranges
        high_group = {
            "id": 1,
            "name": "High Understanding Group",
            "count": 0,
            "avgScore": 0,
            "keyThemes": [],
            "studentIds": [],
            "students": [],
        }
        developing_group = {
            "id": 2,
            "name": "Developing Understanding",
            "count": 0,
            "avgScore": 0,
            "keyThemes": [],
            "studentIds": [],
            "students": [],
        }
        basic_group = {
            "id": 3,
            "name": "Basic Understanding",
            "count": 0,
            "avgScore": 0,
            "keyThemes": [],
            "studentIds": [],
            "students": [],
        }
        
        high_scores = []
        developing_scores = []
        basic_scores = []
        
        for submission in submissions:
            score = float(submission.score) if submission.score else 0
            student_info = {
                "id": submission.student.id,
                "name": f"{submission.student.first_name or ''} {submission.student.last_name or ''}".strip() or submission.student.username,
            }
            
            if score >= 80:
                high_group["studentIds"].append(str(submission.student.id))
                high_group["students"].append(student_info)
                high_scores.append(score)
            elif score >= 60:
                developing_group["studentIds"].append(str(submission.student.id))
                developing_group["students"].append(student_info)
                developing_scores.append(score)
            else:
                basic_group["studentIds"].append(str(submission.student.id))
                basic_group["students"].append(student_info)
                basic_scores.append(score)
        
        # Calculate counts and averages
        high_group["count"] = len(high_scores)
        developing_group["count"] = len(developing_scores)
        basic_group["count"] = len(basic_scores)
        
        if high_scores:
            high_group["avgScore"] = round(sum(high_scores) / len(high_scores))
            high_group["keyThemes"] = [
                "Strong understanding of concepts",
                "Detailed explanations",
                "Correct use of terminology",
            ]
        
        if developing_scores:
            developing_group["avgScore"] = round(sum(developing_scores) / len(developing_scores))
            developing_group["keyThemes"] = [
                "Partial understanding",
                "Some missing details",
                "Room for improvement",
            ]
        
        if basic_scores:
            basic_group["avgScore"] = round(sum(basic_scores) / len(basic_scores))
            basic_group["keyThemes"] = [
                "Surface-level explanation",
                "Missing key details",
                "Needs elaboration",
            ]
        
        # Only include groups with students
        groups = []
        if high_group["count"] > 0:
            groups.append(high_group)
        if developing_group["count"] > 0:
            groups.append(developing_group)
        if basic_group["count"] > 0:
            groups.append(basic_group)
        
        return Response({
            "classroom_id": classroom.id,
            "activity_id": activity_id,
            "total_submissions": submissions.count(),
            "groups": groups,
        })


class AnnouncementListCreateView(generics.ListCreateAPIView):
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        classroom_id = self.kwargs.get("classroom_id")
        user = self.request.user
        # Must be creator or enrolled
        classroom = get_object_or_404(
            Classroom.objects.filter(Q(created_by=user) | Q(enrollments__student=user)).distinct(),
            pk=classroom_id
        )
        return Announcement.objects.filter(classroom=classroom)

    def perform_create(self, serializer):
        classroom_id = self.kwargs.get("classroom_id")
        # Only creator (teacher) can create announcements
        classroom = get_object_or_404(
            Classroom, pk=classroom_id, created_by=self.request.user
        )
        announcement = serializer.save(classroom=classroom, author=self.request.user)
        
        # Handle file uploads
        files = self.request.FILES.getlist('files')
        for f in files:
            AnnouncementAttachment.objects.create(
                announcement=announcement,
                file=f,
                filename=f.name
            )


class AnnouncementDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        classroom_id = self.kwargs.get("classroom_id")
        user = self.request.user
        # Must be creator (teacher) to update/delete
        # or enrolled to just retrieve
        return Announcement.objects.filter(classroom_id=classroom_id)

    def perform_update(self, serializer):
        # Ensure only creator can update
        announcement = self.get_object()
        if announcement.author != self.request.user:
            raise permissions.exceptions.PermissionDenied("Only the author can edit this announcement.")
        
        updated_announcement = serializer.save()
        
        # Handle new file uploads if any
        files = self.request.FILES.getlist('files')
        for f in files:
            AnnouncementAttachment.objects.create(
                announcement=updated_announcement,
                file=f,
                filename=f.name
            )

    def perform_destroy(self, instance):
        # Ensure only creator can delete
        if instance.author != self.request.user:
            raise permissions.exceptions.PermissionDenied("Only the author can delete this announcement.")
        instance.delete()


class AnnouncementAttachmentDeleteView(generics.DestroyAPIView):
    queryset = AnnouncementAttachment.objects.all()
    serializer_class = AnnouncementAttachmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_destroy(self, instance):
        # Ensure only the announcement author can delete attachments
        if instance.announcement.author != self.request.user:
            raise permissions.exceptions.PermissionDenied("Only the announcement author can delete attachments.")
        instance.delete()

