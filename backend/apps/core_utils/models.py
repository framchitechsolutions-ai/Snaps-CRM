from django.db import models

class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        abstract = True

class RequestStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    DRAFT = 'draft', 'Draft'
    SUBMITTED = 'submitted', 'Submitted'
    IN_REVIEW = 'in_review', 'In Review'
    IN_PROGRESS = 'in_progress', 'In Progress'
    AWAITING_PAYMENT = 'awaiting_payment', 'Awaiting Payment'
    COMPLETED = 'completed', 'Completed'
    CANCELLED = 'cancelled', 'Cancelled'

class ServiceType(models.TextChoices):
    BOQ = 'boq', 'Bill of Quantities'
    WORK_SCHEDULE = 'work_schedule', 'Work Schedule'
    DWG_REVIEW = 'dwg_review', 'DWG Review'
    COST_ESTIMATION = 'cost_estimation', 'Cost Estimation'

class DocumentType(models.TextChoices):
    DWG = 'dwg', 'DWG'
    PDF = 'pdf', 'PDF'
    IMAGE = 'image', 'Image'
    OTHER = 'other', 'Other'

class UserType(models.TextChoices):
    CUSTOMER = 'customer', 'Customer'
    PROVIDER = 'provider', 'Provider'
    ADMIN = 'admin', 'Admin'

class VerificationStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    APPROVED = 'approved', 'Approved'
    REJECTED = 'rejected', 'Rejected'