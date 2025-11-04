from rest_framework import generics, permissions
from .models import Classroom, Enrollment
from .serializers import ClassroomSerializer, EnrollmentJoinSerializer


class ClassroomListCreateView(generics.ListCreateAPIView):
    queryset = Classroom.objects.all()
    serializer_class = ClassroomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Classroom.objects.filter(created_by=self.request.user)


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
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Classroom.objects.none

        return (
            Classroom.objects.filter(enrollments_student=user)
            .select_related("created_by")
            .prefetch_related("enrollments")
            .distinct()
        )
