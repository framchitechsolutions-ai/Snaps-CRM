from rest_framework import serializers
from .models import Transaction, Invoice, Commission, ProviderEarning


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = [
            'id', 'request', 'amount', 'currency', 'payment_method',
            'status', 'gateway', 'client_secret', 'checkout_url',
            'external_reference', 'created_at',
        ]
        read_only_fields = [
            'id', 'request', 'status', 'gateway', 'client_secret',
            'checkout_url', 'external_reference', 'created_at',
        ]


class PaymentInitiateResponseSerializer(serializers.Serializer):
    transaction_id = serializers.IntegerField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    currency = serializers.CharField()
    client_secret = serializers.CharField()
    checkout_url = serializers.URLField()
    reference = serializers.CharField()


class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = ['id', 'invoice_number', 'pdf_url', 'created_at']


class ProviderEarningSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProviderEarning
        fields = ['id', 'provider', 'amount', 'payout_status', 'created_at']


class TransactionRequestSummarySerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()

    class Meta:
        model = 'service_requests.ProjectRequest'
        fields = ['id', 'title', 'status', 'customer_name']

    def get_customer_name(self, obj):
        name = f"{obj.customer.first_name} {obj.customer.last_name}".strip()
        return name or obj.customer.email


class AdminTransactionSerializer(serializers.ModelSerializer):
    request = TransactionRequestSummarySerializer(read_only=True)
    customer_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id', 'amount', 'currency', 'payment_method', 'status',
            'gateway', 'external_reference', 'created_at',
            'request', 'customer_email',
        ]
