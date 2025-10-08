from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
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
    return Response({"detail": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST)


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
