from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, IsAdminUser

from orders.models import HoaDonNhap, ChiTietHDN, HoaDonXuat, ChiTietHDX
from orders.serializers import (
    HoaDonNhapSerializer,
    ChiTietHDNSerializer,
    HoaDonXuatSerializer,
    ChiTietHDXSerializer,
)
from .permissions import IsNhanVien


class HoaDonNhapViewSet(viewsets.ModelViewSet):
    queryset = HoaDonNhap.objects.all()
    serializer_class = HoaDonNhapSerializer
    permission_classes = [IsAuthenticated, IsNhanVien]


class ChiTietHDNViewSet(viewsets.ModelViewSet):
    queryset = ChiTietHDN.objects.all()
    serializer_class = ChiTietHDNSerializer
    permission_classes = [IsAuthenticated, IsNhanVien]


class HoaDonXuatViewSet(viewsets.ModelViewSet):
    queryset = HoaDonXuat.objects.all()
    serializer_class = HoaDonXuatSerializer
    permission_classes = [IsAuthenticated, IsNhanVien]


class ChiTietHDXViewSet(viewsets.ModelViewSet):
    queryset = ChiTietHDX.objects.all()
    serializer_class = ChiTietHDXSerializer
    permission_classes = [IsAuthenticated, IsNhanVien]


