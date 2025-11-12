from django.db import transaction
from django.shortcuts import get_object_or_404

from rest_framework import generics, permissions, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from activities.models import ScienceActivity

from .models import (
    Classroom,
    Enrollment,
    ClassroomActivity,
    ClassroomActivityAssignment,
)
from .serializers import (
    ClassroomSerializer,
    EnrollmentJoinSerializer,
    ClassroomActivityAssignSerializer,
    StudentAssignmentSerializer,
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
        return Classroom.objects.filter(created_by=self.request.user)


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


class StudentAssignmentListView(generics.ListAPIView):
    serializer_class = StudentAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            ClassroomActivityAssignment.objects.filter(student=self.request.user)
            .select_related("classroom_activity__classroom")
            .order_by("due_at", "classroom_activity__assigned_at")
        )

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        activity_ids = [
            assignment.classroom_activity.activity_id for assignment in queryset
        ]
        activity_map = _activity_metadata(activity_ids)
        serializer = self.get_serializer(
            queryset, many=True, context={"activity_map": activity_map}
        )
        return Response(serializer.data)
