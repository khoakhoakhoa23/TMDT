from .domain.product import LoaiXe, Xe
from .domain.people import NhanVien, KhachHang, NCC
from .domain.billing import HoaDonNhap, ChiTietHDN, HoaDonXuat, ChiTietHDX
from .domain.warranty import BaoHanh
from .domain.content import BlogPost
from .domain.commerce import Cart, CartItem, Order, OrderItem
from .domain.account import Admin
from django.db import models  # noqa: F401  (kept for Django model discovery)

