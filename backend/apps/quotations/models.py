from decimal import Decimal

from django.conf import settings
from django.db import models
from django.utils import timezone


class Quotation(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('sent', 'Sent'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]

    reference = models.CharField(max_length=32, unique=True, blank=True)
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='quotations',
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.reference} — {self.client}'

    @property
    def subtotal(self):
        return sum((item.line_total for item in self.items.all()), Decimal('0.00'))

    def save(self, *args, **kwargs):
        if not self.reference:
            today = timezone.now().strftime('%Y%m%d')
            count = Quotation.objects.filter(
                reference__startswith=f'QT-{today}'
            ).count() + 1
            self.reference = f'QT-{today}-{count:04d}'
        super().save(*args, **kwargs)


class QuotationItem(models.Model):
    quotation = models.ForeignKey(
        Quotation,
        on_delete=models.CASCADE,
        related_name='items',
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.PROTECT,
        related_name='quotation_items',
    )
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        ordering = ['id']

    @property
    def line_total(self):
        return (self.unit_price or Decimal('0.00')) * self.quantity