from rest_framework import serializers

from .models import Quotation, QuotationItem


class QuotationItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    line_total = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model = QuotationItem
        fields = ['id', 'product', 'product_name', 'product_sku',
                  'quantity', 'unit_price', 'line_total']


class QuotationSerializer(serializers.ModelSerializer):
    items = QuotationItemSerializer(many=True)
    client_email = serializers.CharField(source='client.email', read_only=True)
    client_name = serializers.SerializerMethodField(read_only=True)
    subtotal = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model = Quotation
        fields = [
            'id', 'reference', 'client', 'client_email', 'client_name',
            'status', 'notes', 'subtotal', 'items',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'reference', 'created_at', 'updated_at', 'subtotal']

    def get_client_name(self, obj):
        full = f'{obj.client.first_name} {obj.client.last_name}'.strip()
        return full or obj.client.email

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        quotation = Quotation.objects.create(**validated_data)
        self._save_items(quotation, items_data)
        return quotation

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        if items_data is not None:
            instance.items.all().delete()
            self._save_items(instance, items_data)
        return instance

    def _save_items(self, quotation, items_data):
        for item in items_data:
            product = item['product']
            unit_price = item.get('unit_price') or product.price
            QuotationItem.objects.create(
                quotation=quotation,
                product=product,
                quantity=item.get('quantity', 1),
                unit_price=unit_price,
            )

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError('At least one product is required.')
        return value