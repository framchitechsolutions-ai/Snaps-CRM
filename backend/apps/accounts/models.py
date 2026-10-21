import os
from django.db import models
from django.contrib.auth.models import AbstractUser
from core_utils.models import TimeStampedModel, UserType, VerificationStatus

class User(AbstractUser):
    user_type = models.CharField(max_length=20, choices=UserType.choices)
    phone_number = models.CharField(max_length=20, blank=True)
    is_verified = models.BooleanField(default=False)
    is_online = models.BooleanField(default=False)

    def __str__(self):
        return self.email or self.username

class ProviderProfile(TimeStampedModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='provider_profile')
    company_name = models.CharField(max_length=255, blank=True)
    service_area = models.JSONField(default=list)
    pricing_model = models.JSONField(default=dict)
    verification_status = models.CharField(max_length=20, choices=VerificationStatus.choices, default=VerificationStatus.PENDING)
    certifications = models.JSONField(default=list, blank=True)

    def __str__(self):
        return f"{self.user.email} - Provider Profile"

class CustomerProfile(TimeStampedModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='customer_profile')
    company_name = models.CharField(max_length=255, blank=True)
    billing_address = models.TextField(blank=True)

    def __str__(self):
        return f"{self.user.email} - Customer Profile"