"""Notify users on key request lifecycle transitions."""
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver

from .models import ProjectRequest
from notifications.models import Notification


@receiver(pre_save, sender=ProjectRequest)
def _capture_old_status(sender, instance, **kwargs):
    if instance.pk:
        try:
            instance._prev_status = ProjectRequest.objects.get(pk=instance.pk).status
            instance._prev_provider_id = ProjectRequest.objects.get(
                pk=instance.pk
            ).assigned_provider_id
        except ProjectRequest.DoesNotExist:
            instance._prev_status = None
            instance._prev_provider_id = None
    else:
        instance._prev_status = None
        instance._prev_provider_id = None


@receiver(post_save, sender=ProjectRequest)
def _notify_on_transition(sender, instance, created, **kwargs):
    old_status = getattr(instance, "_prev_status", None)
    new_status = instance.status

    # Provider assigned (with or without status change).
    old_provider = getattr(instance, "_prev_provider_id", None)
    if instance.assigned_provider_id and instance.assigned_provider_id != old_provider:
        Notification.objects.create(
            user=instance.assigned_provider,
            type=Notification.Type.PROVIDER_ASSIGNED,
            message=f"You have been assigned to '{instance.title}'.",
            link=f"/requests/{instance.id}",
        )

    if created or old_status == new_status:
        return

    # Work ready for customer review/payment.
    if new_status == "awaiting_payment":
        Notification.objects.create(
            user=instance.customer,
            type=Notification.Type.DELIVERABLE_READY,
            message=f"Deliverables for '{instance.title}' are ready for review and payment.",
            link=f"/requests/{instance.id}",
        )
