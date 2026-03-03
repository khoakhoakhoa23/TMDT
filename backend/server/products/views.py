from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser, AllowAny, IsAuthenticated
from django.shortcuts import get_object_or_404
import logging

from products.models import Location, LoaiXe, Xe, Review, CarImage, BlogPost, Wishlist
from core.permissions import IsSuperAdminOrTenantAdmin
from tenants.scoping import apply_tenant_filter, get_current_tenant
from products.serializers import (
    LocationSerializer, LoaiXeSerializer, XeSerializer,
    ReviewSerializer, ReviewCreateSerializer,
    CarImageSerializer, CarImageCreateSerializer,
    BlogPostSerializer, WishlistSerializer, WishlistCreateSerializer
)


# ==================== Location ViewSet ====================

class LocationViewSet(viewsets.ModelViewSet):
    """ViewSet cho Location"""
    queryset = Location.objects.filter(trang_thai=True).order_by('ten_dia_diem')
    serializer_class = LocationSerializer
    
    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        elif self.action == "create":
            # Cho phép user đã đăng nhập tạo địa điểm mới
            return [IsAuthenticated()]
        # Chỉ admin mới có thể update/delete
        return [IsSuperAdminOrTenantAdmin()]

    def get_queryset(self):
        qs = Location.objects.filter(trang_thai=True).order_by("ten_dia_diem")
        return apply_tenant_filter(qs, self.request)

    def perform_create(self, serializer):
        serializer.save(tenant=get_current_tenant(self.request))


# ==================== LoaiXe ViewSet ====================

class LoaiXeViewSet(viewsets.ModelViewSet):
    """ViewSet cho LoaiXe"""
    queryset = LoaiXe.objects.all().order_by('ma_loai', 'ten_loai')
    serializer_class = LoaiXeSerializer
    
    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        return [IsSuperAdminOrTenantAdmin()]
    
    def get_queryset(self):
        # Đảm bảo có ordering để tránh cảnh báo pagination
        qs = LoaiXe.objects.all().order_by('ma_loai', 'ten_loai')
        return apply_tenant_filter(qs, self.request)

    def perform_create(self, serializer):
        serializer.save(tenant=get_current_tenant(self.request))


# ==================== Xe ViewSet ====================

class XeViewSet(viewsets.ModelViewSet):
    """ViewSet cho Xe với advanced search và filters"""
    queryset = Xe.objects.select_related("loai_xe").order_by('ma_xe', 'ten_xe')
    serializer_class = XeSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["ten_xe", "mau_sac", "loai_xe__ten_loai", "seo_keywords", "mo_ta_ngan", "mo_ta"]
    ordering_fields = ["gia", "gia_thue", "so_luong", "ten_xe", "ma_xe"]
    ordering = ["ma_xe"]  # Default ordering - sử dụng ma_xe thay vì created_at

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        return [IsSuperAdminOrTenantAdmin()]

    def get_serializer_context(self):
        """Truyền request vào serializer để build absolute URI cho image"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def create(self, request, *args, **kwargs):
        """Override create để log dữ liệu nhận được và xử lý lỗi tốt hơn"""
        logger = logging.getLogger(__name__)
        logger.info(f"Creating Xe with data: {dict(request.data)}")
        
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            logger.error(f"Error creating Xe: {str(e)}")
            logger.error(f"Error type: {type(e).__name__}")
            logger.error(f"Request data: {dict(request.data)}")
            
            # Nếu là validation error, trả về chi tiết
            if hasattr(e, 'detail'):
                logger.error(f"Validation errors: {e.detail}")
            elif hasattr(e, 'get_full_details'):
                logger.error(f"Validation errors: {e.get_full_details()}")
            
            raise

    def get_queryset(self):
        """Advanced filtering với nhiều tiêu chí"""
        from django.db.models import Q
        
        qs = Xe.objects.select_related("loai_xe")
        
        # Price filters
        min_price = self.request.query_params.get("min_price")
        max_price = self.request.query_params.get("max_price")
        if min_price:
            try:
                qs = qs.filter(gia__gte=int(min_price))
            except ValueError:
                pass
        if max_price:
            try:
                qs = qs.filter(gia__lte=int(max_price))
            except ValueError:
                pass
        
        # Rental price filters
        gia_thue_min = self.request.query_params.get("gia_thue_min")
        gia_thue_max = self.request.query_params.get("gia_thue_max")
        if gia_thue_min:
            try:
                qs = qs.filter(gia_thue__gte=int(gia_thue_min))
            except ValueError:
                pass
        if gia_thue_max:
            try:
                qs = qs.filter(gia_thue__lte=int(gia_thue_max))
            except ValueError:
                pass
        
        # Category filter
        loai = self.request.query_params.get("loai")
        if loai:
            qs = qs.filter(loai_xe__ma_loai=loai)
        
        # Status filter
        status = self.request.query_params.get("status")
        if status:
            qs = qs.filter(trang_thai=status)
        
        # Stock filter
        in_stock = self.request.query_params.get("in_stock")
        if in_stock and in_stock.lower() == "true":
            qs = qs.filter(so_luong__gt=0, trang_thai="in_stock")
        
        # Color filter
        color = self.request.query_params.get("color")
        if color:
            qs = qs.filter(mau_sac__icontains=color)
        
        # Fuel type filter
        fuel_type = self.request.query_params.get("fuel_type")
        if fuel_type:
            qs = qs.filter(loai_nhien_lieu=fuel_type)
        
        # Transmission filter
        transmission = self.request.query_params.get("transmission")
        if transmission:
            qs = qs.filter(hop_so=transmission)
        
        # Seats filter
        min_seats = self.request.query_params.get("min_seats")
        max_seats = self.request.query_params.get("max_seats")
        if min_seats:
            try:
                qs = qs.filter(so_cho__gte=int(min_seats))
            except ValueError:
                pass
        if max_seats:
            try:
                qs = qs.filter(so_cho__lte=int(max_seats))
            except ValueError:
                pass
        
        # Full-text search với PostgreSQL (nếu có)
        search_query = self.request.query_params.get("search")
        if search_query:
            # Sử dụng Q objects để search nhiều fields
            qs = qs.filter(
                Q(ten_xe__icontains=search_query) |
                Q(mau_sac__icontains=search_query) |
                Q(loai_xe__ten_loai__icontains=search_query) |
                Q(seo_keywords__icontains=search_query) |
                Q(mo_ta_ngan__icontains=search_query) |
                Q(mo_ta__icontains=search_query)
            )
        
        # Ordering được xử lý bởi OrderingFilter
        return apply_tenant_filter(qs, self.request)
    
    @action(detail=False, methods=["get"], url_path="search-suggestions")
    def search_suggestions(self, request):
        """API trả về search suggestions/autocomplete"""
        query = request.query_params.get("q", "").strip()
        
        if not query or len(query) < 2:
            return Response({"suggestions": []})
        
        # Lấy suggestions từ tên xe và loại xe
        from django.db.models import Q
        
        cars = apply_tenant_filter(Xe.objects.all(), request).filter(
            Q(ten_xe__icontains=query) | Q(loai_xe__ten_loai__icontains=query)
        ).select_related("loai_xe")[:10]
        
        suggestions = []
        seen = set()
        
        for car in cars:
            # Thêm tên xe
            if car.ten_xe.lower() not in seen:
                suggestions.append({
                    "type": "car",
                    "text": car.ten_xe,
                    "value": car.ten_xe,
                    "id": car.ma_xe
                })
                seen.add(car.ten_xe.lower())
            
            # Thêm loại xe
            if car.loai_xe.ten_loai.lower() not in seen:
                suggestions.append({
                    "type": "category",
                    "text": car.loai_xe.ten_loai,
                    "value": car.loai_xe.ten_loai,
                    "id": car.loai_xe.ma_loai
                })
                seen.add(car.loai_xe.ten_loai.lower())
        
        return Response({"suggestions": suggestions[:10]})


# ==================== Review ViewSet ====================

class ReviewViewSet(viewsets.ModelViewSet):
    """ViewSet cho Review"""
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [AllowAny]  # Cho phép xem reviews, nhưng chỉ authenticated user mới tạo được
    
    def get_permissions(self):
        """Chỉ authenticated user mới có thể tạo, cập nhật, xóa review"""
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAuthenticated()]
        return [AllowAny()]
    
    def get_queryset(self):
        """Filter reviews theo xe nếu có xe_id trong query params"""
        queryset = Review.objects.select_related("user", "xe").all()
        queryset = apply_tenant_filter(queryset, self.request)
        xe_id = self.request.query_params.get("xe_id")
        if xe_id:
            queryset = queryset.filter(xe_id=xe_id)
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Tạo review mới"""
        serializer = ReviewCreateSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            xe = serializer.validated_data["xe"]
            
            # Kiểm tra xem user đã đánh giá xe này chưa
            existing_review = Review.objects.filter(xe=xe, user=request.user).first()
            if existing_review:
                return Response(
                    {"detail": "Bạn đã đánh giá xe này rồi. Bạn có thể cập nhật đánh giá của mình."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            review = Review.objects.create(
                tenant=get_current_tenant(request),
                xe=xe,
                user=request.user,
                rating=serializer.validated_data["rating"],
                comment=serializer.validated_data["comment"]
            )
            
            # Tạo notification cho admin/staff về review mới (nếu có)
            try:
                from core.notifications import create_notification
                from core.consumers import send_notification
                from django.contrib.auth import get_user_model
                User = get_user_model()
                tenant = get_current_tenant(request)
                staff_users = User.objects.filter(is_superuser=True)
                if tenant:
                    staff_users = staff_users | User.objects.filter(profile__tenant=tenant, profile__role="tenant_admin")
                title = "Review mới"
                message = f"Người dùng {request.user.username} vừa tạo review cho xe {xe.ten_xe}"
                for staff in staff_users:
                    notif = create_notification(user=staff, type="new_review", title=title, message=message, order=None)
                    try:
                        send_notification(staff.id, {
                            "id": notif.id,
                            "type": "new_review",
                            "title": title,
                            "message": message,
                            "created_at": notif.created_at.isoformat() if hasattr(notif, "created_at") else None,
                        })
                    except Exception:
                        # Best-effort: continue without failing review creation
                        pass
            except Exception:
                # Don't block review creation if notifications fail
                pass

            return Response(
                ReviewSerializer(review, context={"request": request}).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def update(self, request, *args, **kwargs):
        """Chỉ cho phép user cập nhật review của chính mình"""
        review = self.get_object()
        if review.user != request.user:
            return Response(
                {"detail": "Bạn không có quyền cập nhật đánh giá này."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Chỉ cho phép user xóa review của chính mình"""
        review = self.get_object()
        if review.user != request.user:
            return Response(
                {"detail": "Bạn không có quyền xóa đánh giá này."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=False, methods=["get"])
    def by_car(self, request):
        """Lấy tất cả reviews của một xe cụ thể"""
        xe_id = request.query_params.get("xe_id")
        if not xe_id:
            return Response(
                {"detail": "Vui lòng cung cấp xe_id"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reviews = Review.objects.filter(xe_id=xe_id).select_related("user")
        serializer = self.get_serializer(reviews, many=True)
        return Response(serializer.data)


# ==================== CarImage ViewSet ====================

class CarImageViewSet(viewsets.ModelViewSet):
    """ViewSet cho CarImage"""
    queryset = CarImage.objects.all()
    serializer_class = CarImageSerializer
    permission_classes = [AllowAny]  # Cho phép xem ảnh, nhưng chỉ admin/user mới upload được
    
    def get_permissions(self):
        """Chỉ authenticated user mới có thể tạo, cập nhật, xóa ảnh"""
        if self.action in ["create", "update", "partial_update", "destroy", "bulk_upload"]:
            return [IsAuthenticated()]
        return [AllowAny()]
    
    def get_queryset(self):
        """Filter images theo xe nếu có xe_id trong query params"""
        queryset = CarImage.objects.select_related("xe").all()
        queryset = apply_tenant_filter(queryset, self.request)
        xe_id = self.request.query_params.get("xe_id")
        if xe_id:
            queryset = queryset.filter(xe_id=xe_id)
        return queryset
    
    def get_serializer_class(self):
        """Sử dụng serializer khác cho create"""
        if self.action == "create":
            return CarImageCreateSerializer
        return CarImageSerializer
    
    def get_serializer_context(self):
        """Truyền request vào serializer để build absolute URI"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    @action(detail=False, methods=["post"], url_path="bulk-upload")
    def bulk_upload(self, request):
        """Upload nhiều ảnh cùng lúc"""
        xe_id = request.data.get("xe_id")
        if not xe_id:
            return Response(
                {"detail": "Vui lòng cung cấp xe_id"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        xe = get_object_or_404(apply_tenant_filter(Xe.objects.all(), request), pk=xe_id)
        images = request.FILES.getlist("images")  # Lấy danh sách files
        
        if not images:
            return Response(
                {"detail": "Vui lòng chọn ít nhất một ảnh"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        created_images = []
        tenant = get_current_tenant(request)
        for idx, image in enumerate(images):
            car_image = CarImage.objects.create(
                tenant=tenant,
                xe=xe,
                image=image,
                order=idx,
                is_primary=(idx == 0)  # Ảnh đầu tiên là primary
            )
            # Tự động tạo image_url
            if request:
                car_image.image_url = request.build_absolute_uri(car_image.image.url)
                car_image.save()
            created_images.append(car_image)
        
        serializer = self.get_serializer(created_images, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=["post"], url_path="set-primary")
    def set_primary(self, request, pk=None):
        """Đặt ảnh này làm ảnh chính"""
        car_image = self.get_object()
        car_image.is_primary = True
        car_image.save()
        return Response(
            {"detail": "Đã đặt làm ảnh chính"},
            status=status.HTTP_200_OK
        )


# ==================== BlogPost ViewSet ====================

class BlogPostViewSet(viewsets.ModelViewSet):
    """ViewSet cho BlogPost"""
    queryset = BlogPost.objects.all().order_by("-published_at")
    serializer_class = BlogPostSerializer
    
    def get_queryset(self):
        qs = BlogPost.objects.all().order_by("-published_at")
        return apply_tenant_filter(qs, self.request)

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        return [IsSuperAdminOrTenantAdmin()]

    def perform_create(self, serializer):
        serializer.save(tenant=get_current_tenant(self.request))


# ==================== Wishlist ViewSet ====================

class WishlistViewSet(viewsets.ModelViewSet):
    """ViewSet cho Wishlist"""
    queryset = Wishlist.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        """Sử dụng serializer khác cho create"""
        if self.action == "create":
            return WishlistCreateSerializer
        return WishlistSerializer
    
    def get_queryset(self):
        """Chỉ trả về wishlist của user hiện tại"""
        qs = Wishlist.objects.filter(user=self.request.user).select_related("xe", "xe__loai_xe").prefetch_related("xe__car_images")
        return apply_tenant_filter(qs, self.request)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, tenant=get_current_tenant(self.request))
    
    def get_serializer_context(self):
        """Truyền request vào serializer để build absolute URI cho image"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def create(self, request, *args, **kwargs):
        """Override create để serialize response đúng cách"""
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            
            # Serialize lại với WishlistSerializer để có đầy đủ thông tin car
            instance = serializer.instance
            response_serializer = WishlistSerializer(instance, context={'request': request})
            headers = self.get_success_headers(response_serializer.data)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            logger = logging.getLogger(__name__)
            logger.error(f"Error creating wishlist item: {str(e)}")
            logger.error(f"Error type: {type(e).__name__}")
            logger.error(f"Request data: {dict(request.data)}")
            raise
    
    @action(detail=False, methods=["get"], url_path="check")
    def check(self, request):
        """Kiểm tra xe có trong wishlist không"""
        car_id = request.query_params.get("car_id")
        if not car_id:
            return Response(
                {"detail": "Vui lòng cung cấp car_id"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            xe = apply_tenant_filter(Xe.objects.all(), request).get(ma_xe=car_id)
            wishlist_item = Wishlist.objects.filter(user=request.user, xe=xe).first()
            in_wishlist = wishlist_item is not None
            
            return Response({
                "in_wishlist": in_wishlist,
                "wishlist_id": wishlist_item.id if wishlist_item else None,
                "car_id": car_id
            })
        except Xe.DoesNotExist:
            return Response(
                {"detail": f"Không tìm thấy xe với mã '{car_id}'"},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=["post"], url_path="add")
    def add(self, request):
        """Thêm xe vào wishlist (alias cho create)"""
        return self.create(request)
    
    @action(detail=False, methods=["post"], url_path="remove-by-car")
    def remove_by_car(self, request):
        """Xóa xe khỏi wishlist bằng car_id"""
        car_id = request.data.get("car_id")
        if not car_id:
            return Response(
                {"detail": "Vui lòng cung cấp car_id"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            xe = Xe.objects.get(ma_xe=car_id)
            wishlist_item = Wishlist.objects.filter(user=request.user, xe=xe).first()
            
            if wishlist_item:
                wishlist_item.delete()
                return Response(
                    {"detail": "Đã xóa khỏi wishlist", "car_id": car_id},
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {"detail": "Xe này không có trong wishlist"},
                    status=status.HTTP_404_NOT_FOUND
                )
        except Xe.DoesNotExist:
            return Response(
                {"detail": f"Không tìm thấy xe với mã '{car_id}'"},
                status=status.HTTP_404_NOT_FOUND
            )
