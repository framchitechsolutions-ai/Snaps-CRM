from rest_framework import filters, permissions, viewsets

from .models import Product
from .serializers import ProductSerializer


class ProductViewSet(viewsets.ModelViewSet):
    """
    CRUD for products.

    - GET    /api/v1/products/          → paginated list
                                          (?page=&page_size=&search=)
    - POST   /api/v1/products/          → create
    - GET    /api/v1/products/<id>/     → retrieve
    - PATCH  /api/v1/products/<id>/     → partial update
    - PUT    /api/v1/products/<id>/     → full update
    - DELETE /api/v1/products/<id>/     → soft delete (is_active=False)
    """
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'sku', 'category', 'description']

    def perform_destroy(self, instance):
        # Soft delete keeps audit history.
        # Change to instance.delete() if you want hard deletes.
        instance.is_active = False
        instance.save(update_fields=['is_active'])