from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import ScienceActivity
from django.conf import settings


@api_view(["GET"])
@permission_classes([AllowAny])
def get_science_activities(request):
    """
    Retrieve all science activities.
    This endpoint is used for the dashboard list view.
    """
    activities = ScienceActivity.objects.all().values(
        "activity_id",
        "activity_title",
        "pe",
        "lp",
        "lp_text",
    )
    return Response(list(activities))


@api_view(["GET"])
@permission_classes([AllowAny])
def get_science_activity(request, activity_id):
    try:
        activity = ScienceActivity.objects.get(activity_id=activity_id)
        base_url = request.build_absolute_uri("/")[:-1]

        data = {
            "activity_title": activity.activity_title,
            "activity_task": activity.activity_task,
            "activity_image": (
                f"{base_url}{activity.activity_image.url}"
                if activity.activity_image
                else None
            ),
            "image_description": activity.image_description,
            "questions": [
                q for q in [
                    activity.question_1,
                    activity.question_2,
                    activity.question_3,
                    activity.question_4,
                    activity.question_5,
                ] if q and q.strip()
            ],
        }
        return Response(data)
    except ScienceActivity.DoesNotExist:
        return Response({"error": "Activity not found"}, status=404)