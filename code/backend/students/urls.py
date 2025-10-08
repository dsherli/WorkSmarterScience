from django.urls import path
from . import views

urlpatterns = [
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),
    path("user/", views.current_user, name="current_user"),
    path("csrf/", views.get_csrf, name="get_csrf"),
]
