from django.db import models
from django.conf import settings
from core_utils.models import TimeStampedModel

class Transaction(TimeStampedModel):
    class Status(models.TextChoices):
        INITIATED = 'initiated', 'Initiated'
        SUCCESS = 'success', 'Success'
        FAILED = 'failed', 'Failed'
        REFUNDED = 'refunded', 'Refunded'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='transactions')
    request = models.ForeignKey(
        'service_requests.ProjectRequest',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transactions',
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    payment_method = models.CharField(max_length=50)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.INITIATED)
    # PSP / gateway metadata
    gateway = models.CharField(max_length=30, default='dummy')
    gateway_intent_id = models.CharField(max_length=255, blank=True)
    client_secret = models.CharField(max_length=512, blank=True)
    checkout_url = models.URLField(blank=True)
    external_reference = models.CharField(max_length=255, blank=True)

class Invoice(TimeStampedModel):
    transaction = models.OneToOneField(Transaction, on_delete=models.CASCADE, related_name='invoice')
    invoice_number = models.CharField(max_length=100, unique=True)
    pdf_url = models.URLField(blank=True)

class Commission(TimeStampedModel):
    transaction = models.OneToOneField(Transaction, on_delete=models.CASCADE, related_name='commission')
    rate = models.DecimalField(max_digits=5, decimal_places=2)
    amount = models.DecimalField(max_digits=10, decimal_places=2)

class ProviderEarning(TimeStampedModel):
    provider = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='earnings')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payout_status = models.CharField(max_length=20, default='pending')
    transaction = models.ForeignKey(Transaction, on_delete=models.CASCADE)