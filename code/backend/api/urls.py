"""
Main URL configuration for the API project.

This file defines all high-level routes and includes URLs
from each app (students, activities, etc.).
"""

from django.contrib import admin
from django.urls import path, include
from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)


@api_view(["GET"])
def health(request):
    """Simple API health check endpoint."""
    return Response({"status": "ok"})


urlpatterns = [
    # Admin panel
    path("admin/", admin.site.urls),
    # Health check
    path("api/health/", health),
    # Authentication routes (custom student-related logic)
    path("api/auth/", include("students.urls")),
    # Science activities routes
    path("api/activities/", include("activities.urls")),
    # Classroom
    path("api/classrooms/", include("classrooms.urls")),
    # AI Grading
    path("api/grading/", include("grading.urls")),
    # JWT authentication endpoints
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/token/verify/", TokenVerifyView.as_view(), name="token_verify"),
    # Activity Groups
    path("api/activity-groups/", include("activity_groups.urls")),
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
