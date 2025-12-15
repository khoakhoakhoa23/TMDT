from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from orders.models import HoaDonNhap, ChiTietHDN, HoaDonXuat, ChiTietHDX, BaoHanh
from orders.serializers import (
    HoaDonNhapSerializer,
    ChiTietHDNSerializer,
    HoaDonXuatSerializer,
    ChiTietHDXSerializer,
    BaoHanhSerializer,
)
from core.permissions import IsNhanVien


# ==================== Billing ViewSets ====================

class HoaDonNhapViewSet(viewsets.ModelViewSet):
    """ViewSet cho HoaDonNhap"""
    queryset = HoaDonNhap.objects.all()
    serializer_class = HoaDonNhapSerializer
    permission_classes = [IsAuthenticated, IsNhanVien]


class ChiTietHDNViewSet(viewsets.ModelViewSet):
    """ViewSet cho ChiTietHDN"""
    queryset = ChiTietHDN.objects.all()
    serializer_class = ChiTietHDNSerializer
    permission_classes = [IsAuthenticated, IsNhanVien]


class HoaDonXuatViewSet(viewsets.ModelViewSet):
    """ViewSet cho HoaDonXuat"""
    queryset = HoaDonXuat.objects.all()
    serializer_class = HoaDonXuatSerializer
    permission_classes = [IsAuthenticated, IsNhanVien]


class ChiTietHDXViewSet(viewsets.ModelViewSet):
    """ViewSet cho ChiTietHDX"""
    queryset = ChiTietHDX.objects.all()
    serializer_class = ChiTietHDXSerializer
    permission_classes = [IsAuthenticated, IsNhanVien]


# ==================== Warranty ViewSets ====================

class BaoHanhViewSet(viewsets.ModelViewSet):
    """ViewSet cho BaoHanh"""
    queryset = BaoHanh.objects.all()
    serializer_class = BaoHanhSerializer
    permission_classes = [IsAuthenticated, IsNhanVien]
