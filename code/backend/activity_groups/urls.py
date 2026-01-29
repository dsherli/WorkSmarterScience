from django.urls import path
from . import views

urlpatterns = [
    # Student endpoints
    path(
        "assignments/<int:assignment_id>/prompts/",
        views.StudentCurrentPromptsView.as_view(),
        name="student-prompts",
    ),
    path(
        "assignments/<int:assignment_id>/my-group/",
        views.get_student_group_info,
        name="student-group-info",
    ),
    
    # Teacher endpoints
    path(
        "assignments/<int:assignment_id>/groups/",
        views.TeacherGroupsWithPromptsView.as_view(),
        name="teacher-groups",
    ),
    path(
        "assignments/<int:assignment_id>/generate-all/",
        views.generate_all_group_questions,
        name="generate-all-questions",
    ),
    path(
        "assignments/<int:assignment_id>/release-questions/",
        views.release_questions,
        name="release-questions",
    ),
    
    # Group-specific endpoints
    path(
        "groups/<int:group_id>/generate-questions/",
        views.generate_group_questions,
        name="generate-group-questions",
    ),
]
