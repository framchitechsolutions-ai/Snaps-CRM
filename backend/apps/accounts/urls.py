from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.RegistrationView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('providers/', views.ListProvidersView.as_view(), name='providers'),
    path('users/', views.ListUsersView.as_view(), name='admin-list-users'),
    path('users/create/', views.CreateUserView.as_view(), name='admin-create-user'),
    path('users/<int:user_id>/approve/', views.ProviderApprovalView.as_view(), name='approve-provider'),
]