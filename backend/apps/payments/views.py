from decimal import Decimal

from django.db import transaction as db_transaction
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError

from .models import Transaction, ProviderEarning, Invoice, Commission
from .serializers import (
    TransactionSerializer,
    PaymentInitiateResponseSerializer,
    InvoiceSerializer,
    ProviderEarningSerializer,
    AdminTransactionSerializer,
)
from .gateways import get_gateway
from notifications.models import Notification


def _request_total(project_request) -> Decimal:
    return sum(
        (ss.price or Decimal("0")) for ss in project_request.selected_services.all()
    )


def finalize_successful_payment(tx: Transaction) -> None:
    """Side effects when a payment is confirmed successful by the PSP.

    Runs inside the caller's transaction. Idempotent for invoice/earnings.
    """
    from django.conf import settings

    project_request = tx.request
    if project_request is not None and project_request.status != "completed":
        project_request.status = "completed"
        project_request.save(update_fields=["status", "updated_at"])

    # Invoice (one per transaction).
    invoice, _ = Invoice.objects.get_or_create(
        transaction=tx,
        defaults={
            "invoice_number": f"INV-{tx.id:06d}",
            "pdf_url": "",
        },
    )

    # Commission + provider earnings (only if not already booked).
    if not hasattr(tx, "commission"):
        rate = Decimal(str(settings.COMMISSION_RATE))
        commission_amount = (tx.amount * rate).quantize(Decimal("0.01"))
        Commission.objects.create(transaction=tx, rate=rate, amount=commission_amount)

        provider = project_request.assigned_provider if project_request else None
        if provider is not None:
            ProviderEarning.objects.get_or_create(
                transaction=tx,
                defaults={
                    "provider": provider,
                    "amount": (tx.amount - commission_amount).quantize(Decimal("0.01")),
                    "payout_status": "pending",
                },
            )

    # Notify the customer.
    if project_request is not None:
        Notification.objects.create(
            user=project_request.customer,
            type=Notification.Type.PAYMENT_SUCCESS,
            message="Payment received — your deliverables are now available.",
            link=f"/requests/{project_request.id}",
        )


def _normalize_status(raw: str) -> str:
    normalized = (raw or "").lower()
    if normalized in ("success", "succeeded", "paid", "complete", "completed"):
        return Transaction.Status.SUCCESS
    if normalized in ("failed", "error"):
        return Transaction.Status.FAILED
    if normalized in ("refunded",):
        return Transaction.Status.REFUNDED
    return Transaction.Status.INITIATED


def process_payment_event(reference: str, raw_status: str) -> Transaction:
    """Apply a PSP event to its transaction (idempotent). Shared by the
    webhook and the dev simulate endpoint."""
    try:
        tx = Transaction.objects.get(external_reference=reference)
    except Transaction.DoesNotExist:
        raise Transaction.DoesNotExist

    new_status = _normalize_status(raw_status)
    with db_transaction.atomic():
        if tx.status != new_status:
            tx.status = new_status
            tx.save(update_fields=["status", "updated_at"])
        if new_status == Transaction.Status.SUCCESS:
            finalize_successful_payment(tx)
    return tx


class InitiatePaymentView(generics.GenericAPIView):
    """Create a PSP payment intent for a request in `awaiting_payment`.

    Route (workflow): POST /api/v1/requests/<id>/payment/initiate/
    Back-compat:        POST /api/v1/payments/initiate/  (pass request_id in body)
    """
    serializer_class = PaymentInitiateResponseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, request_id=None):
        if request_id is None:
            request_id = request.data.get("request_id")
        if request_id is None:
            raise ValidationError({"request_id": "This field is required."})

        from service_requests.models import ProjectRequest

        project_request = generics.get_object_or_404(ProjectRequest, id=request_id)
        if project_request.customer_id != request.user.id:
            raise PermissionDenied("Only the request owner can pay.")
        if project_request.status != "awaiting_payment":
            raise ValidationError(
                "Payments can only be initiated for requests awaiting payment."
            )

        amount = _request_total(project_request)
        if amount <= 0:
            raise ValidationError("Request has no billable services.")

        gateway = get_gateway()
        intent = gateway.create_payment_intent(
            amount=amount,
            currency="USD",
            request_id=project_request.id,
        )

        tx = Transaction.objects.create(
            user=request.user,
            request=project_request,
            amount=amount,
            currency="USD",
            payment_method=gateway.name,
            status=Transaction.Status.INITIATED,
            gateway=gateway.name,
            gateway_intent_id=intent["intent_id"],
            client_secret=intent["client_secret"],
            checkout_url=intent["checkout_url"],
            external_reference=intent["intent_id"],
        )

        return Response(
            PaymentInitiateResponseSerializer(
                {
                    "transaction_id": tx.id,
                    "amount": tx.amount,
                    "currency": tx.currency,
            "client_secret": tx.client_secret,
            "checkout_url": tx.checkout_url,
            "reference": tx.external_reference,
        }
    ).data,
    status=status.HTTP_201_CREATED,
)


class PaymentWebhookView(generics.GenericAPIView):
    """PSP webhook entrypoint.

    Route (workflow): POST /api/v1/webhooks/payment/
    Back-compat:        POST /api/v1/payments/webhook/
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        gateway = get_gateway()
        signature = request.headers.get("X-Payment-Signature", "")
        try:
            event = gateway.build_webhook_event(
                raw_body=request.body, signature=signature
            )
        except ValueError as exc:
            return Response(
                {"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            process_payment_event(event["reference"], event["status"])
        except Transaction.DoesNotExist:
            return Response(
                {"detail": "Invalid reference"}, status=status.HTTP_404_NOT_FOUND
            )

        return Response({"status": "ok"})


class SimulateSuccessView(generics.GenericAPIView):
    """Dev-only shortcut to complete a dummy-gateway payment without a real
    PSP. Mirrors a successful webhook event. Disabled unless DEBUG."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from django.conf import settings

        if not settings.DEBUG:
            return Response(
                {"detail": "Not available."}, status=status.HTTP_404_NOT_FOUND
            )
        reference = request.data.get("reference")
        if not reference:
            raise ValidationError({"reference": "This field is required."})
        try:
            process_payment_event(reference, "success")
        except Transaction.DoesNotExist:
            return Response(
                {"detail": "Invalid reference"}, status=status.HTTP_404_NOT_FOUND
            )
        return Response({"status": "ok"})


class GenerateInvoiceView(generics.RetrieveAPIView):
    serializer_class = InvoiceSerializer

    def get_object(self):
        return self.get_queryset().first()

    def get_queryset(self):
        return Invoice.objects.select_related('transaction').filter(
            transaction__user=self.request.user,
            transaction__status='success'
        )


class ProviderEarningsView(generics.ListAPIView):
    serializer_class = ProviderEarningSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ProviderEarning.objects.filter(provider=self.request.user)


class AdminTransactionListView(generics.ListAPIView):
    """Admin: all transactions for review/oversight."""

    serializer_class = AdminTransactionSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        return (
            Transaction.objects.select_related('user', 'request__customer')
            .order_by('-created_at')
        )


class AdminTransactionActionView(generics.GenericAPIView):
    """Admin: manually approve (finalize) or reject a transaction."""

    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        action = request.data.get('action')
        if action not in ('approve', 'reject'):
            raise ValidationError({'action': "Must be 'approve' or 'reject'."})

        tx = generics.get_object_or_404(Transaction, pk=pk)
        process_payment_event(
            tx.external_reference, 'success' if action == 'approve' else 'failed'
        )
        tx.refresh_from_db()
        return Response(AdminTransactionSerializer(tx).data)
