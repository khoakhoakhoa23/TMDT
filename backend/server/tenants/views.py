from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from django.db import models

from core.permissions import IsSuperAdmin
from .models import Tenant, TenantStatus
from .serializers import TenantSerializer, TenantListSerializer


class TenantViewSet(viewsets.ModelViewSet):
    """
    Super Admin only: CRUD tenants.
    """

    queryset = Tenant.objects.all().order_by("name")
    serializer_class = TenantSerializer
    permission_classes = [IsSuperAdmin]

    def get_serializer_class(self):
        if self.action == 'list':
            return TenantListSerializer
        return TenantSerializer

    def perform_destroy(self, instance):
        """Soft delete tenant"""
        from django.utils import timezone
        instance.deleted_at = timezone.now()
        instance.status = TenantStatus.INACTIVE
        instance.is_active = False
        instance.save()

    def destroy(self, request, *args, **kwargs):
        """Override destroy để soft delete"""
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


# ==================== Public APIs ====================

def _public_tenant_payload(tenant: Tenant) -> dict:
    data = {
        "id": tenant.id,
        "name": tenant.name,
        "code": tenant.code,
        "slug": tenant.slug,
        "address": tenant.address,
        "phone": tenant.phone,
        "email": tenant.email,
        "status": tenant.status,
        "is_active": tenant.is_active,
        "theme": tenant.theme,
        "logo": tenant.logo,
        "primary_color": tenant.primary_color,
        "banner_image": tenant.banner_image,
        "description": tenant.description,
        "created_at": tenant.created_at,
    }

    # Nếu tenant bị khóa, thêm thông báo
    if tenant.status == TenantStatus.LOCKED:
        data["locked"] = True
        data["message"] = "Tenant này đã bị khóa tạm thời"
    elif tenant.status == TenantStatus.INACTIVE:
        data["locked"] = True
        data["message"] = "Tenant này không còn hoạt động"
    else:
        data["locked"] = False

    return data


def _get_tenant_by_key(tenant_key: str) -> Tenant | None:
    """
    Resolve tenant by a key without any fallback.

    - If tenant_key is digits => lookup by primary key
    - Else => lookup by slug OR code (case-insensitive)

    Soft-deleted tenants (deleted_at != null) are treated as not found.
    """
    key = (tenant_key or "").strip()
    if not key:
        return None

    qs = Tenant.objects.filter(deleted_at__isnull=True)

    if key.isdigit():
        return qs.filter(pk=int(key)).first()

    return qs.filter(models.Q(slug=key) | models.Q(code__iexact=key)).first()


@api_view(["GET"])
@permission_classes([AllowAny])
def public_tenant_detail(request, tenant_id):
    """
    API public lấy thông tin tenant.
    URL: GET /api/public/tenants/:tenantId

    KHÔNG yêu cầu authentication.    Response:
    - 200: Tenant tồn tại
    - 404: Tenant không tồn tại

    Lưu ý:
    - Không sử dụng Default Tenant
    - Không fallback về tenant khác
    - Trả về thông tin đầy đủ bao gồm theme, logo, colors
    """
    # Tìm tenant theo ID - KHÔNG fallback
    tenant = Tenant.objects.filter(pk=tenant_id, deleted_at__isnull=True).first()
    if not tenant:
        return Response(
            {"error": "Tenant không tồn tại", "code": "TENANT_NOT_FOUND"},
            status=404,
        )

    return Response(_public_tenant_payload(tenant))


@api_view(["GET"])
@permission_classes([AllowAny])
def public_tenant_detail_by_key(request, tenant_key: str):
    """
    API public lấy thông tin tenant theo key (id hoặc slug/code).
    URL: GET /api/public/tenants/:tenantKey

    KHÔNG yêu cầu authentication.
    KHÔNG sử dụng Default Tenant.
    KHÔNG fallback về tenant khác.
    """
    tenant = _get_tenant_by_key(tenant_key)
    if not tenant:
        return Response(
            {"error": "Tenant không tồn tại", "code": "TENANT_NOT_FOUND"},
            status=404,
        )

    return Response(_public_tenant_payload(tenant))


@api_view(["GET"])
@permission_classes([AllowAny])
def public_tenant_by_slug(request, slug):
    """
    API public lấy thông tin tenant theo slug.
    URL: /api/public/tenants/slug/:slug

    Dùng khi muốn truy cập theo slug thay vì ID.
    """
    try:
        tenant = Tenant.objects.get(slug=slug, deleted_at__isnull=True)
    except Tenant.DoesNotExist:
        return Response(
            {"error": "Tenant không tồn tại", "code": "TENANT_NOT_FOUND"},
            status=404
        )

    data = {
        "id": tenant.id,
        "name": tenant.name,
        "code": tenant.code,
        "slug": tenant.slug,
        "address": tenant.address,
        "phone": tenant.phone,
        "email": tenant.email,
        "status": tenant.status,
        "is_active": tenant.is_active,
        "theme": tenant.theme,
        "logo": tenant.logo,
        "primary_color": tenant.primary_color,
        "banner_image": tenant.banner_image,
        "description": tenant.description,
        "created_at": tenant.created_at,
        "locked": tenant.status != TenantStatus.ACTIVE,
    }

    return Response(data)
