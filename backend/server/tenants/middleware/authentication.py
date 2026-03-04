"""
JWT Authentication Middleware

Middleware xác thực JWT token và gắn thông tin user vào request.

QUY TẮC BẢO MẬT:
1. Token phải hợp lệ và chưa hết hạn
2. User phải tồn tại và chưa bị xóa
3. User profile phải tồn tại

Usage:
    # Trong settings.py
    MIDDLEWARE = [
        ...
        'tenants.middleware.authentication.JWTAuthenticationMiddleware',
        ...
    ]
    
    # Hoặc sử dụng decorator
    from tenants.middleware.authentication import jwt_required
    
    @jwt_required
    def my_view(request):
        ...
"""

from typing import Callable, Optional
from django.http import HttpRequest, JsonResponse
from rest_framework import authentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from users.models import User, UserProfile
import logging

logger = logging.getLogger(__name__)


class JWTAuthenticationMiddleware:
    """
    Middleware xác thực JWT token.
    
    Gắn các thuộc tính vào request:
    - request.user: User object
    - request.tenant_id: Tenant ID từ JWT
    - request.tenant_context: TenantContext object
    
    Skip middleware cho:
    - Public endpoints (login, register, health check)
    - Static files
    - Admin URLs (nếu sử dụng Django admin)
    """
    
    # Các paths không cần authentication
    EXEMPT_URLS = [
        '/api/auth/login',
        '/api/auth/register',
        '/api/auth/refresh',
        '/api/auth/reset-password',
        '/api/auth/forgot-password',
        '/api/health',
        '/admin/login',
        '/static/',
        '/media/',
    ]
    
    def __init__(self, get_response: Callable):
        self.get_response = get_response
        self.jwt_authenticator = JWTAuthentication()
    
    def __call__(self, request: HttpRequest):
        # Skip authentication cho exempt URLs
        if self._is_exempt_url(request.path):
            return self.get_response(request)
        
        # Try to authenticate
        user = None
        token = None
        
        try:
            result = self.jwt_authenticator.authenticate(request)
            if result:
                user, token = result
                request.user = user
                request.auth = token
                
                # Gắn thông tin tenant vào request
                self._attach_tenant_context(request, token)
                
        except (InvalidToken, TokenError) as e:
            logger.warning(f"Invalid token: {str(e)}")
            # Không block request, để permission classes handle
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}")
        
        return self.get_response(request)
    
    def _is_exempt_url(self, path: str) -> bool:
        """Kiểm tra URL có được miễn authentication không."""
        for exempt_url in self.EXEMPT_URLS:
            if path.startswith(exempt_url):
                return True
        return False
    
    def _attach_tenant_context(self, request: HttpRequest, token) -> None:
        """
        Gắn tenant context vào request từ JWT token.
        
        Đây là nguồn tin cậy duy nhất để xác định tenant của user.
        """
        # Lấy tenant từ JWT (ưu tiên hơn từ profile)
        tenant_id = token.get('tenantId') or token.get('tenant_id')
        tenant_code = token.get('tenantCode') or token.get('tenant_code')
        tenant_name = token.get('tenantName') or token.get('tenant_name')
        role = token.get('role')
        
        # Fallback: lấy từ profile nếu không có trong token
        profile = getattr(request.user, 'profile', None)
        if profile:
            if not tenant_id:
                tenant_id = str(profile.tenant_id) if profile.tenant_id else None
            if not tenant_code and profile.tenant:
                tenant_code = profile.tenant.code
            if not tenant_name and profile.tenant:
                tenant_name = profile.tenant.name
            if not role:
                role = profile.role
        
        # Gắn vào request
        request.tenant_id = tenant_id
        request.tenant_code = tenant_code
        request.tenant_name = tenant_name
        request.tenant_context = {
            'tenant_id': tenant_id,
            'tenant_code': tenant_code,
            'tenant_name': tenant_name,
            'role': role,
            'user_id': request.user.id,
        }


def jwt_required(view_func: Callable) -> Callable:
    """
    Decorator yêu cầu JWT authentication.
    
    Usage:
        @jwt_required
        def my_view(request):
            ...
    """
    def wrapped(request: HttpRequest, *args, **kwargs):
        if not hasattr(request, 'user') or not request.user:
            raise AuthenticationFailed("Vui lòng đăng nhập")
        
        if not request.user.is_authenticated:
            raise AuthenticationFailed("Token không hợp lệ")
        
        return view_func(request, *args, **kwargs)
    
    return wrapped


def get_user_from_request(request: HttpRequest) -> Optional[User]:
    """
    Lấy user từ request.
    
    Returns:
        User object hoặc None nếu không authenticated
    """
    user = getattr(request, 'user', None)
    if user and user.is_authenticated:
        return user
    return None


def get_tenant_from_request(request: HttpRequest) -> Optional[str]:
    """
    Lấy tenant_id từ request.
    
    Returns:
        Tenant ID hoặc None nếu là SUPER_ADMIN hoặc không có
    """
    return getattr(request, 'tenant_id', None)
