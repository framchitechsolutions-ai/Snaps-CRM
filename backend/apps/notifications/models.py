from django.db import models
from django.conf import settings

class Notification(models.Model):
    class Type(models.TextChoices):
        REQUEST_SUBMITTED = 'request_submitted', 'Request Submitted'
        PROVIDER_ASSIGNED = 'provider_assigned', 'Provider Assigned'
        DELIVERABLE_READY = 'deliverable_ready', 'Deliverable Ready'
        PAYMENT_SUCCESS = 'payment_success', 'Payment Success'
        PAYMENT_FAILED = 'payment_failed', 'Payment Failed'
        DISPUTE_CREATED = 'dispute_created', 'Dispute Created'
        NEW_MESSAGE = 'new_message', 'New Message'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=30, choices=Type.choices)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    link = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']