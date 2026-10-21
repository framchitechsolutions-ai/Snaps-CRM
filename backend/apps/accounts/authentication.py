from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken
from rest_framework.exceptions import AuthenticationFailed


class BlacklistJWTAuthentication(JWTAuthentication):
    """JWT auth that also rejects tokens that have been blacklisted on logout.

    A malformed/expired token is treated as "no authentication" (returns None)
    rather than raising, so it does not force a 401 on AllowAny endpoints such
    as login/register. IsAuthenticated endpoints still reject the request via
    the permission layer.
    """

    def authenticate(self, request):
        try:
            return super().authenticate(request)
        except (InvalidToken, AuthenticationFailed):
            return None

    def get_validated_token(self, raw_token):
        token = super().get_validated_token(raw_token)
        jti = token.get('jti')
        if jti and BlacklistedToken.objects.filter(token__jti=jti).exists():
            raise InvalidToken('Token is blacklisted')
        return token
