from django.contrib import admin
from .models import User, ProviderProfile, CustomerProfile

admin.site.register(User)
admin.site.register(ProviderProfile)
admin.site.register(CustomerProfile)