from django.urls import path
from . import views

urlpatterns = [
    path("login/", views.login_view, name="login"),
    path("register/", views.register_view, name="register"),
    path("user/", views.current_user, name="current_user"),
    path("csrf/", views.csrf_token, name="csrf"),
]
