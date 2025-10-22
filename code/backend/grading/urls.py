from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Router for ViewSets
router = DefaultRouter()
router.register(r'rubrics', views.RubricViewSet, basename='rubric')
router.register(r'submissions', views.AssessmentSubmissionViewSet, basename='submission')

urlpatterns = [
    # Function-based views
    path("health/", views.health_check, name="grading-health"),
    path("evaluate/", views.evaluate_work, name="evaluate-work"),
    path("chat/", views.chat_completion, name="chat-completion"),
    path("feedback/", views.generate_feedback, name="generate-feedback"),
    
    # ViewSet routes (rubrics, submissions)
    path("", include(router.urls)),
]
