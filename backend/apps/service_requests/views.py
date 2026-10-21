from django.core.files.storage import default_storage
from django.http import Http404
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError, NotFound
from django.shortcuts import get_object_or_404

from .models import ProjectRequest, Document, Deliverable, SelectedService, Service
from .serializers import (
    ProjectRequestSerializer,
    CreateProjectRequestSerializer,
    DocumentSerializer,
    DeliverableSerializer,
    ServiceSerializer,
)
from accounts.permissions import IsProvider, IsCustomer
from accounts.models import User


def build_signed_url(storage_name: str, expiry: int = 300) -> str:
    """Return a temporary, signed URL for `storage_name` when possible.

    For S3-backed storage this produces a presigned GET URL; for local
    development storage it falls back to the public media URL.
    """
    storage = default_storage
    s3 = getattr(storage, "connection", None)
    if s3 is not None and hasattr(s3, "meta") and hasattr(s3.meta, "client"):
        params = {"Bucket": storage.bucket.name, "Key": storage_name}
        return s3.meta.client.generate_presigned_url(
            "get_object", Params=params, ExpiresIn=expiry
        )
    return storage.url(storage_name)


class ServicesView(generics.ListAPIView):
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Service.objects.all()


class CreateRequestView(generics.CreateAPIView):
    serializer_class = CreateProjectRequestSerializer
    permission_classes = [IsCustomer]

    def perform_create(self, serializer):
        serializer.save(customer=self.request.user)


class MyRequestsView(generics.ListAPIView):
    serializer_class = ProjectRequestSerializer
    permission_classes = [IsCustomer]

    def get_queryset(self):
        return ProjectRequest.objects.filter(customer=self.request.user)


class ProviderRequestsView(generics.ListAPIView):
    serializer_class = ProjectRequestSerializer
    permission_classes = [IsProvider]

    def get_queryset(self):
        return ProjectRequest.objects.filter(assigned_provider=self.request.user)


class AdminRequestListView(generics.ListAPIView):
    """Admin: all requests (for assignment / oversight)."""

    serializer_class = ProjectRequestSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        return (
            ProjectRequest.objects.all()
            .select_related('customer', 'assigned_provider')
            .prefetch_related('selected_services__service')
            .order_by('-created_at')
        )


class RequestDetailView(generics.RetrieveUpdateAPIView):
    queryset = ProjectRequest.objects.all()
    serializer_class = ProjectRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        obj = super().get_object()
        user = self.request.user
        if user == obj.customer or user == obj.assigned_provider or user.is_staff:
            return obj
        raise PermissionDenied('You do not have access to this request.')

    def update(self, request, *args, **kwargs):
        # PATCH supports `status` updates and (admin only) `assigned_provider`.
        obj = self.get_object()
        new_status = request.data.get('status')
        assigned_provider_id = request.data.get('assigned_provider')

        if new_status is None and assigned_provider_id is None:
            return Response(
                {'detail': 'Provide `status` and/or `assigned_provider`.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if assigned_provider_id is not None:
            if not request.user.is_staff:
                raise PermissionDenied('Only staff can assign a provider.')
            provider = get_object_or_404(
                User, id=assigned_provider_id, user_type='provider'
            )
            obj.assigned_provider = provider

        if new_status is not None:
            obj.status = new_status

        obj.save(update_fields=['status', 'assigned_provider', 'updated_at'])
        return Response(self.get_serializer(obj).data)


class UploadDocumentView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, request_id):
        project_request = get_object_or_404(ProjectRequest, id=request_id)
        user = request.user
        if user != project_request.customer and user != project_request.assigned_provider:
            return Response({'detail': 'Not allowed.'}, status=status.HTTP_403_FORBIDDEN)

        file = request.FILES.get('file')
        document_type = request.data.get('document_type')
        if not file or not document_type:
            return Response(
                {'detail': 'Both `file` and `document_type` are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        path = default_storage.save(f'documents/{request_id}/{file.name}', file)
        document = Document.objects.create(
            project_request=project_request,
            file_url=default_storage.url(path),
            storage_name=path,
            document_type=document_type,
            uploaded_by=user,
            original_filename=file.name,
        )
        return Response(DocumentSerializer(document).data, status=status.HTTP_201_CREATED)


class SubmitDeliverableView(generics.GenericAPIView):
    permission_classes = [IsProvider]

    def post(self, request, request_id):
        project_request = get_object_or_404(
            ProjectRequest, id=request_id, assigned_provider=request.user
        )
        selected_service_id = request.data.get('selected_service_id')
        file = request.FILES.get('file')

        if not selected_service_id or not file:
            return Response(
                {'detail': 'Both `selected_service_id` and `file` (PDF) are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        selected_service = get_object_or_404(
            SelectedService, id=selected_service_id, project_request=project_request
        )

        path = default_storage.save(f'deliverables/{request_id}/{file.name}', file)
        deliverable = Deliverable.objects.create(
            selected_service=selected_service,
            file_url=default_storage.url(path),
            storage_name=path,
            original_filename=file.name,
        )
        selected_service.status = 'completed'
        selected_service.save(update_fields=['status'])

        # Only move the request to Awaiting-Payment once EVERY selected
        # service has a completed deliverable.
        all_done = not selected_service.project_request.selected_services.exclude(
            status='completed'
        ).exists()
        if all_done:
            project_request.status = 'awaiting_payment'
            project_request.save(update_fields=['status', 'updated_at'])

        return Response(DeliverableSerializer(deliverable).data, status=status.HTTP_201_CREATED)


class ReviewDeliverableView(generics.GenericAPIView):
    permission_classes = [IsCustomer]

    def post(self, request, request_id):
        project_request = get_object_or_404(
            ProjectRequest, id=request_id, customer=request.user
        )
        deliverable_id = request.data.get('deliverable_id')
        action = request.data.get('action')

        if not deliverable_id or action not in ('accept', 'reject'):
            return Response(
                {'detail': '`deliverable_id` and `action` (accept|reject) are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        deliverable = get_object_or_404(
            Deliverable, id=deliverable_id, selected_service__project_request=project_request
        )

        if action == 'accept':
            # Deliverable accepted. The request stays in Awaiting-Payment
            # until the customer pays; completion happens via the payment
            # webhook, not here.
            deliverable.selected_service.status = 'completed'
            deliverable.selected_service.save(update_fields=['status'])
        else:
            # Rejected: reopen the service for rework and send the request
            # back to In-Progress.
            deliverable.selected_service.status = 'in_progress'
            deliverable.selected_service.save(update_fields=['status'])
            project_request.status = 'in_progress'

        project_request.save(update_fields=['status', 'updated_at'])
        return Response(ProjectRequestSerializer(project_request).data)


class DeliverableDownloadView(generics.GenericAPIView):
    """Return a temporary, signed URL for a deliverable.

    Accessible by the request's customer, assigned provider, or staff. In
    production the signed URL expires and is generated by cloud storage.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, request_id, deliverable_id):
        project_request = get_object_or_404(ProjectRequest, id=request_id)
        user = request.user
        if not (
            user == project_request.customer
            or user == project_request.assigned_provider
            or user.is_staff
        ):
            raise PermissionDenied('You do not have access to this deliverable.')

        deliverable = get_object_or_404(
            Deliverable,
            id=deliverable_id,
            selected_service__project_request=project_request,
        )

        storage_name = deliverable.storage_name or None
        if storage_name:
            url = build_signed_url(storage_name, expiry=300)
        else:
            url = deliverable.file_url

        return Response({
            'download_url': url,
            'expires_in': 300,
            'original_filename': deliverable.original_filename,
        })
