from rest_framework import viewsets

from core.permissions import IsSuperAdmin
from .models import Tenant
from .serializers import TenantSerializer


class TenantViewSet(viewsets.ModelViewSet):
    """
    Super Admin only: CRUD tenants.
    """

    queryset = Tenant.objects.all().order_by("name")
    serializer_class = TenantSerializer
    permission_classes = [IsSuperAdmin]

