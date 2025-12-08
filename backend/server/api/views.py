from rest_framework import viewsets
from rest_framework.response import Response
from django.db.models import Sum
from django.utils.timezone import now
from rest_framework.permissions import IsAuthenticated, IsAdminUser, BasePermission
from .models import *
from .serializers import *
from .serializers import HoaDonNhapSerializer
from rest_framework import generics
from django.contrib.auth.models import User
from .serializers import RegisterSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny






# ----------------------------
# Permission cho Nhân viên
# ----------------------------
class IsNhanVien(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.groups.filter(name="NhanVien").exists() 
            or request.user.is_superuser
        )


# ----------------------------
# LOẠI XE – Chỉ Admin CRUD
# ----------------------------
class LoaiXeViewSet(viewsets.ModelViewSet):
    queryset = LoaiXe.objects.all()
    serializer_class = LoaiXeSerializer
    permission_classes = [IsAdminUser]


# ----------------------------
# XE – Ai cũng xem được, chỉ Admin CRUD
# ----------------------------
class XeViewSet(viewsets.ModelViewSet):
    queryset = Xe.objects.all()
    serializer_class = XeSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]: 
            return []  # ai cũng xem được xe
        return [IsAdminUser()]  # Admin mới CRUD


# ----------------------------
# NHÂN VIÊN – chỉ Admin quản lý
# ----------------------------
class NhanVienViewSet(viewsets.ModelViewSet):
    queryset = NhanVien.objects.all()
    serializer_class = NhanVienSerializer
    permission_classes = [IsAdminUser]


# ----------------------------
# KHÁCH HÀNG – chỉ Admin CRUD
# ----------------------------
class KhachHangViewSet(viewsets.ModelViewSet):
    queryset = KhachHang.objects.all()
    serializer_class = KhachHangSerializer
    permission_classes = [IsAdminUser]


# ----------------------------
# NHÀ CUNG CẤP – chỉ Admin CRUD
# ----------------------------
class NCCViewSet(viewsets.ModelViewSet):
    queryset = NCC.objects.all()
    serializer_class = NCCSerializer
    permission_classes = [IsAdminUser]


# ----------------------------
# HÓA ĐƠN NHẬP – Admin + Nhân viên
# ----------------------------
class HoaDonNhapViewSet(viewsets.ModelViewSet):
    queryset = HoaDonNhap.objects.all()
    serializer_class = HoaDonNhapSerializer
    permission_classes = [IsAuthenticated, IsNhanVien]


# ----------------------------
# CHI TIẾT HĐ NHẬP – Admin + Nhân viên
# ----------------------------
class ChiTietHDNViewSet(viewsets.ModelViewSet):
    queryset = ChiTietHDN.objects.all()
    serializer_class = ChiTietHDNSerializer
    permission_classes = [IsAuthenticated, IsNhanVien]


# ----------------------------
# HÓA ĐƠN XUẤT – Admin + Nhân viên
# ----------------------------
class HoaDonXuatViewSet(viewsets.ModelViewSet):
    queryset = HoaDonXuat.objects.all()
    serializer_class = HoaDonXuatSerializer
    permission_classes = [IsAuthenticated, IsNhanVien]


# ----------------------------
# CHI TIẾT HÓA ĐƠN XUẤT – Admin + Nhân viên
# ----------------------------
class ChiTietHDXViewSet(viewsets.ModelViewSet):
    queryset = ChiTietHDX.objects.all()
    serializer_class = ChiTietHDXSerializer
    permission_classes = [IsAuthenticated, IsNhanVien]


# ----------------------------
# BẢO HÀNH – Admin + Nhân viên
# ----------------------------
class BaoHanhViewSet(viewsets.ModelViewSet):
    queryset = BaoHanh.objects.all()
    serializer_class = BaoHanhSerializer
    permission_classes = [IsAuthenticated, IsNhanVien]


# ----------------------------
# ADMIN MODEL (custom) – chỉ superuser CRUD
# ----------------------------
class AdminViewSet(viewsets.ModelViewSet):
    queryset = Admin.objects.all()
    serializer_class = AdminSerializer
    permission_classes = [IsAdminUser]

# ================================
#   API Doanh Thu Ngày
# ================================
@api_view(['GET'])
def doanh_thu_hom_nay(request):
    today = now().date()

    doanh_thu = (
        HoaDonXuat.objects.filter(ngay=today)
        .annotate(tong=Sum('chitiethdx__so_luong' * 1))
    )

    tong_tien = 0
    for hd in HoaDonXuat.objects.filter(ngay=today):
        for ct in hd.chitiethdx_set.all():
            tong_tien += ct.so_luong * ct.xe.gia

    return Response({
        "ngay": str(today),
        "doanh_thu": tong_tien
    })


# ================================
#   API Doanh Thu Theo Tháng
# ================================
@api_view(['GET'])
def doanh_thu_thang(request, year, month):
    doanh_thu = 0

    for hd in HoaDonXuat.objects.filter(ngay__year=year, ngay__month=month):
        for ct in hd.chitiethdx_set.all():
            doanh_thu += ct.so_luong * ct.xe.gia

    return Response({
        "nam": year,
        "thang": month,
        "doanh_thu": doanh_thu
    })


# ================================
#   Tổng số xe đã bán
# ================================
@api_view(['GET'])
def tong_xe_da_ban(request):
    total = ChiTietHDX.objects.aggregate(total_sold=Sum('so_luong'))['total_sold'] or 0

    return Response({
        "tong_xe_da_ban": total
    })


# ================================
#   Top xe bán chạy
# ================================
@api_view(['GET'])
def top_xe_ban_chay(request):
    top = (
        ChiTietHDX.objects.values('xe__ten_xe')
        .annotate(total_sold=Sum('so_luong'))
        .order_by('-total_sold')[:5]
    )

    return Response(top)

# ================================
#   đăng kí nguoi dùng
# ================================
class RegisterAPIView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_role(request):
    user = request.user

    role = "user"
    if user.is_superuser:
        role = "admin"
    elif user.is_staff:
        role = "staff"

    return Response({"username": user.username, "role": role})