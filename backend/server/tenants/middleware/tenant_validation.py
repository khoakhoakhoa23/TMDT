"""
Tenant Validation Middleware

Middleware kiểm tra quyền truy cập tenant.

QUY TẮC BẬC THANG:
1. SUPER_ADMIN: có thể truy cập mọi tenant
2. TENANT_ADMIN: chỉ được truy cập tenant của mình
3. STAFF: được truy cập tenant của mình (với limited permissions)
4. CUSTOMER: không được truy cập admin routes

CƠ CHẾ BẢO MẬT:
- KHÔNG BAO GIỜ tin tenantId từ URL
- LUÔN lấy tenantId từ JWT
- So sánh JWT tenantId với URL tenantId
- Nếu không khớp → 403 Forbidden

Usage:
    # Áp dụng cho view cụ thể
    from rest_framework.views import APIView
    from tenants.middleware.tenant_validation import TenantAccessValidation
    
    class TenantUsersView(APIView):
        permission_classes = [TenantAccessValidation]
        
        def get_queryset(self):
            # Filter theo tenant từ JWT, KHÔNG từ URL
            tenant_id = self.request.tenant_id
            return User.objects.filter(profile__tenant_id=tenant_id)
"""

from typing import Callable, Optional
from django.http import HttpRequest, JsonResponse
from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.views import View
from users.models import UserRole
import logging

logger = logging.getLogger(__name__)


class TenantContext:
    """
    Container lưu trữ thông tin tenant từ JWT.
    """
    def __init__(
        self, 
        tenant_id: Optional[str] = None,
        tenant_code: Optional[str] = None,
        tenant_name: Optional[str] = None,
        role: Optional[str] = None,
        user_id: Optional[int] = None,
    ):
        self.tenant_id = tenant_id
        self.tenant_code = tenant_code
        self.tenant_name = tenant_name
        self.role = role
        self.user_id = user_id
    
    @property
    def is_super_admin(self) -> bool:
        return self.role == UserRole.SUPER_ADMIN
    
    @property
    def is_tenant_admin(self) -> bool:
        return self.role == UserRole.TENANT_ADMIN
    
    @property
    def is_staff(self) -> bool:
        return self.role == UserRole.EMPLOYEE
    
    @property
    def is_customer(self) -> bool:
        return self.role == UserRole.CUSTOMER
    
    @property
    def has_tenant(self) -> bool:
        return self.tenant_id is not None


class TenantContextMiddleware:
    """
    Middleware xây dựng TenantContext từ request.
    
    Gắn request.tenant_context vào request sau khi authentication.
    """
    
    def __init__(self, get_response: Callable):
        self.get_response = get_response
    
    def __call__(self, request: HttpRequest):
        # Build tenant context từ request
        request.tenant_context = self._build_tenant_context(request)
        
        return self.get_response(request)
    
    def _build_tenant_context(self, request: HttpRequest) -> Optional[TenantContext]:
        """Xây dựng TenantContext từ request."""
        user = getattr(request, 'user', None)
        
        if not user or not user.is_authenticated:
            return None
        
        # Lấy từ request đã được gắn bởi authentication middleware
        tenant_id = getattr(request, 'tenant_id', None)
        tenant_code = getattr(request, 'tenant_code', None)
        tenant_name = getattr(request, 'tenant_name', None)
        
        # Lấy role từ profile nếu không có trong JWT
        profile = getattr(user, 'profile', None)
        role = getattr(request, 'tenant_context', {}).get('role') if hasattr(request, 'tenant_context') else None
        
        if not role and profile:
            role = profile.role
        
        return TenantContext(
            tenant_id=tenant_id,
            tenant_code=tenant_code,
            tenant_name=tenant_name,
            role=role,
            user_id=user.id,
        )


class TenantAccessValidation(permissions.BasePermission):
    """
    Permission class kiểm tra quyền truy cập tenant.
    
    QUY TẮC:
    - SUPER_ADMIN: được truy cập mọi tenant
    - TENANT_ADMIN/STAFF: chỉ được truy cập tenant của mình
    - CUSTOMER: không được phép
    
    CƠ CHẾ:
    1. Lấy tenantId từ JWT (request.tenant_id)
    2. Lấy tenantId từ URL params
    3. So sánh - nếu không khớp → 403
    """
    
    # Các HTTP methods được phép
    SAFE_METHODS = ('GET', 'HEAD', 'OPTIONS')
    
    # Chỉ message khi bị từ chối
    message = "Bạn không có quyền truy cập tenant này"
    
    def has_permission(self, request: HttpRequest, view: View) -> bool:
        # Authentication đã được check ở middleware trước đó
        user = getattr(request, 'user', None)
        
        if not user or not user.is_authenticated:
            raise PermissionDenied("Vui lòng đăng nhập")
        
        # Lấy tenant context từ request
        tenant_context = getattr(request, 'tenant_context', None)
        if not tenant_context:
            # Thử lấy từ JWT authentication
            token = getattr(request, 'auth', None)
            if token:
                tenant_id = token.get('tenantId') or token.get('tenant_id')
                role = token.get('role')
                tenant_context = TenantContext(
                    tenant_id=tenant_id,
                    role=role,
                    user_id=user.id,
                )
        
        if not tenant_context:
            raise PermissionDenied("Không tìm thấy thông tin tenant")
        
        # Gắn vào request để view có thể sử dụng
        request.tenant_context = tenant_context
        
        # Lấy tenantId từ URL params (KHÔNG tin tưởng - chỉ để validate)
        url_tenant_id = self._get_tenant_from_url(view)
        
        # SUPER_ADMIN: được phép truy cập mọi tenant
        if tenant_context.is_super_admin:
            return True
        
        # CUSTOMER: không được phép truy cập
        if tenant_context.is_customer:
            raise PermissionDenied("Bạn không có quyền truy cập trang này")
        
        # TENANT_ADMIN/STAFF: phải truy cập đúng tenant của mình
        if url_tenant_id:
            if tenant_context.tenant_id != url_tenant_id:
                logger.warning(
                    f"Cross-tenant access blocked! "
                    f"User {user.id} (tenant: {tenant_context.tenant_id}) "
                    f"tried to access tenant {url_tenant_id}"
                )
                raise PermissionDenied(
                    f"Bạn không có quyền truy cập tenant {url_tenant_id}. "
                    f"Bạn thuộc tenant: {tenant_context.tenant_id}"
                )
        
        # Nếu là TENANT_ADMIN/STAFF mà không có tenant → lỗi
        if tenant_context.is_tenant_admin and not tenant_context.tenant_id:
            raise PermissionDenied("Tài khoản của bạn chưa được gán tenant")
        
        return True
    
    def _get_tenant_from_url(self, view: View) -> Optional[str]:
        """Lấy tenantId từ URL params."""
        # Thử từ view kwargs
        kwargs = getattr(view, 'kwargs', {})
        
        tenant_id = (
            kwargs.get('tenantId') or 
            kwargs.get('tenant_id') or
            kwargs.get('tenant_id')
        )
        
        return tenant_id


def check_tenant_access(
    request: HttpRequest, 
    target_tenant_id: Optional[str] = None,
    allowed_roles: Optional[list] = None
) -> TenantContext:
    """
    Hàm helper kiểm tra quyền truy cập tenant.
    
    Args:
        request: Django request object
        target_tenant_id: Tenant ID muốn truy cập (từ URL)
        allowed_roles: Danh sách roles được phép
        
    Returns:
        TenantContext nếu được phép
        
    Raises:
        PermissionDenied nếu không được phép
    """
    user = getattr(request, 'user', None)
    
    if not user or not user.is_authenticated:
        raise PermissionDenied("Vui lòng đăng nhập")
    
    # Lấy tenant context
    tenant_context = getattr(request, 'tenant_context', None)
    if not tenant_context:
        token = getattr(request, 'auth', None)
        if token:
            tenant_id = token.get('tenantId') or token.get('tenant_id')
            role = token.get('role')
            tenant_context = TenantContext(
                tenant_id=tenant_id,
                role=role,
                user_id=user.id,
            )
    
    if not tenant_context:
        raise PermissionDenied("Không tìm thấy thông tin tenant")
    
    # Check role permissions
    if allowed_roles and tenant_context.role not in allowed_roles:
        if tenant_context.is_super_admin:
            pass  # SUPER_ADMIN always allowed
        else:
            raise PermissionDenied(
                f"Role {tenant_context.role} không được phép truy cập"
            )
    
    # Check tenant access
    if tenant_context.is_super_admin:
        return tenant_context
    
    if target_tenant_id and tenant_context.tenant_id != target_tenant_id:
        raise PermissionDenied(
            f"Bạn không có quyền truy cập tenant {target_tenant_id}"
        )
    
    return tenant_context


def require_tenant(view_func: Callable) -> Callable:
    """
    Decorator yêu cầu user phải thuộc một tenant.
    
    Usage:
        @require_tenant
        def my_view(request):
            tenant_id = request.tenant_context.tenant_id
            ...
    """
    def wrapped(request: HttpRequest, *args, **kwargs):
        user = getattr(request, 'user', None)
        
        if not user or not user.is_authenticated:
            raise PermissionDenied("Vui lòng đăng nhập")
        
        tenant_context = getattr(request, 'tenant_context', None)
        
        if not tenant_context:
            raise PermissionDenied("Không tìm thấy thông tin tenant")
        
        if tenant_context.is_super_admin:
            return view_func(request, *args, **kwargs)
        
        if not tenant_context.tenant_id:
            raise PermissionDenied("Bạn không thuộc tenant nào")
        
        return view_func(request, *args, **kwargs)
    
    return wrapped


def get_tenant_from_request(request: HttpRequest) -> Optional[str]:
    """
    Lấy tenant_id từ request (nguồn tin cậy).
    
    Returns:
        Tenant ID hoặc None (nếu là SUPER_ADMIN)
    """
    tenant_context = getattr(request, 'tenant_context', None)
    
    if tenant_context:
        return tenant_context.tenant_id
    
    # Fallback
    return getattr(request, 'tenant_id', None)


def get_effective_tenant_id(request: HttpRequest, url_tenant_id: Optional[str] = None) -> Optional[str]:
    """
    Lấy tenant_id hiệu quả cho query.
    
    NGUYÊN TẮC:
    - Ưu tiên từ JWT (an toàn nhất)
    - Chỉ sử dụng URL param nếu đã validate
    
    Args:
        request: Django request
        url_tenant_id: Tenant ID từ URL (đã validate)
        
    Returns:
        Tenant ID để query database
    """
    jwt_tenant_id = get_tenant_from_request(request)
    
    if jwt_tenant_id:
        return jwt_tenant_id
    
    # Nếu là SUPER_ADMIN và có URL tenant_id → cho phép query
    user = getattr(request, 'user', None)
    if user and user.is_authenticated:
        profile = getattr(user, 'profile', None)
        if profile and profile.role == UserRole.SUPER_ADMIN:
            return url_tenant_id
    
    return None
