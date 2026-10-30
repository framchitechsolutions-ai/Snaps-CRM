from rest_framework import filters, permissions, viewsets

from .models import Quotation
from .serializers import QuotationSerializer


class QuotationViewSet(viewsets.ModelViewSet):
    """
    CRUD for quotations.

    - GET    /api/v1/quotations/           paginated list
    - POST   /api/v1/quotations/           create (with items[])
    - GET    /api/v1/quotations/<id>/      retrieve
    - PATCH  /api/v1/quotations/<id>/      update
    - DELETE /api/v1/quotations/<id>/      delete
    """
    queryset = Quotation.objects.select_related('client').prefetch_related('items__product')
    serializer_class = QuotationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = [
        'reference', 'client__email', 'client__first_name',
        'client__last_name', 'status',
    ]