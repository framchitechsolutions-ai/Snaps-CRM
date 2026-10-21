from django.contrib import admin
from .models import Transaction, Invoice, Commission, ProviderEarning

admin.site.register(Transaction)
admin.site.register(Invoice)
admin.site.register(Commission)
admin.site.register(ProviderEarning)