"""Django project URLs."""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from payments.views import PaymentWebhookView
from service_requests.views import SubmitDeliverableView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('accounts.urls')),
    path('api/v1/requests/', include('service_requests.urls')),
    path('api/v1/payments/', include('payments.urls')),
    path('api/v1/notifications/', include('notifications.urls')),
    path('api/v1/messaging/', include('messaging.urls')),
    path('api/v1/webhooks/payment/', PaymentWebhookView.as_view(), name='payment-webhook-workflow'),
    path('api/v1/providers/requests/<int:request_id>/deliverable/', SubmitDeliverableView.as_view(), name='provider-submit-deliverable'),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)