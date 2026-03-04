"""
Tenant Scoping - Áp dụng tenant isolation cho các query.

QUY TẮC QUAN TRỌNG:
1. KHÔNG BAO GIỜ tin tenantId từ client
2. LUÔN lấy tenantId từ JWT token
3. Query PHẢI được filter theo tenantId từ JWT
4. SUPER_ADMIN có thể query mọi tenant (nếu có X-Tenant header)

MULTI-TENANT STRATEGIES:
- Shared Database, Shared Schema: Thêm tenant_id vào mọi bảng
- Shared Database, Separate Schema: Mỗi tenant có schema riêng
- Separate Database: Mỗi tenant có database riêng (migrate/filter riêng)

Hiện tại sử dụng: Shared Database, Shared Schema với tenant_id column
"""

from __future__ import annotations

from django.db.models import QuerySet, Q
from typing import Optional, Union
import logging

logger = logging.getLogger(__name__)


def get_tenant_from_request(request) -> Optional[str]:
    """
    Lấy tenant ID từ JWT token (nguồn tin cậy).
    
    Ưu tiên:
    1. JWT token (tenantId claim)
    2. X-Tenant header (cho admin operations)
    3. Profile (fallback)
    
    Args:
        request: Django Request object
        
    Returns:
        Tenant ID dạng string hoặc None (cho SUPER_ADMIN)
    """
    from core.permissions import get_tenant_context
    
    # Thử lấy từ JWT
    if hasattr(request, 'auth') and request.auth:
        # Hỗ trợ cả hai format: tenantId (camelCase) và tenant_id (underscore)
        tenant_id = request.auth.get('tenantId') or request.auth.get('tenant_id')
        if tenant_id:
            return str(tenant_id)
    
    # Fallback: lấy từ profile
    user = getattr(request, 'user', None)
    if user and user.is_authenticated:
        profile = getattr(user, 'profile', None)
        if profile and profile.tenant_id:
            return str(profile.tenant_id)
    
    return None


def get_tenant_context_from_request(request) -> Optional['TenantContext']:
    """
    Lấy full TenantContext từ request.
    
    Args:
        request: Django Request object
        
    Returns:
        TenantContext hoặc None
    """
    from core.permissions import get_tenant_context
    
    try:
        return get_tenant_context(request)
    except Exception:
        return None


def apply_tenant_filter(
    qs: QuerySet, 
    request,
    tenant_field: str = "tenant",
    include_deleted: bool = False
) -> QuerySet:
    """
    Apply tenant isolation to a queryset.
    
    QUY TẮC:
    - SUPER_ADMIN: trả về full queryset (trừ khi có X-Tenant header cụ thể)
    - Non-SUPER_ADMIN: bắt buộc filter theo tenant từ JWT
    
    Args:
        qs: QuerySet cần filter
        request: Django Request object
        tenant_field: Tên trường tenant trong model (mặc định: "tenant")
        include_deleted: Có bao gồm soft-deleted records không
        
    Returns:
        QuerySet đã được filter theo tenant
        
    Example:
        class ProductViewSet(viewsets.ModelViewSet):
            def get_queryset(self):
                return apply_tenant_filter(
                    super().get_queryset(), 
                    self.request,
                    tenant_field="tenant"
                )
    """
    model = getattr(qs, "model", None)
    if not model:
        return qs
    
    # Kiểm tra model có trường tenant không
    if not any(f.name == tenant_field for f in model._meta.fields):
        logger.warning(f"Model {model.__name__} không có trường {tenant_field}")
        return qs
    
    # Lấy user từ request
    user = getattr(request, "user", None)
    if not user or not user.is_authenticated:
        return qs.none()  # Không cho phép query nếu không đăng nhập
    
    # Lấy profile
    profile = getattr(user, "profile", None)
    
    # Lấy tenantId từ JWT (nguồn tin cậy)
    tenant_id = get_tenant_from_request(request)
    
    # Check X-Tenant header (chỉ dùng cho admin operations)
    header_tenant = request.headers.get("X-Tenant") or request.headers.get("X-Tenant-Slug")
    
    # SUPER_ADMIN logic
    if profile and (profile.role == "SUPER_ADMIN" or user.is_superuser):
        # Nếu có X-Tenant header → filter theo header
        if header_tenant:
            # X-Tenant có thể là ID hoặc slug
            try:
                # Th theử lookupo UUID
                from tenants.models import Tenant
                tenant = Tenant.objects.filter(
                    Q(id=header_tenant) | Q(code=header_tenant) | Q(slug=header_tenant)
                ).first()
                if tenant:
                    qs = qs.filter(**{tenant_field: tenant})
            except Exception:
                pass
        # Không có header → SUPER_ADMIN xem được mọi tenant
        # Nhưng vẫn exclude soft-deleted unless explicitly requested
        if not include_deleted:
            qs = qs.exclude(**{f"{tenant_field}__deleted_at__isnull": False})
        return qs
    
    # Non-SUPER_ADMIN: BẮT BUỘC phải có tenantId từ JWT
    if not tenant_id:
        # User không có tenant → không cho query
        logger.warning(f"User {user.id} không có tenant nhưng cố gắng query {model.__name__}")
        return qs.none()
    
    # Filter theo tenant từ JWT
    qs = qs.filter(**{tenant_field: tenant_id})
    
    # Exclude soft-deleted unless explicitly requested
    if not include_deleted:
        qs = qs.exclude(**{f"{tenant_field}__deleted_at__isnull": False})
    
    return qs


def get_current_tenant(request):
    """
    Lấy Tenant object hiện tại từ request.
    
    Args:
        request: Django Request object
        
    Returns:
        Tenant object hoặc None
    """
    tenant_id = get_tenant_from_request(request)
    if not tenant_id:
        return None
    
    from tenants.models import Tenant
    try:
        return Tenant.objects.get(id=tenant_id)
    except Tenant.DoesNotExist:
        return None


def get_tenant_queryset(user, include_inactive: bool = False) -> QuerySet:
    """
    Lấy queryset các tenant mà user có quyền truy cập.
    
    Args:
        user: Django User object
        include_inactive: Có bao gồm inactive tenants không
        
    Returns:
        QuerySet of Tenant
    """
    from tenants.models import Tenant
    
    profile = getattr(user, "profile", None)
    
    # SUPER_ADMIN: xem được mọi tenant
    if profile and (profile.role == "SUPER_ADMIN" or user.is_superuser):
        qs = Tenant.objects.all()
        if not include_inactive:
            qs = qs.filter(deleted_at__isnull=True)
        return qs
    
    # Non-SUPER_ADMIN: chỉ xem được tenant của mình
    if profile and profile.tenant_id:
        return Tenant.objects.filter(id=profile.tenant_id)
    
    # Không có tenant → empty queryset
    return Tenant.objects.none()


# ==================== Service Layer Helpers ====================

class TenantScopedService:
    """
    Base class cho các service cần tenant isolation.
    Cung cấp các helper methods để query với tenant scoping.
    """
    
    def __init__(self, request):
        self.request = request
        self.user = getattr(request, "user", None)
        self.tenant_context = get_tenant_context_from_request(request)
        self.tenant_id = get_tenant_from_request(request)
    
    @property
    def is_super_admin(self) -> bool:
        """User có phải SUPER_ADMIN không"""
        if not self.tenant_context:
            return False
        return self.tenant_context.is_super_admin
    
    def get_tenant_filter(self, field_name: str = "tenant") -> dict:
        """
        Lấy filter dict cho tenant.
        
        Returns:
            {field_name: tenant_id} nếu không phải SUPER_ADMIN
            {} nếu là SUPER_ADMIN (xem mọi tenant)
        """
        if self.is_super_admin:
            return {}
        if self.tenant_id:
            return {field_name: self.tenant_id}
        return {}
    
    def filter_by_tenant(self, queryset: QuerySet, field_name: str = "tenant") -> QuerySet:
        """
        Filter queryset theo tenant.
        
        Args:
            queryset: QuerySet cần filter
            field_name: Tên trường tenant
            
        Returns:
            QuerySet đã filter
        """
        tenant_filter = self.get_tenant_filter(field_name)
        if tenant_filter:
            return queryset.filter(**tenant_filter)
        return queryset
    
    def validate_tenant_access(self, target_tenant_id: Optional[str]) -> bool:
        """
        Validate quyền truy cập tenant cụ thể.
        
        Args:
            target_tenant_id: Tenant ID muốn truy cập
            
        Returns:
            True nếu được phép
            
        Raises:
            PermissionDenied: Nếu không được phép
        """
        from rest_framework.exceptions import PermissionDenied
        from core.permissions import validate_tenant_access_from_context
        
        if not self.tenant_context:
            raise PermissionDenied("Không lấy được thông tin tenant")
        
        return validate_tenant_access_from_context(
            self.tenant_context, 
            target_tenant_id
        )
