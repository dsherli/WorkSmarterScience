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


@api_view(["GET"])
def health(request):
    """Simple API health check endpoint."""
    return Response({"status": "ok"})


urlpatterns = [
    # Admin panel
    path("admin/", admin.site.urls),

    # Health check
    path("api/health/", health),

    # Authentication routes
    path("api/auth/", include("students.urls")),

    # Science activities routes
    path("api/activities/", include("activities.urls")),
    
    # AI grading and feedback routes
    path("api/grading/", include("grading.urls")),
]

# Serve media files (e.g., /media/activities/...) during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
