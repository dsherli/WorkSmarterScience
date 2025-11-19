from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate, get_user_model
from django.middleware.csrf import get_token
from django.http import JsonResponse
from .models import StudentProfile

User = get_user_model()

NO_STORE = {
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "Pragma": "no-cache",
}


def _has_field(model, name: str) -> bool:
    """Check if a given field exists on the model."""
    return any(getattr(f, "name", None) == name for f in model._meta.get_fields())


# 1. CSRF
@api_view(["GET"])
@permission_classes([AllowAny])
def csrf_token(request):
    """Return a valid CSRF token for frontend requests."""
    return JsonResponse({"csrfToken": get_token(request)})


# 2. Register
@api_view(["POST"])
@permission_classes([AllowAny])
def register_view(request):
    """
    Accepts: {username, email, password, first_name?, last_name?, role?}
    Returns: {user, access, refresh}
    """
    username = request.data.get("username")
    email = request.data.get("email")
    password = request.data.get("password")
    first_name = request.data.get("first_name", "")
    last_name = request.data.get("last_name", "")
    role = (request.data.get("role") or "").lower()

    if not username or not email or not password:
        return Response(
            {"detail": "Missing required fields"},
            status=status.HTTP_400_BAD_REQUEST,
            headers=NO_STORE,
        )

    dup_username = User.objects.filter(username__iexact=username).exists()
    dup_email = User.objects.filter(email__iexact=email).exists()

    # Debug
    print(
        "[REGISTER DEBUG]",
        {
            "user_model": f"{User.__module__}.{User.__name__}",
            "db_table": User._meta.db_table,
            "username": username,
            "exists_username": dup_username,
            "exists_email": dup_email,
        },
    )

    if dup_username:
        return Response(
            {"detail": "Username already exists"},
            status=status.HTTP_400_BAD_REQUEST,
            headers=NO_STORE,
        )
    if dup_email:
        return Response(
            {"detail": "Email already exists"},
            status=status.HTTP_400_BAD_REQUEST,
            headers=NO_STORE,
        )

    try:
        create_kwargs = dict(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
        )
        user = User.objects.create_user(**create_kwargs)

        # Save role to StudentProfile (not on auth_user)
        if role:
            profile, _ = StudentProfile.objects.get_or_create(user=user)
            profile.role = role
            profile.save()
        else:
            # Ensure profile exists for consistency
            StudentProfile.objects.get_or_create(user=user)

        profile = getattr(user, "student_profile", None)
        resp_role = getattr(profile, "role", "")

        refresh = RefreshToken.for_user(user)
        access = str(refresh.access_token)

        return Response(
            {
                "user": {
                    "username": user.username,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "role": resp_role,
                },
                "access": access,
                "refresh": str(refresh),
            },
            status=status.HTTP_201_CREATED,
            headers=NO_STORE,
        )
    except Exception as e:
        print(f"[REGISTER ERROR] {e}")
        return Response(
            {"detail": f"Registration failed: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            headers=NO_STORE,
        )


# 3. Login
@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    """JWT-based login endpoint."""
    username = request.data.get("username")
    password = request.data.get("password")

    if not username or not password:
        return Response(
            {"detail": "Missing username or password"},
            status=status.HTTP_400_BAD_REQUEST,
            headers=NO_STORE,
        )

    user = authenticate(username=username, password=password)
    if user is None:
        return Response(
            {"detail": "Invalid credentials"},
            status=status.HTTP_400_BAD_REQUEST,
            headers=NO_STORE,
        )

    refresh = RefreshToken.for_user(user)
    access = str(refresh.access_token)

    return Response(
        {
            "user": {
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": getattr(getattr(user, "student_profile", None), "role", ""),
            },
            "access": access,
            "refresh": str(refresh),
        },
        headers=NO_STORE,
    )


# 4. Current user
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def current_user(request):
    """Return basic info for the authenticated user."""
    user = request.user
    return Response(
        {
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": getattr(getattr(user, "student_profile", None), "role", ""),
        },
        headers=NO_STORE,
    )
