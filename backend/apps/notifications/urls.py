from django.urls import path
from . import views

urlpatterns = [
    path('', views.MyNotificationsView.as_view(), name='notifications'),
    path('<int:notification_id>/read/', views.MarkAsReadView.as_view(), name='mark-as-read'),
]