from datetime import datetime, timezone

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
from .models import User, ProviderProfile, CustomerProfile
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserSerializer,
    ProviderProfileSerializer,
    AdminUserSerializer,
    AdminCreateUserSerializer,
)

class RegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = User.objects.filter(email=serializer.validated_data['email']).first()
        if user and user.check_password(serializer.validated_data['password']):
            user.is_online = True
            user.save(update_fields=['is_online'])
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            })
        return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    
    def get_object(self):
        return self.request.user

class ListProvidersView(generics.ListAPIView):
    serializer_class = ProviderProfileSerializer
    
    def get_queryset(self):
        return ProviderProfile.objects.filter(verification_status='approved', is_active=True)


class ListUsersView(generics.ListAPIView):
    """Admin-only: list all platform users."""
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return User.objects.all().select_related('provider_profile').order_by('-date_joined')


class CreateUserView(generics.CreateAPIView):
    """Admin-only: create a user (signup on behalf of customer/provider/admin)."""
    serializer_class = AdminCreateUserSerializer
    permission_classes = [IsAdminUser]

class ProviderApprovalView(generics.GenericAPIView):
    permission_classes = [IsAdminUser]
    
    def post(self, request, user_id):
        provider = ProviderProfile.objects.get(user_id=user_id)
        provider.verification_status = request.data.get('status', 'approved')
        provider.save()
        return Response({'status': provider.verification_status})


def _blacklist_token(raw_token: str, user) -> None:
    """Persist the token as outstanding (if needed) and add it to the blacklist."""
    try:
        token = AccessToken(raw_token)
    except Exception:
        try:
            token = RefreshToken(raw_token)
        except Exception:
            return

    outstanding, _ = OutstandingToken.objects.get_or_create(
        token=raw_token,
        defaults={
            'user': user,
            'jti': token.get('jti'),
            'created_at': (
                datetime.fromtimestamp(token['iat'], tz=timezone.utc)
                if token.get('iat') else timezone.now()
            ),
            'expires_at': datetime.fromtimestamp(token['exp'], tz=timezone.utc),
        },
    )
    BlacklistedToken.objects.get_or_create(token=outstanding)


class LogoutView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Invalidate the refresh token (primary session credential).
        refresh = request.data.get('refresh')
        if refresh:
            _blacklist_token(refresh, request.user)

        # Invalidate the access token presented in the Authorization header.
        if getattr(request, 'auth', None):
            _blacklist_token(str(request.auth), request.user)

        # Mark the user as offline.
        request.user.is_online = False
        request.user.save(update_fields=['is_online'])

        return Response(
            {'detail': 'Successfully logged out.'},
            status=status.HTTP_205_RESET_CONTENT,
        )