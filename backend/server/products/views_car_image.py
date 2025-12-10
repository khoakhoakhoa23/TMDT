from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser, AllowAny, IsAuthenticated
from django.shortcuts import get_object_or_404

from products.models import CarImage, Xe
from products.serializers import CarImageSerializer, CarImageCreateSerializer


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

