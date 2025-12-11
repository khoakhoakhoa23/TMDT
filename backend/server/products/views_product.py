from rest_framework import viewsets, filters
from rest_framework.permissions import IsAdminUser, AllowAny

from products.models import Location, LoaiXe, Xe
from products.serializers import LocationSerializer, LoaiXeSerializer, XeSerializer


class LocationViewSet(viewsets.ModelViewSet):
    queryset = Location.objects.filter(trang_thai=True).order_by('ten_dia_diem')
    serializer_class = LocationSerializer
    
    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        return [IsAdminUser()]


class LoaiXeViewSet(viewsets.ModelViewSet):
    queryset = LoaiXe.objects.all()
    serializer_class = LoaiXeSerializer
    
    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        return [IsAdminUser()]


class XeViewSet(viewsets.ModelViewSet):
    queryset = Xe.objects.select_related("loai_xe").order_by('ten_xe', 'ma_xe')
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
        import logging
        from rest_framework.response import Response
        from rest_framework import status
        
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
        qs = Xe.objects.select_related("loai_xe").order_by('ten_xe', 'ma_xe')
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

        return qs


