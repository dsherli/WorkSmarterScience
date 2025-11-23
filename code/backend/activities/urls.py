from django.urls import path
from . import views

urlpatterns = [
    path("", views.get_science_activities, name="get_science_activities"),
    path(
        "released/",
        views.get_released_science_activities,
        name="get_released_science_activities",
    ),
    path("counts/", views.get_activity_counts, name="get_activity_counts"),
    path("<str:activity_id>/", views.get_science_activity, name="get_science_activity"),
    path(
        "<str:activity_id>/submit/",
        views.submit_activity_attempt,
        name="activity_attempt",
    ),
]
