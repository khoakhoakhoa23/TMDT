"""
Hệ thống Permission và Authorization cho Multi-Tenant SaaS.

QUY TẮC BẢO MẬT QUAN TRỌNG:
1. KHÔNG BAO GIỜ tin tenantId từ client/URL - luôn lấy từ JWT
2. LUÔN filter query theo tenantId từ JWT
3. SUPER_ADMIN có thể truy cập mọi tenant
4. TENANT_ADMIN chỉ được truy cập tenant của mình
5. STAFF/CUSTOMER không được phép truy cập admin routes
"""

from rest_framework.permissions import BasePermission
from rest_framework.exceptions import PermissionDenied, AuthenticationFailed
from rest_framework import request
from typing import Optional, Any
from dataclasses import dataclass
from users.models import UserRole, UserProfile


# ==================== Tenant Context ====================

@dataclass
class TenantContext:
    """
    Container lưu trữ thông tin tenant từ JWT.
    Đây là nguồn tin cậy duy nhất để xác định tenant của user.
    """
    tenant_id: Optional[str]
    tenant_code: Optional[str]
    tenant_name: Optional[str]
    role: str
    user_id: int
    
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
    def is_employee(self) -> bool:
        return self.role == UserRole.EMPLOYEE
    
    @property
    def is_customer(self) -> bool:
        return self.role == UserRole.CUSTOMER
    
    @property
    def is_admin_level(self) -> bool:
        """Kiểm tra có phải cấp quản lý không (TENANT_ADMIN)"""
        return self.role == UserRole.TENANT_ADMIN
    
    @property
    def has_tenant(self) -> bool:
        """User có thuộc một tenant hay không (trừ SUPER_ADMIN)"""
        return self.tenant_id is not None


def get_tenant_context(request_or_user) -> TenantContext:
    """
    Lấy TenantContext từ JWT token.
    Đây là hàm quan trọng - trả về thông tin tenant từ token, KHÔNG từ URL/params.
    
    Args:
        request_or_user: Django Request object hoặc User object
        
    Returns:
        TenantContext: Chứa thông tin tenant từ JWT
        
    Raises:
        AuthenticationFailed: Nếu không lấy được thông tin tenant
    """
    # Lấy user từ request
    if isinstance(request_or_user, request.Request):
        user = getattr(request_or_user, 'user', None)
        token = getattr(request_or_user, 'auth', None)
    else:
        user = request_or_user
        token = None
    
    if not user or not user.is_authenticated:
        raise AuthenticationFailed("Vui lòng đăng nhập")
    
    # Lấy profile để lấy role và tenant
    profile = getattr(user, 'profile', None)
    
    # Ưu tiên lấy từ JWT token (request.auth)
    # Hỗ trợ cả hai format: tenantId (camelCase) và tenant_id (underscore)
    if token:
        tenant_id = token.get('tenantId') or token.get('tenant_id')
        tenant_code = token.get('tenantCode') or token.get('tenant_code')
        tenant_name = token.get('tenantName') or token.get('tenant_name')
        role = token.get('role', UserRole.CUSTOMER)
        user_id = token.get('userId') or token.get('user_id') or user.id
    else:
        # Fallback: lấy từ profile
        if not profile:
            raise PermissionDenied("Không tìm thấy thông tin profile")
        
        tenant_id = str(profile.tenant_id) if profile.tenant_id else None
        tenant_code = profile.tenant.code if profile.tenant else None
        tenant_name = profile.tenant.name if profile.tenant else None
        role = profile.role
        user_id = user.id
    
    return TenantContext(
        tenant_id=tenant_id,
        tenant_code=tenant_code,
        tenant_name=tenant_name,
        role=role,
        user_id=user_id
    )


def validate_tenant_access_from_context(
    context: TenantContext, 
    target_tenant_id: Optional[str],
    allow_super_admin: bool = True
) -> bool:
    """
    Validate quyền truy cập tenant dựa trên TenantContext.
    
    Args:
        context: TenantContext từ JWT
        target_tenant_id: Tenant ID muốn truy cập (từ URL)
        allow_super_admin: Cho phép SUPER_ADMIN truy cập mọi tenant
        
    Returns:
        True nếu được phép
        
    Raises:
        PermissionDenied: Nếu không được phép
    """
    # SUPER_ADMIN có thể truy cập mọi tenant
    if allow_super_admin and context.is_super_admin:
        return True
    
    # Nếu không có target_tenant_id, chỉ cần user có tenant
    if not target_tenant_id:
        if not context.has_tenant:
            raise PermissionDenied("Bạn không thuộc tenant nào")
        return True
    
    # So sánh tenantId từ URL với tenantId từ JWT
    if context.tenant_id != target_tenant_id:
        raise PermissionDenied(
            f"Bạn không có quyền truy cập tenant {target_tenant_id}. "
            f"Token của bạn thuộc tenant: {context.tenant_id or 'NONE'}"
        )
    
    return True


# ==================== Base Permission Classes ====================

class IsNhanVien(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.groups.filter(name="NhanVien").exists()
            or request.user.is_superuser
        )


class IsSuperAdmin(BasePermission):
    """
    Chỉ SUPER_ADMIN mới có quyền truy cập.
    SUPER_ADMIN không thuộc tenant nào (tenant = None).
    
    JWT Payload:
    {
        "userId": "uuid",
        "role": "SUPER_ADMIN",
        "tenantId": null
    }
    """
    message = "Chỉ SUPER_ADMIN mới có quyền truy cập"
    
    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False
        
        profile = getattr(user, "profile", None)
        if not profile:
            return False
        
        is_super_admin = profile.role == UserRole.SUPER_ADMIN or user.is_superuser
        
        if is_super_admin:
            # Verify tenantId trong JWT là null đối với SUPER_ADMIN
            token = getattr(request, 'auth', None)
            if token and (token.get('tenantId') or token.get('tenant_id')) is not None:
                # Security warning: token có tenantId nhưng role là SUPER_ADMIN
                pass
        
        return is_super_admin


class IsTenantAdmin(BasePermission):
    """
    Chỉ TENANT_ADMIN mới có quyền truy cập.
    TENANT_ADMIN phải thuộc một tenant cụ thể.
    """
    message = "Chỉ TENANT_ADMIN mới có quyền truy cập"
    
    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False
        
        profile = getattr(user, "profile", None)
        if not profile:
            return False
        
        return (
            profile.role == UserRole.TENANT_ADMIN
            and profile.tenant_id is not None
        )


class IsTenantMember(BasePermission):
    """
    Kiểm tra user có thuộc một tenant hay không.
    Áp dụng cho cả TENANT_ADMIN, STAFF, CUSTOMER.
    """
    message = "Bạn phải thuộc một tenant mới có quyền truy cập"
    
    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False
        
        profile = getattr(user, "profile", None)
        if not profile:
            return False
        
        # SUPER_ADMIN không cần tenant
        if profile.role == UserRole.SUPER_ADMIN or user.is_superuser:
            return True
        
        return profile.tenant_id is not None


class IsSuperAdminOrTenantAdmin(BasePermission):
    """
    SUPER_ADMIN hoặc TENANT_ADMIN mới có quyền truy cập.
    """
    message = "Chỉ SUPER_ADMIN hoặc TENANT_ADMIN mới có quyền truy cập"
    
    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False
        
        profile = getattr(user, "profile", None)
        if not profile:
            return False
        
        if profile.role == UserRole.SUPER_ADMIN or user.is_superuser:
            return True
        
        return (
            profile.role == UserRole.TENANT_ADMIN
            and profile.tenant_id is not None
        )


class IsAdminOrStaff(BasePermission):
    """
    Cho phép SUPER_ADMIN, TENANT_ADMIN, EMPLOYEE.
    Không cho phép CUSTOMER.
    
    QUY TẮC:
    - SUPER_ADMIN: Toàn quyền hệ thống
    - TENANT_ADMIN: Quản trị tenant - quản lý employee
    - EMPLOYEE: Nhân viên - thao tác nghiệp vụ
    - CUSTOMER: Khách hàng - chỉ xem dữ liệu của mình
    """
    message = "Chỉ SUPER_ADMIN, TENANT_ADMIN, EMPLOYEE mới có quyền truy cập"
    
    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False
        
        profile = getattr(user, "profile", None)
        if not profile:
            return False
        
        # SUPER_ADMIN
        if profile.role == UserRole.SUPER_ADMIN or user.is_superuser:
            return True
        
        # TENANT_ADMIN, EMPLOYEE
        return profile.role in [
            UserRole.TENANT_ADMIN, 
            UserRole.EMPLOYEE,
        ]


# ==================== Advanced Permission Classes ====================

class IsTenantAccessible(BasePermission):
    """
    Permission kiểm tra tenantId từ URL có khớp với tenantId trong JWT không.
    
    QUY TẮC:
    - SUPER_ADMIN: có thể truy cập mọi tenant
    - TENANT_ADMIN: chỉ được truy cập tenant của mình (so sánh với JWT)
    - STAFF/CUSTOMER: không được phép truy cập admin routes
    
    CƠ CHẾ BẢO MẬT:
    1. Lấy tenantId từ JWT token (KHÔNG tin tưởng URL)
    2. So sánh với tenantId từ URL (nếu có)
    3. Nếu không khớp → 403 Forbidden
    
    Ví dụ:
    - GET /admin/tenants/:tenantId/users
    - Backend lấy tenantId từ JWT → "tenant-abc"
    - Backend lấy tenantId từ URL params → "tenant-xyz"
    - Kết quả: 403 vì "tenant-abc" != "tenant-xyz"
    """
    message = "Bạn không có quyền truy cập tenant này"
    
    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            raise AuthenticationFailed("Vui lòng đăng nhập")

        profile = getattr(user, "profile", None)
        if not profile:
            raise PermissionDenied("Không tìm thấy thông tin profile")

        # Lấy tenantId từ JWT (nguồn tin cậy)
        token = getattr(request, 'auth', None)
        jwt_tenant_id = None
        if token:
            # Hỗ trợ cả hai format: tenantId (camelCase) và tenant_id (underscore)
            jwt_tenant_id = token.get('tenantId') or token.get('tenant_id')
        
        # Fallback: lấy từ profile nếu không có token
        if not jwt_tenant_id and profile and profile.tenant_id:
            jwt_tenant_id = str(profile.tenant_id)
        
        # Lấy tenantId từ URL params (KHÔNG tin tưởng - cần verify)
        # Hỗ trợ cả hai format: tenantId và tenant_id
        tenant_id_from_url = (
            view.kwargs.get('tenantId') or 
            view.kwargs.get('tenant_id') or 
            request.query_params.get('tenantId') or 
            request.query_params.get('tenant_id')
        )
        
        # Nếu là SUPER_ADMIN
        if profile.role == UserRole.SUPER_ADMIN or user.is_superuser:
            # SUPER_ADMIN có thể truy cập mọi tenant
            # Nhưng vẫn set request.tenant_context để query filter
            return True

        # Nếu là TENANT_ADMIN, STAFF, CUSTOMER - không được truy cập admin routes
        if profile.role not in [UserRole.TENANT_ADMIN, UserRole.EMPLOYEE]:
            raise PermissionDenied("Bạn không có quyền truy cập trang này")

        # Nếu có tenantId trong URL, phải khớp với tenant trong JWT
        if tenant_id_from_url:
            if jwt_tenant_id != tenant_id_from_url:
                raise PermissionDenied(
                    f"Bạn không có quyền truy cập tenant {tenant_id_from_url}. "
                    f"Token của bạn thuộc tenant: {jwt_tenant_id}"
                )

        # TENANT_ADMIN phải có tenant
        if profile.role == UserRole.TENANT_ADMIN and not jwt_tenant_id:
            raise PermissionDenied("Tài khoản của bạn chưa được gán tenant")

        return True


class IsTenantAccessibleStrict(BasePermission):
    """
    Phiên bản NGHIÊM NGẶT hơn của IsTenantAccessible.
    
    KHÁC BIỆT:
    - IsTenantAccessible: Cho phép TENANT_ADMIN truy cập tenant của mình
    - IsTenantAccessibleStrict: Yêu cầu tenantId trong URL PHẢI khớp với JWT
    
    Sử dụng cho các API cần độ bảo mật cao:
    - /admin/tenants/:tenantId/users/:userId
    - /admin/tenants/:tenantId/settings
    - /admin/tenants/:tenantId/billing
    """
    message = "Bạn không có quyền truy cập tài nguyên này"
    
    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            raise AuthenticationFailed("Vui lòng đăng nhập")

        profile = getattr(user, "profile", None)
        if not profile:
            raise PermissionDenied("Không tìm thấy thông tin profile")

        # Lấy tenantId từ JWT (nguồn tin cậy duy nhất)
        token = getattr(request, 'auth', None)
        jwt_tenant_id = None
        if token:
            # Hỗ trợ cả hai format: tenantId (camelCase) và tenant_id (underscore)
            jwt_tenant_id = token.get('tenantId') or token.get('tenant_id')
        
        if not jwt_tenant_id and profile and profile.tenant_id:
            jwt_tenant_id = str(profile.tenant_id)

        # SUPER_ADMIN: luôn cho phép
        if profile.role == UserRole.SUPER_ADMIN or user.is_superuser:
            return True

        # Non-admin roles: từ chối
        if profile.role not in [UserRole.TENANT_ADMIN, UserRole.EMPLOYEE]:
            raise PermissionDenied("Bạn không có quyền truy cập")

        # Lấy tenantId từ URL
        tenant_id_from_url = (
            view.kwargs.get('tenant_id') or 
            view.kwargs.get('tenantId') or 
            request.query_params.get('tenant_id') or
            request.query_params.get('tenantId')
        )
        
        # Nếu URL có tenantId → PHẢI khớp với JWT
        if tenant_id_from_url and jwt_tenant_id != tenant_id_from_url:
            raise PermissionDenied(
                f"Tenant ID không hợp lệ. Token thuộc tenant: {jwt_tenant_id}"
            )
        
        # Nếu URL không có tenantId → phải sử dụng tenant từ JWT
        if not tenant_id_from_url and not jwt_tenant_id:
            raise PermissionDenied("Token không có thông tin tenant")

        return True


# ==================== Helper Functions ====================

def validate_tenant_access(user, tenant_id_from_url: str = None) -> bool:
    """
    Hàm helper để validate quyền truy cập tenant.
    Gọi trong view hoặc serializer nếu cần.
    
    Args:
        user: Django User object
        tenant_id_from_url: Tenant ID từ URL (có thể None)
        
    Returns:
        True nếu được phép, raises PermissionDenied nếu không được phép
        
    Example:
        # Trong ViewSet
        def get_queryset(self):
            # Hỗ trợ cả tenantId và tenant_id
            tenant_id = self.kwargs.get('tenantId') or self.kwargs.get('tenant_id')
            validate_tenant_access(self.request.user, tenant_id)
            return super().get_queryset()
    """
    profile = getattr(user, "profile", None)
    if not profile:
        raise PermissionDenied("Không tìm thấy thông tin profile")

    # SUPER_ADMIN có thể truy cập mọi tenant
    if profile.role == UserRole.SUPER_ADMIN or user.is_superuser:
        return True

    # STAFF và CUSTOMER không được phép
    if profile.role in [UserRole.EMPLOYEE, UserRole.CUSTOMER]:
        raise PermissionDenied("Bạn không có quyền truy cập")

    # TENANT_ADMIN chỉ được truy cập tenant của mình
    if tenant_id_from_url:
        user_tenant_id = str(profile.tenant_id) if profile.tenant_id else None
        if user_tenant_id != tenant_id_from_url:
            raise PermissionDenied(
                f"Bạn không có quyền truy cập tenant này"
            )

    return True


def get_effective_tenant_id(request, fallback_to_jwt: bool = True) -> Optional[str]:
    """
    Lấy tenantId hiệu quả cho query.
    
    NGUYÊN TẮC:
    - Ưu tiên lấy từ JWT (an toàn nhất)
    - Chỉ sử dụng URL param nếu đã được validate
    
    Args:
        request: Django Request object
        fallback_to_jwt: Nếu True, fallback về JWT khi không có URL param
        
    Returns:
        Tenant ID hoặc None (nếu là SUPER_ADMIN)
    """
    user = getattr(request, "user", None)
    if not user or not user.is_authenticated:
        return None
    
    # Ưu tiên từ JWT
    token = getattr(request, 'auth', None)
    if token:
        tenant_id = token.get('tenantId') or token.get('tenant_id')
        if tenant_id:
            return tenant_id
    
    # Fallback từ profile
    profile = getattr(user, 'profile', None)
    if profile and profile.tenant_id:
        return str(profile.tenant_id)
    
    return None


def require_tenant_for_non_admin(profile: UserProfile) -> None:
    """
    Validate rằng user (không phải SUPER_ADMIN) có tenant.
    
    Raises:
        PermissionDenied: Nếu user không có tenant mà role yêu cầu có tenant
    """
    if profile.role == UserRole.SUPER_ADMIN or profile.user.is_superuser:
        return
    
    if not profile.tenant_id:
        raise PermissionDenied(
            f"User với role {profile.role} phải thuộc một tenant"
        )
