from rest_framework import generics, permissions, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Classroom, Enrollment
from .serializers import ClassroomSerializer, EnrollmentJoinSerializer


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
