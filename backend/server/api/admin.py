from django.contrib import admin

from api.models import (
    LoaiXe,
    Xe,
    NhanVien,
    KhachHang,
    NCC,
    HoaDonNhap,
    ChiTietHDN,
    HoaDonXuat,
    ChiTietHDX,
    BaoHanh,
    Admin,
    BlogPost,
    Cart,
    CartItem,
    Order,
    OrderItem,
)


@admin.register(LoaiXe)
class LoaiXeAdmin(admin.ModelAdmin):
    list_display = ("ma_loai", "ten_loai")
    search_fields = ("ma_loai", "ten_loai")


@admin.register(Xe)
class XeAdmin(admin.ModelAdmin):
    list_display = ("ma_xe", "ten_xe", "loai_xe", "gia", "gia_khuyen_mai", "so_luong", "trang_thai")
    list_filter = ("loai_xe", "trang_thai", "mau_sac")
    search_fields = ("ma_xe", "ten_xe", "loai_xe__ten_loai", "seo_keywords")
    prepopulated_fields = {"slug": ("ten_xe",)}


@admin.register(NhanVien)
class NhanVienAdmin(admin.ModelAdmin):
    list_display = ("ma_nv", "ten", "chuc_vu", "sdt")
    search_fields = ("ma_nv", "ten", "sdt", "chuc_vu")


@admin.register(KhachHang)
class KhachHangAdmin(admin.ModelAdmin):
    list_display = ("ma_kh", "ten", "sdt", "dia_chi")
    search_fields = ("ma_kh", "ten", "sdt")


@admin.register(NCC)
class NCCAdmin(admin.ModelAdmin):
    list_display = ("ma_ncc", "ten", "sdt", "dia_chi")
    search_fields = ("ma_ncc", "ten", "sdt")


class ChiTietHDNInline(admin.TabularInline):
    model = ChiTietHDN
    extra = 0


@admin.register(HoaDonNhap)
class HoaDonNhapAdmin(admin.ModelAdmin):
    list_display = ("ma_hdn", "ngay_nhap", "nhan_vien", "ncc")
    search_fields = ("ma_hdn", "nhan_vien__ten", "ncc__ten")
    inlines = [ChiTietHDNInline]


class ChiTietHDXInline(admin.TabularInline):
    model = ChiTietHDX
    extra = 0


@admin.register(HoaDonXuat)
class HoaDonXuatAdmin(admin.ModelAdmin):
    list_display = ("ma_hdx", "ngay", "nhan_vien", "khach_hang")
    search_fields = ("ma_hdx", "nhan_vien__ten", "khach_hang__ten")
    inlines = [ChiTietHDXInline]


@admin.register(BaoHanh)
class BaoHanhAdmin(admin.ModelAdmin):
    list_display = ("ma_bh", "khach_hang", "xe", "ngay_bh")
    search_fields = ("ma_bh", "khach_hang__ten", "xe__ten_xe")


@admin.register(Admin)
class AdminAdmin(admin.ModelAdmin):
    list_display = ("username",)
    search_fields = ("username",)


@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = ("title", "slug", "is_published", "published_at")
    list_filter = ("is_published",)
    search_fields = ("title", "slug", "seo_keywords")
    prepopulated_fields = {"slug": ("title",)}


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "created_at", "updated_at")
    search_fields = ("user__username",)
    inlines = [CartItemInline]


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "status", "total_price", "created_at")
    list_filter = ("status",)
    search_fields = ("id", "user__username")
    inlines = [OrderItemInline]


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ("id", "cart", "xe", "quantity")
    search_fields = ("cart__user__username", "xe__ten_xe")


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ("id", "order", "xe", "quantity", "price_at_purchase")
    search_fields = ("order__id", "xe__ten_xe")
