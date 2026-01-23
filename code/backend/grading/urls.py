"""
Grading App URL Configuration
"""

from django.urls import path
from .views import (
    health_check,
    evaluate_work,
    chat_completion,
    generate_feedback,
    grade_submission,
    update_teacher_feedback,
    RubricListCreateView,
    RubricDetailView,
    GradingSessionListView,
    RubricMappingListView,
    RubricMappingSetView,
    RubricImportView,
    SubmissionListCreateView,
    SubmissionDetailView,
    SubmissionGradeView,
    SubmissionReviewView,
)

urlpatterns = [
    # AI Service endpoints
    path("health/", health_check, name="grading-health"),
    path("evaluate/", evaluate_work, name="grading-evaluate"),
    path("chat/", chat_completion, name="grading-chat"),
    path("feedback/", generate_feedback, name="grading-feedback"),
    
    # Submission grading
    path("grade-submission/", grade_submission, name="grade-submission"),
    path("teacher-feedback/", update_teacher_feedback, name="teacher-feedback"),
    
    # Rubric management
    path("rubrics/", RubricListCreateView.as_view(), name="rubric-list-create"),
    path("rubrics/<int:pk>/", RubricDetailView.as_view(), name="rubric-detail"),
    
    # Rubric mappings
    path("rubrics/mappings/", RubricMappingListView.as_view(), name="rubric-mappings-list"),
    path("rubrics/mappings/set/", RubricMappingSetView.as_view(), name="rubric-mappings-set"),
    path("rubrics/import/", RubricImportView.as_view(), name="rubric-import"),
    
    # Assessment Submissions
    path("submissions/", SubmissionListCreateView.as_view(), name="submission-list-create"),
    path("submissions/<int:pk>/", SubmissionDetailView.as_view(), name="submission-detail"),
    path("submissions/<int:pk>/grade/", SubmissionGradeView.as_view(), name="submission-grade"),
    path("submissions/<int:pk>/review/", SubmissionReviewView.as_view(), name="submission-review"),
    
    # Audit/Analytics
    path("sessions/", GradingSessionListView.as_view(), name="grading-sessions"),
]
