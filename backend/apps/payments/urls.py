from django.urls import path
from . import views

urlpatterns = [
    path('initiate/', views.InitiatePaymentView.as_view(), name='initiate-payment'),
    path('webhook/', views.PaymentWebhookView.as_view(), name='payment-webhook'),
    path('simulate-success/', views.SimulateSuccessView.as_view(), name='simulate-success'),
    path('invoice/', views.GenerateInvoiceView.as_view(), name='generate-invoice'),
    path('earnings/', views.ProviderEarningsView.as_view(), name='provider-earnings'),
    path('admin/transactions/', views.AdminTransactionListView.as_view(), name='admin-transactions'),
    path('admin/transactions/<int:pk>/action/', views.AdminTransactionActionView.as_view(), name='admin-transaction-action'),
]