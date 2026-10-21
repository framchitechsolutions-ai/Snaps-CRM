from django.urls import path
from . import views
from payments.views import InitiatePaymentView

urlpatterns = [
    path('services/', views.ServicesView.as_view(), name='services'),
    path('', views.CreateRequestView.as_view(), name='create-request'),
    path('my/', views.MyRequestsView.as_view(), name='my-requests'),
    path('admin/', views.AdminRequestListView.as_view(), name='admin-request-list'),
    path('provider/', views.ProviderRequestsView.as_view(), name='provider-requests'),
    path('<int:pk>/', views.RequestDetailView.as_view(), name='request-detail'),
    path('<int:request_id>/upload-document/', views.UploadDocumentView.as_view(), name='upload-document'),
    path('<int:request_id>/deliverable/', views.SubmitDeliverableView.as_view(), name='submit-deliverable'),
    path('<int:request_id>/deliverables/<int:deliverable_id>/download/', views.DeliverableDownloadView.as_view(), name='deliverable-download'),
    path('<int:request_id>/payment/initiate/', InitiatePaymentView.as_view(), name='payment-initiate'),
    path('<int:request_id>/review-deliverable/', views.ReviewDeliverableView.as_view(), name='review-deliverable'),
]