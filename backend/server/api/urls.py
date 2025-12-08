from django.urls import path, include
from rest_framework import routers
from .views import *
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    doanh_thu_hom_nay,
    doanh_thu_thang,
    tong_xe_da_ban,
    top_xe_ban_chay
)

from rest_framework.routers import DefaultRouter
from .views import RegisterAPIView


router = routers.DefaultRouter()
router.register(r'loaixe', LoaiXeViewSet)
router.register(r'xe', XeViewSet)
router.register(r'nhanvien', NhanVienViewSet)
router.register(r'khachhang', KhachHangViewSet)
router.register(r'ncc', NCCViewSet)
router.register(r'hoadonnhap', HoaDonNhapViewSet)
router.register(r'chitiethdn', ChiTietHDNViewSet)
router.register(r'hoadonxuat', HoaDonXuatViewSet)
router.register(r'chitiethdx', ChiTietHDXViewSet)
router.register(r'baohanh', BaoHanhViewSet)
router.register(r'adminuser', AdminViewSet)

urlpatterns = [
    path('', include(router.urls)),  
    path('register/', RegisterAPIView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('me/', user_role),
    path('thongke/doanhthu-homnay/', doanh_thu_hom_nay),
    path('thongke/doanhthu/<int:year>/<int:month>/', doanh_thu_thang),
    path('thongke/tong-xe-da-ban/', tong_xe_da_ban),
    path('thongke/top-xe-ban-chay/', top_xe_ban_chay),

]
