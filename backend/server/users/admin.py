from django.contrib import admin
from .models import NhanVien, KhachHang, NCC, Admin, UserProfile


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


@admin.register(Admin)
class AdminAdmin(admin.ModelAdmin):
    list_display = ("username",)
    search_fields = ("username",)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "phone", "gender", "created_at")
    search_fields = ("user__username", "user__email", "phone")
    list_filter = ("gender", "created_at")
