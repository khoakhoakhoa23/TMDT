from rest_framework import viewsets, filters
from rest_framework.permissions import IsAdminUser, AllowAny

from products.models import LoaiXe, Xe
from products.serializers import LoaiXeSerializer, XeSerializer


class LoaiXeViewSet(viewsets.ModelViewSet):
    queryset = LoaiXe.objects.all()
    serializer_class = LoaiXeSerializer
    
    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        return [IsAdminUser()]


class XeViewSet(viewsets.ModelViewSet):
    queryset = Xe.objects.all()
    serializer_class = XeSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["ten_xe", "mau_sac", "loai_xe__ten_loai", "seo_keywords"]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        return [IsAdminUser()]

    def get_queryset(self):
        qs = Xe.objects.select_related("loai_xe").all()
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


