from django.urls import path
from . import views

urlpatterns = [
    path('contacts/', views.ContactsView.as_view(), name='contacts'),
    path('conversations/', views.CreateConversationView.as_view(), name='create-conversation'),
    path('', views.ListConversationsView.as_view(), name='conversations'),
    path('<int:conversation_id>/', views.ConversationDetailView.as_view(), name='conversation-detail'),
]
