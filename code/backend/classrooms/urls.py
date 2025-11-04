from django.urls import path
from .views import (
    ClassroomListCreateView,
    ClassroomDetailView,
    EnrollmentJoinView,
    ClassroomMembershipListView,
)

urlpatterns = [
    path("", ClassroomListCreateView.as_view(), name="classroom-list-create"),
    path("<int:pk>/", ClassroomDetailView.as_view(), name="classroom-detail"),
    path("join/", EnrollmentJoinView.as_view()),
    path("enrolled/", ClassroomMembershipListView.as_view()),
]
