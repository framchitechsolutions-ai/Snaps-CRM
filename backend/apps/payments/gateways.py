"""Payment gateway abstraction.

The platform talks to a single ``BaseGateway`` interface so the rest of the
codebase never depends on a concrete PSP (Stripe, Paystack, ...). A ``dummy``
gateway is provided so the full workflow is runnable without external keys;
swap in a real adapter by setting ``PAYMENT_GATEWAY`` and implementing the
same interface.
"""
from __future__ import annotations

import hashlib
import hmac
import json
import uuid
from decimal import Decimal

from django.conf import settings


class BaseGateway:
    """Interface every PSP adapter must implement."""

    name = "base"

    def create_payment_intent(self, *, amount: Decimal, currency: str, request_id: int) -> dict:
        """Return intent details: intent_id, client_secret, checkout_url."""
        raise NotImplementedError

    def build_webhook_event(self, *, raw_body: bytes, signature: str) -> dict:
        """Validate the signature and return a normalized event.

        Returns ``{"reference": str, "status": str}`` where status is one of
        Transaction.Status. Raises ``ValueError`` on invalid signature/payload.
        """
        raise NotImplementedError


class DummyGateway(BaseGateway):
    """In-memory gateway used for local dev and tests (no network calls)."""

    name = "dummy"

    def create_payment_intent(self, *, amount: Decimal, currency: str, request_id: int) -> dict:
        intent_id = f"dummy_{uuid.uuid4().hex}"
        return {
            "intent_id": intent_id,
            "client_secret": f"{intent_id}_secret",
            "checkout_url": f"/mock-checkout/{intent_id}",
        }

    def build_webhook_event(self, *, raw_body: bytes, signature: str) -> dict:
        secret = settings.PAYMENT_WEBHOOK_SECRET.encode()
        expected = hmac.new(secret, raw_body, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, signature):
            raise ValueError("invalid webhook signature")
        try:
            payload = json.loads(raw_body.decode())
        except (ValueError, UnicodeDecodeError) as exc:
            raise ValueError("malformed webhook payload") from exc
        reference = payload.get("reference")
        status = payload.get("status")
        if not reference or not status:
            raise ValueError("missing reference/status")
        return {"reference": str(reference), "status": str(status)}


_GATEWAYS = {
    DummyGateway.name: DummyGateway,
}


def get_gateway(name: str | None = None) -> BaseGateway:
    name = name or getattr(settings, "PAYMENT_GATEWAY", "dummy")
    gateway_cls = _GATEWAYS.get(name)
    if gateway_cls is None:
        raise ValueError(f"Unknown payment gateway: {name}")
    return gateway_cls()
