from django.urls import path
from .views import (
    ClassroomListCreateView,
    ClassroomDetailView,
    ClassroomMembershipListView,
    StudentJoinClassView,
    ClassroomActivityAssignView,
    ClassroomActivityListView,
    StudentAssignmentListView,
)

urlpatterns = [
    path("", ClassroomListCreateView.as_view(), name="classroom-list-create"),
    path("<int:pk>/", ClassroomDetailView.as_view(), name="classroom-detail"),
    path("join/", StudentJoinClassView.as_view(), name="classroom-join"),
    path("enrolled/", ClassroomMembershipListView.as_view()),
    path(
        "<int:classroom_id>/activities/assign/",
        ClassroomActivityAssignView.as_view(),
        name="classroom-activity-assign",
    ),
    path(
        "<int:classroom_id>/activities/",
        ClassroomActivityListView.as_view(),
        name="classroom-activities",
    ),
    path(
        "assignments/", StudentAssignmentListView.as_view(), name="student-assignments"
    ),
]
