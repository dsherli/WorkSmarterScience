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

# no-store headers to avoid cached auth responses
NO_STORE = {
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "Pragma": "no-cache",
}

@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get("username")
    password = request.data.get("password")
    user = authenticate(request, username=username, password=password)
    if user is not None:
        login(request, user)
        return Response(UserSerializer(user).data, headers=NO_STORE)
    return Response(
        {"detail": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST, headers=NO_STORE
    )

@csrf_exempt
@api_view(["POST"])
@permission_classes([AllowAny])
def logout_view(request):
    logout(request)
    response = Response({"detail": "Logged out"}, headers=NO_STORE)
    response.delete_cookie("sessionid")
    response.delete_cookie("csrftoken")
    return response

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
        return Response(data, headers=NO_STORE)
    return Response({"detail": "not authenticated"}, status=status.HTTP_401_UNAUTHORIZED, headers=NO_STORE)

@ensure_csrf_cookie
@api_view(["GET"])
@permission_classes([AllowAny])
def get_csrf(request):
    """A small endpoint to set the CSRF cookie for SPA clients."""
    return Response({"detail": "csrf cookie set"}, headers=NO_STORE)

@api_view(["POST"])
@permission_classes([AllowAny])
def register_view(request):
    """Register a new user. Expects JSON: {username, email, password, first_name?, last_name?}. Returns user on success."""
    username = request.data.get("username")
    email = request.data.get("email")
    password = request.data.get("password")
    first_name = request.data.get("first_name", "")
    last_name = request.data.get("last_name", "")

    if not username or not password:
        return Response(
            {"detail": "username and password required"},
            status=status.HTTP_400_BAD_REQUEST,
            headers=NO_STORE,
        )

    if User.objects.filter(username=username).exists():
        return Response(
            {"detail": "username already taken"}, status=status.HTTP_400_BAD_REQUEST, headers=NO_STORE
        )

    try:
        user = User.objects.create_user(
            username=username,
            email=email or "",
            password=password,
            first_name=first_name,
            last_name=last_name,
        )
        # create an empty StudentProfile if desired
        try:
            StudentProfile.objects.create(user=user)
        except Exception:
            pass

        # log the user in so the SPA gets a session cookie immediately
        login(request, user)
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED, headers=NO_STORE)
    except Exception as e:
        return Response(
            {"detail": "registration failed"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            headers=NO_STORE,
        )
