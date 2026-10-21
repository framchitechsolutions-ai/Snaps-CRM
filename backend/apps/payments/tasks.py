"""Scheduled provider payouts.

A daily Celery beat task aggregates a provider's pending earnings and, once
they cross ``PAYOUT_THRESHOLD``, triggers a payout (here: marks the earnings
as paid). In production this is where a PSP Transfer (e.g. Paystack) call
would go.
"""
from decimal import Decimal

from django.conf import settings
from django.db import transaction as db_transaction
from django.db.models import Sum

from config.celery import app
from .models import ProviderEarning


@app.task(name="payments.tasks.process_provider_payouts")
def process_provider_payouts() -> dict:
    threshold = Decimal(str(settings.PAYOUT_THRESHOLD))
    processed = 0
    total_paid = Decimal("0.00")

    provider_ids = (
        ProviderEarning.objects.filter(payout_status="pending")
        .values_list("provider_id", flat=True)
        .distinct()
    )

    for provider_id in provider_ids:
        with db_transaction.atomic():
            pending = ProviderEarning.objects.filter(
                provider_id=provider_id, payout_status="pending"
            ).select_for_update()
            balance = pending.aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
            if balance < threshold:
                continue
            # In production, initiate the PSP transfer for `balance` here.
            pending.update(payout_status="paid")
            processed += 1
            total_paid += balance

    return {"providers_paid": processed, "total_paid": str(total_paid)}
