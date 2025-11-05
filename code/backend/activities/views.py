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
    activities = ScienceActivity.objects.all().values(
        "id",
        "activity_id",
        "activity_title",
        "activity_task",
        "pe",
        "lp",
        "lp_text",
        "category",
        "is_released",
        "created_at",
        "updated_at",
        "version",
        "created_by_id",
        "tags",
    ).order_by("-created_at")

    return Response(list(activities), status=200)


@api_view(["GET"])
@permission_classes([AllowAny])
def get_science_activity(request, activity_id):
    """
    Retrieve a single science activity with its related media files (images/videos)
    from the science_activity_images table.
    """
    try:
        activity = ScienceActivity.objects.get(activity_id=activity_id)
        base_url = request.build_absolute_uri("/").rstrip("/")

        # Fetch related media
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT file_path, description, media_type
                FROM public.science_activity_images
                WHERE activity_id = %s
                ORDER BY id ASC;
            """, [activity.id])
            media_records = cursor.fetchall()

        media = []
        for path, desc, mtype in media_records:
            if not path:
                continue
            if path.startswith("http"):
                file_url = path
            else:
                if path.startswith("media/"):
                    file_url = f"{base_url}/{path}"
                else:
                    file_url = f"{base_url}/media/{path}"

            media.append({
                "url": file_url,
                "description": desc or "",
                "media_type": mtype or "image",
            })

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

        data = {
            "id": activity.id,
            "activity_id": activity.activity_id,
            "activity_title": activity.activity_title,
            "activity_task": activity.activity_task,
            "category": activity.category,
            "pe": activity.pe,
            "lp": activity.lp,
            "lp_text": activity.lp_text,
            "tags": activity.tags,
            "version": activity.version,
            "is_released": activity.is_released,
            "created_at": activity.created_at,
            "updated_at": activity.updated_at,
            "created_by_id": activity.created_by.id if activity.created_by else None,
            "media": media,
            "questions": questions,
        }

        return Response(data, status=200)

    except ScienceActivity.DoesNotExist:
        return Response({"error": "Activity not found"}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(["GET"])
@permission_classes([AllowAny])
def get_released_science_activities(request):
    """
    Retrieve released science activities (is_released = True).
    Used for classroom activity selection modal.
    """
    try:
        category = request.GET.get("category", "").strip().upper()
        valid_categories = {"PS", "LS", "ESS", "ETS"}

        query = ScienceActivity.objects.filter(is_released=True)
        if category in valid_categories:
            query = query.filter(category=category)

        activities = query.values(
            "id",
            "activity_id",
            "activity_title",
            "activity_task",
            "category",
            "pe",
            "lp",
            "lp_text",
            "tags",
            "created_at",
            "updated_at",
            "version",
            "created_by_id",
        ).order_by("-created_at")

        return Response(list(activities), status=200)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_activity_counts(request):
    """
    Count how many released science activities exist per category.
    """
    try:
        categories = ['PS', 'LS', 'ESS', 'ETS']
        counts = {
            cat: ScienceActivity.objects.filter(is_released=True, category=cat).count()
            for cat in categories
        }
        return Response(counts, status=200)
    except Exception as e:
        return Response({"error": str(e)}, status=500)
