from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.csrf import ensure_csrf_cookie
from django.contrib.auth.models import User
from .models import StudentProfile
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from .serializers import UserSerializer, StudentProfileSerializer


@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get("username")
    password = request.data.get("password")
    user = authenticate(request, username=username, password=password)
    if user is not None:
        login(request, user)
        return Response(UserSerializer(user).data)
    return Response(
        {"detail": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST
    )


@csrf_exempt
@api_view(["POST"])
def logout_view(request):
    logout(request)
    return Response({"detail": "Logged out"})


@api_view(["GET"])
def current_user(request):
    user = request.user
    if user.is_authenticated:
        data = UserSerializer(user).data
        # attach profile if exists
        try:
            profile = user.student_profile
            data["profile"] = StudentProfileSerializer(profile).data
        except Exception:
            data["profile"] = None
        return Response(data)
    return Response(None, status=status.HTTP_204_NO_CONTENT)


@ensure_csrf_cookie
@api_view(["GET"])
@permission_classes([AllowAny])
def get_csrf(request):
    """A small endpoint to set the CSRF cookie for SPA clients."""
    return Response({"detail": "csrf cookie set"})


@api_view(["POST"])
@permission_classes([AllowAny])
def register_view(request):
    """Register a new user. Expects JSON: {username, email, password}. Returns user on success."""
    username = request.data.get("username")
    email = request.data.get("email")
    password = request.data.get("password")

    if not username or not password:
        return Response(
            {"detail": "username and password required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(username=username).exists():
        return Response(
            {"detail": "username already taken"}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = User.objects.create_user(
            username=username, email=email or "", password=password
        )
        # create an empty StudentProfile if desired
        try:
            StudentProfile.objects.create(user=user)
        except Exception:
            pass

        # log the user in so the SPA gets a session cookie immediately
        login(request, user)
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response(
            {"detail": "registration failed"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
