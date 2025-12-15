from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser, AllowAny, IsAuthenticated
from django.shortcuts import get_object_or_404
import logging

from products.models import Location, LoaiXe, Xe, Review, CarImage, BlogPost
from products.serializers import (
    LocationSerializer, LoaiXeSerializer, XeSerializer,
    ReviewSerializer, ReviewCreateSerializer,
    CarImageSerializer, CarImageCreateSerializer,
    BlogPostSerializer
)


# ==================== Location ViewSet ====================

class LocationViewSet(viewsets.ModelViewSet):
    """ViewSet cho Location"""
    queryset = Location.objects.filter(trang_thai=True).order_by('ten_dia_diem')
    serializer_class = LocationSerializer
    
    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        return [IsAdminUser()]


# ==================== LoaiXe ViewSet ====================

class LoaiXeViewSet(viewsets.ModelViewSet):
    """ViewSet cho LoaiXe"""
    queryset = LoaiXe.objects.all().order_by('ma_loai', 'ten_loai')
    serializer_class = LoaiXeSerializer
    
    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        return [IsAdminUser()]
    
    def get_queryset(self):
        # Đảm bảo có ordering để tránh cảnh báo pagination
        return LoaiXe.objects.all().order_by('ma_loai', 'ten_loai')


# ==================== Xe ViewSet ====================

class XeViewSet(viewsets.ModelViewSet):
    """ViewSet cho Xe"""
    queryset = Xe.objects.select_related("loai_xe").order_by('ma_xe', 'ten_xe')
    serializer_class = XeSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["ten_xe", "mau_sac", "loai_xe__ten_loai", "seo_keywords"]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        return [IsAdminUser()]

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
        # Đảm bảo có ordering để tránh cảnh báo pagination
        # Sử dụng ordering rõ ràng và nhất quán
        qs = Xe.objects.select_related("loai_xe").order_by('ma_xe', 'ten_xe')
        min_price = self.request.query_params.get("min_price")
        max_price = self.request.query_params.get("max_price")
        loai = self.request.query_params.get("loai")
        gia_thue_min = self.request.query_params.get("gia_thue_min")
        gia_thue_max = self.request.query_params.get("gia_thue_max")

        if min_price is not None:
            qs = qs.filter(gia__gte=min_price)
        if max_price is not None:
            qs = qs.filter(gia__lte=max_price)
        if gia_thue_min is not None:
            qs = qs.filter(gia_thue__gte=gia_thue_min)
        if gia_thue_max is not None:
            qs = qs.filter(gia_thue__lte=gia_thue_max)
        if loai:
            qs = qs.filter(loai_xe__ma_loai=loai)

        # Đảm bảo luôn có ordering, ngay cả sau khi filter
        return qs.order_by('ma_xe', 'ten_xe')


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
                xe=xe,
                user=request.user,
                rating=serializer.validated_data["rating"],
                comment=serializer.validated_data["comment"]
            )
            
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
        
        xe = get_object_or_404(Xe, pk=xe_id)
        images = request.FILES.getlist("images")  # Lấy danh sách files
        
        if not images:
            return Response(
                {"detail": "Vui lòng chọn ít nhất một ảnh"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        created_images = []
        for idx, image in enumerate(images):
            car_image = CarImage.objects.create(
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

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return []
        return [IsAdminUser()]
