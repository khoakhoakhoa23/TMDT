"""
Tenant Users API - Ví dụ API users theo tenant

API endpoint: GET /api/tenant/:tenantId/users

QUY TẮC BẢO MẬT:
1. JWT authentication bắt buộc
2. TenantId từ URL phải khớp với JWT
3. Query filter theo tenantId từ JWT (KHÔNG từ URL)

Example:
    # Request
    GET /api/tenant/abc-123/users
    Authorization: Bearer <jwt_token>
    
    # Response
    {
        "count": 10,
        "results": [
            {
                "id": 1,
                "username": "john",
                "email": "john@example.com",
                "role": "TENANT_ADMIN",
                "tenant_id": "abc-123"
            }
        ]
    }
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import QuerySet

from users.models import User, UserProfile, UserRole
from users.serializers import UserSerializer
from core.permissions import (
    IsSuperAdmin, 
    IsTenantAccessible, 
    IsAdminOrStaff,
    get_tenant_context,
)
from tenants.scoping import apply_tenant_filter, get_tenant_from_request


class TenantUserViewSet(viewsets.ModelViewSet):
    """
    ViewSet quản lý users trong một tenant.
    
    Endpoints:
    - GET /api/tenant/:tenantId/users - List all users
    - POST /api/tenant/:tenantId/users - Create user
    - GET /api/tenant/:tenantId/users/:id - Get user detail
    - PUT /api/tenant/:tenantId/users/:id - Update user
    - DELETE /api/tenant/:tenantId/users/:id - Delete user
    
    QUY TẮC:
    - TENANT_ADMIN/STAFF: chỉ truy cập users trong tenant của mình
    - Query được filter theo tenantId từ JWT
    """
    
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminOrStaff]
    
    def get_queryset(self) -> QuerySet:
        """
        Lấy queryset users - LUÔN filter theo tenant từ JWT.
        
        QUAN TRỌNG: Không sử dụng tenantId từ URL để query.
        """
        # Lấy tenantId từ JWT (nguồn tin cậy)
        jwt_tenant_id = get_tenant_from_request(self.request)
        
        # Lấy user
        user = self.request.user
        profile = getattr(user, 'profile', None)
        
        # SUPER_ADMIN: có thể xem mọi tenant (nếu có X-Tenant header)
        if profile and profile.role == UserRole.SUPER_ADMIN:
            # Sử dụng apply_tenant_filter để hỗ trợ X-Tenant header
            return apply_tenant_filter(
                User.objects.select_related('profile', 'profile__tenant').all(),
                self.request
            )
        
        # TENANT_ADMIN/STAFF: bắt buộc filter theo JWT tenantId
        if jwt_tenant_id:
            return User.objects.select_related('profile', 'profile__tenant').filter(
                profile__tenant_id=jwt_tenant_id,
                profile__deleted_at__isnull=True
            )
        
        # Không có tenant → empty queryset
        return User.objects.none()
    
    def retrieve(self, request, *args, **kwargs):
        """
        GET /api/tenant/:tenantId/users/:id
        
        Validate tenant access trước khi trả về user.
        """
        # Permission class đã validate ở đây
        return super().retrieve(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        """
        Tạo user mới trong tenant của người tạo.
        """
        # Lấy tenant từ JWT (KHÔNG từ URL)
        jwt_tenant_id = get_tenant_from_request(self.request)
        
        if not jwt_tenant_id:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Không xác định được tenant")
        
        # Lưu user với tenant
        user = serializer.save()
        
        # Tạo hoặc cập nhật profile
        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.tenant_id = jwt_tenant_id
        profile.save()
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """
        POST /api/tenant/:tenantId/users/:id/deactivate
        
        Deactivate user (soft delete).
        """
        user = self.get_object()
        
        # Soft delete
        profile = getattr(user, 'profile', None)
        if profile:
            from django.utils import timezone
            profile.deleted_at = timezone.now()
            profile.status = UserStatus.INACTIVE
            profile.save()
        
        return Response({"detail": "User đã bị vô hiệu hóa"})
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """
        POST /api/tenant/:tenantId/users/:id/activate
        
        Activate user.
        """
        user = self.get_object()
        
        profile = getattr(user, 'profile', None)
        if profile:
            profile.deleted_at = None
            profile.status = UserStatus.ACTIVE
            profile.save()
        
        return Response({"detail": "User đã được kích hoạt"})


class TenantUserListAPIView(APIView):
    """
    APIView đơn giản cho tenant user list.
    
    GET /api/tenant/:tenantId/users
    
    Ví dụ cách sử dụng tenant scoping:
    """
    
    permission_classes = [IsAuthenticated, IsAdminOrStaff]
    
    def get(self, request, tenantId):
        """
        Lấy danh sách users trong tenant.
        
        Query params:
        - page: Số trang
        - page_size: Số items per page
        - search: Tìm kiếm theo username/email
        - role: Lọc theo role
        """
        # Bước 1: Validate tenant access
        # Permission class IsAdminOrStaff đã làm điều này
        
        # Bước 2: Lấy tenantId từ JWT (KHÔNG từ URL)
        jwt_tenant_id = get_tenant_from_request(request)
        
        # Bước 3: Validate tenant access (nếu URL tenantId != JWT tenantId)
        user = request.user
        profile = getattr(user, 'profile', None)
        
        # Nếu là SUPER_ADMIN → cho phép
        if profile and profile.role == UserRole.SUPER_ADMIN:
            # SUPER_ADMIN có thể xem mọi tenant
            queryset = User.objects.select_related('profile', 'profile__tenant')
            if jwt_tenant_id:
                queryset = queryset.filter(profile__tenant_id=jwt_tenant_id)
        else:
            # Non-SUPER_ADMIN: phải truy cập đúng tenant
            if jwt_tenant_id != tenantId:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied(
                    f"Bạn không có quyền truy cập tenant {tenantId}"
                )
            
            # Bước 4: Query với tenantId từ JWT
            queryset = User.objects.select_related('profile', 'profile__tenant').filter(
                profile__tenant_id=jwt_tenant_id,
                profile__deleted_at__isnull=True
            )
        
        # Optional: Search filter
        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                models.Q(username__icontains=search) |
                models.Q(email__icontains=search)
            )
        
        # Optional: Role filter
        role = request.query_params.get('role')
        if role:
            queryset = queryset.filter(profile__role=role)
        
        # Pagination
        from rest_framework.pagination import PageNumberPagination
        paginator = PageNumberPagination()
        paginator.page_size = request.query_params.get('page_size', 20)
        
        page = paginator.paginate_queryset(queryset, request)
        serializer = UserSerializer(page, many=True)
        
        return paginator.get_paginated_response(serializer.data)


class TenantStatsAPIView(APIView):
    """
    API lấy thống kê users trong tenant.
    
    GET /api/tenant/:tenantId/users/stats
    """
    
    permission_classes = [IsAuthenticated, IsAdminOrStaff]
    
    def get(self, request, tenantId):
        """Lấy thống kê users."""
        # Lấy tenantId từ JWT
        jwt_tenant_id = get_tenant_from_request(request)
        
        user = request.user
        profile = getattr(user, 'profile', None)
        
        # Validate
        if profile and profile.role != UserRole.SUPER_ADMIN:
            if jwt_tenant_id != tenantId:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Không có quyền truy cập")
            
            tenant_id = jwt_tenant_id
        else:
            tenant_id = tenantId
        
        # Stats
        from django.db import models
        
        total_users = User.objects.filter(
            profile__tenant_id=tenant_id,
            profile__deleted_at__isnull=True
        ).count()
        
        by_role = User.objects.filter(
            profile__tenant_id=tenant_id,
            profile__deleted_at__isnull=True
        ).values('profile__role').annotate(count=models.Count('id'))
        
        by_status = User.objects.filter(
            profile__tenant_id=tenant_id
        ).values('profile__status').annotate(count=models.Count('id'))
        
        return Response({
            'total': total_users,
            'by_role': {item['profile__role']: item['count'] for item in by_role},
            'by_status': {item['profile__status']: item['count'] for item in by_status},
        })


class MyTenantAPIView(APIView):
    """
    API để TENANT_ADMIN xem và cập nhật thông tin tenant của mình.
    
    Endpoints:
    - GET /api/tenant/me/ - Lấy thông tin tenant hiện tại
    - PATCH /api/tenant/me/ - Cập nhật thông tin tenant
    
    QUY TẮC:
    - TENANT_ADMIN: có thể xem và cập nhật tenant của mình
    - STAFF: chỉ có thể xem, không cập nhật
    """
    permission_classes = [IsAuthenticated, IsAdminOrStaff]
    
    def get(self, request):
        """Lấy thông tin tenant hiện tại."""
        from users.models import UserProfile, UserRole
        from tenants.models import Tenant
        
        profile = getattr(request.user, 'profile', None)
        
        if not profile or not profile.tenant_id:
            return Response(
                {"detail": "Bạn không thuộc tenant nào"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Lấy tenant
        try:
            tenant = Tenant.objects.get(id=profile.tenant_id)
        except Tenant.DoesNotExist:
            return Response(
                {"detail": "Tenant không tồn tại"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        from .serializers import TenantSerializer
        serializer = TenantSerializer(tenant)
        return Response(serializer.data)
    
    def patch(self, request):
        """Cập nhật thông tin tenant hiện tại."""
        from users.models import UserProfile, UserRole
        from tenants.models import Tenant
        
        profile = getattr(request.user, 'profile', None)
        
        # Chỉ TENANT_ADMIN mới được cập nhật
        if not profile or not profile.tenant_id:
            return Response(
                {"detail": "Bạn không thuộc tenant nào"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if profile.role != UserRole.TENANT_ADMIN:
            return Response(
                {"detail": "Chỉ TENANT_ADMIN mới có quyền cập nhật thông tin tenant"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Lấy tenant
        try:
            tenant = Tenant.objects.get(id=profile.tenant_id)
        except Tenant.DoesNotExist:
            return Response(
                {"detail": "Tenant không tồn tại"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        from .serializers import TenantSerializer
        serializer = TenantSerializer(tenant, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
