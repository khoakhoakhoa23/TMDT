from rest_framework import viewsets, filters
from rest_framework.permissions import IsAdminUser

from products.models import LoaiXe, Xe
from products.serializers import LoaiXeSerializer, XeSerializer


class LoaiXeViewSet(viewsets.ModelViewSet):
    queryset = LoaiXe.objects.all()
    serializer_class = LoaiXeSerializer
    permission_classes = [IsAdminUser]


class XeViewSet(viewsets.ModelViewSet):
    queryset = Xe.objects.all()
    serializer_class = XeSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["ten_xe", "mau_sac", "loai_xe__ten_loai", "seo_keywords"]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return []
        return [IsAdminUser()]

    def get_queryset(self):
        qs = Xe.objects.all()
        min_price = self.request.query_params.get("min_price")
        max_price = self.request.query_params.get("max_price")
        loai = self.request.query_params.get("loai")

        if min_price is not None:
            qs = qs.filter(gia__gte=min_price)
        if max_price is not None:
            qs = qs.filter(gia__lte=max_price)
        if loai:
            qs = qs.filter(loai_xe__ma_loai=loai)

        return qs


