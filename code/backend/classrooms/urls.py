from django.urls import path
from .views import (
    ClassroomListCreateView,
    ClassroomDetailView,
    ClassroomMembershipListView,
    StudentJoinClassView,
    ClassroomActivityAssignView,
    ClassroomActivityListView,
    ClassroomActivitySubmissionListView,
    StudentAssignmentListView,
    TeacherDashboardStatsView,
    TeacherDashboardActivitiesView,
    TeacherDashboardReviewsView,
    StudentRecentActivityView,
    AddStudentView,
    ClassroomTableListCreateView,
    ClassroomTableDetailView,
    AssignStudentToTableView,
    TableMessageListCreateView,
    SimilarResponseGroupsView,
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
        "<int:classroom_id>/activities/<str:activity_id>/submissions/",
        ClassroomActivitySubmissionListView.as_view(),
        name="classroom-activity-submissions",
    ),
    path(
        "<int:classroom_id>/activities/<str:activity_id>/similar-groups/",
        SimilarResponseGroupsView.as_view(),
        name="similar-response-groups",
    ),
    path(
        "assignments/", StudentAssignmentListView.as_view(), name="student-assignments"
    ),
    
    # Teacher Dashboard Endpoints
    path("dashboard/stats/", TeacherDashboardStatsView.as_view(), name="dashboard-stats"),
    path("dashboard/recent-activity/", TeacherDashboardActivitiesView.as_view(), name="dashboard-recent"),
    path("dashboard/needs-review/", TeacherDashboardReviewsView.as_view(), name="dashboard-reviews"),
    
    # Student Dashboard Endpoints
    path("student/recent-activity/", StudentRecentActivityView.as_view(), name="student-recent-activity"),
    
    path("add-student/", AddStudentView.as_view(), name="add-student"),
    
    # Table Management
    path("<int:classroom_id>/tables/", ClassroomTableListCreateView.as_view(), name="classroom-tables"),
    path("<int:classroom_id>/tables/assign/", AssignStudentToTableView.as_view(), name="table-assign"),
    path("tables/<int:pk>/", ClassroomTableDetailView.as_view(), name="table-detail"),
    path("tables/<int:table_id>/messages/", TableMessageListCreateView.as_view(), name="table-messages"),
]
