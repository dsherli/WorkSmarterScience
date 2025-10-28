from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import ScienceActivity
from django.db import connection


@api_view(["GET"])
@permission_classes([AllowAny])
def get_science_activities(request):
    """
    Retrieve all science activities.
    This endpoint is used for the dashboard list view.
    """
    try:
        activities = ScienceActivity.objects.all().values(
            "activity_id",
            "activity_title",
            "pe",
            "lp",
            "lp_text",
        )
        return Response(list(activities))
    except Exception:
        # If backing table doesn't exist in local dev, return empty list instead of 500
        return Response([], status=200)


@api_view(["GET"])
@permission_classes([AllowAny])
def get_science_activity(request, activity_id):
    """
    Retrieve a single science activity with its related media files (images/videos)
    from the science_activity_images table.
    """
    try:
        # 1. load activity
        activity = ScienceActivity.objects.get(activity_id=activity_id)
        base_url = request.build_absolute_uri("/").rstrip("/")

        # 2. search image
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT file_path, description, media_type
                FROM public.science_activity_images
                WHERE activity_id = %s
                ORDER BY id ASC;
            """,
                [activity.id],
            )
            media_records = cursor.fetchall()

        # 3. JSON
        media = []
        for path, desc, mtype in media_records:
            if not path:
                continue

            # route
            if path.startswith("http"):
                file_url = path
            else:
                if path.startswith("media/"):
                    file_url = f"{base_url}/{path}"
                else:
                    file_url = f"{base_url}/media/{path}"

            media.append(
                {
                    "url": file_url,
                    "description": desc or "",
                    "media_type": mtype or "image",
                }
            )

        # 4. questions
        questions = [
            q.strip()
            for q in [
                activity.question_1,
                activity.question_2,
                activity.question_3,
                activity.question_4,
                activity.question_5,
            ]
            if q and q.strip()
        ]

        # 5. response
        data = {
            "activity_title": activity.activity_title,
            "activity_task": activity.activity_task,
            "media": media,
            "questions": questions,
        }

        return Response(data, status=200)

    except ScienceActivity.DoesNotExist:
        return Response({"error": "Activity not found"}, status=404)

    except Exception as e:
        # error handling
        return Response({"error": str(e)}, status=500)
