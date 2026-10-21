from rest_framework import serializers
from .models import User, ProviderProfile, CustomerProfile, UserType, VerificationStatus

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'user_type', 'phone_number', 'is_verified', 'is_online']

class ProviderProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = ProviderProfile
        fields = ['id', 'user', 'company_name', 'service_area', 'pricing_model', 'verification_status', 'certifications']

class CustomerProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = CustomerProfile
        fields = ['id', 'user', 'company_name', 'billing_address']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'password', 'user_type', 'first_name', 'last_name', 'phone_number']

    def validate_user_type(self, value):
        if value == 'admin':
            raise serializers.ValidationError('Admin accounts cannot be created via public signup.')
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=validated_data['password'],
            user_type=validated_data['user_type'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone_number=validated_data.get('phone_number', '')
        )
        if validated_data['user_type'] == 'provider':
            ProviderProfile.objects.create(user=user)
        else:
            CustomerProfile.objects.create(user=user)
        return user


class AdminCreateUserSerializer(serializers.Serializer):
    """Admin-created user (signup on behalf of a customer/provider/admin)."""

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    user_type = serializers.ChoiceField(choices=UserType.choices)
    first_name = serializers.CharField(required=False, allow_blank=True, default='')
    last_name = serializers.CharField(required=False, allow_blank=True, default='')
    phone_number = serializers.CharField(required=False, allow_blank=True, default='')
    company_name = serializers.CharField(required=False, allow_blank=True, default='')
    verification_status = serializers.ChoiceField(
        choices=VerificationStatus.choices, required=False, default='approved'
    )

    def create(self, validated_data):
        company_name = validated_data.pop('company_name', '')
        verification_status = validated_data.pop('verification_status', 'approved')
        user = User.objects.create_user(
            username=validated_data['email'],
            email=validated_data['email'],
            password=validated_data['password'],
            user_type=validated_data['user_type'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone_number=validated_data.get('phone_number', ''),
        )
        if user.user_type == 'provider':
            ProviderProfile.objects.create(
                user=user, company_name=company_name, verification_status=verification_status
            )
        elif user.user_type == 'customer':
            CustomerProfile.objects.create(user=user)
        return user


class AdminUserSerializer(serializers.ModelSerializer):
    date_joined = serializers.DateTimeField(format='%d %b %Y')
    verification_status = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'user_type',
            'is_staff', 'is_active', 'date_joined', 'verification_status',
        ]

    def get_verification_status(self, obj):
        profile = getattr(obj, 'provider_profile', None)
        return profile.verification_status if profile else None


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)