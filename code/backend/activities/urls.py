from django.urls import path
from . import views

urlpatterns = [
    path("", views.get_science_activities, name="get_science_activities"),
    path("<str:activity_id>/", views.get_science_activity, name="get_science_activity"),
]
