from django.urls import path
from . import views

urlpatterns = [
    path(
        "assignments/<int:assignment_id>/prompts/",
        views.StudentCurrentPromptsView.as_view(),
    ),
    path(
        "assignments/<int:assignment_id>/groups/",
        views.TeacherGroupsWithPromptsView.as_view(),
    ),
]
