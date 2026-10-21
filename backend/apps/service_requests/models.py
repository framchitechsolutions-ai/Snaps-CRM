from django.db import models
from django.conf import settings
from core_utils.models import TimeStampedModel, RequestStatus, ServiceType, DocumentType

class Service(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField()
    base_price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return self.name

class ProjectRequest(TimeStampedModel):
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='requests')
    title = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=RequestStatus.choices, default=RequestStatus.DRAFT)
    assigned_provider = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_requests'
    )

class Document(TimeStampedModel):
    project_request = models.ForeignKey(ProjectRequest, on_delete=models.CASCADE, related_name='documents')
    file_url = models.URLField()
    storage_name = models.CharField(max_length=512, blank=True)
    document_type = models.CharField(max_length=20, choices=DocumentType.choices)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    original_filename = models.CharField(max_length=255)

class SelectedService(models.Model):
    project_request = models.ForeignKey(ProjectRequest, on_delete=models.CASCADE, related_name='selected_services')
    service = models.ForeignKey(Service, on_delete=models.CASCADE)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=RequestStatus.choices, default=RequestStatus.PENDING)

class Deliverable(TimeStampedModel):
    selected_service = models.ForeignKey(SelectedService, on_delete=models.CASCADE, related_name='deliverables')
    file_url = models.URLField()
    storage_name = models.CharField(max_length=512, blank=True)
    original_filename = models.CharField(max_length=255)

class Message(models.Model):
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='request_messages')
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    project_request = models.ForeignKey(ProjectRequest, on_delete=models.CASCADE, related_name='messages')

    class Meta:
        ordering = ['timestamp']