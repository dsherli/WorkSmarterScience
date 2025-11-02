from django.urls import path
from .views import ClassroomListCreateView, ClassroomDetailView

urlpatterns = [
    path('', ClassroomListCreateView.as_view(), name='classroom-list-create'),
    path('<int:pk>/', ClassroomDetailView.as_view(), name='classroom-detail'),
]
