from rest_framework import serializers
from orders.models import (
    HoaDonNhap, ChiTietHDN, HoaDonXuat, ChiTietHDX,
    BaoHanh,
    Cart, CartItem, Order, OrderItem
)
from products.models import Xe
from products.serializers import XeSerializer


# ==================== Billing Serializers ====================

class ChiTietHDNSerializer(serializers.ModelSerializer):
    xe_detail = XeSerializer(source="xe", read_only=True)

    class Meta:
        model = ChiTietHDN
        fields = "__all__"

    def create(self, validated_data):
        xe = validated_data["xe"]
        so_luong = validated_data["so_luong"]
        xe.so_luong += so_luong
        xe.save()
        return ChiTietHDN.objects.create(**validated_data)


class HoaDonNhapSerializer(serializers.ModelSerializer):
    nhan_vien_name = serializers.CharField(source="nhan_vien.ten", read_only=True)
    ncc_name = serializers.CharField(source="ncc.ten", read_only=True)

    class Meta:
        model = HoaDonNhap
        fields = "__all__"


class HoaDonXuatSerializer(serializers.ModelSerializer):
    nhan_vien_name = serializers.CharField(source="nhan_vien.ten", read_only=True)
    khach_hang_name = serializers.CharField(source="khach_hang.ten", read_only=True)

    class Meta:
        model = HoaDonXuat
        fields = "__all__"


class ChiTietHDXSerializer(serializers.ModelSerializer):
    xe_detail = XeSerializer(source="xe", read_only=True)

    class Meta:
        model = ChiTietHDX
        fields = "__all__"

    def validate(self, data):
        xe = data["xe"]
        so_luong = data["so_luong"]
        if xe.so_luong < so_luong:
            raise serializers.ValidationError(
                f"Xe '{xe.ten_xe}' chỉ còn {xe.so_luong} chiếc, không đủ để bán {so_luong} chiếc."
            )
        return data

    def create(self, validated_data):
        xe = validated_data["xe"]
        so_luong = validated_data["so_luong"]
        xe.so_luong -= so_luong
        xe.save()
        return ChiTietHDX.objects.create(**validated_data)


# ==================== Warranty Serializers ====================

class BaoHanhSerializer(serializers.ModelSerializer):
    class Meta:
        model = BaoHanh
        fields = "__all__"


# ==================== Commerce Serializers ====================

class CartItemSerializer(serializers.ModelSerializer):
    xe = XeSerializer(read_only=True)
    xe_id = serializers.PrimaryKeyRelatedField(
        queryset=Xe.objects.all(), source="xe", write_only=True
    )
    cart_id = serializers.PrimaryKeyRelatedField(
        queryset=Cart.objects.all(), source="cart", write_only=True
    )

    class Meta:
        model = CartItem
        fields = ["id", "cart_id", "xe", "xe_id", "quantity"]


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    session_key = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Cart
        fields = ["id", "user", "session_key", "created_at", "updated_at", "items"]
        read_only_fields = ["user", "created_at", "updated_at"]


class OrderItemSerializer(serializers.ModelSerializer):
    xe = XeSerializer(read_only=True)
    xe_id = serializers.PrimaryKeyRelatedField(
        queryset=Xe.objects.all(), source="xe", write_only=True
    )

    class Meta:
        model = OrderItem
        fields = ["id", "xe", "xe_id", "quantity", "price_at_purchase"]
        read_only_fields = ["price_at_purchase"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    hoa_don_xuat = serializers.SerializerMethodField()
    hoa_don_xuat_ma = serializers.CharField(source='hoa_don_xuat.ma_hdx', read_only=True, allow_null=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "user",
            "created_at",
            "status",
            "total_price",
            "note",
            "shipping_name",
            "shipping_phone",
            "shipping_address",
            "shipping_city",
            "payment_method",
            "payment_status",
            "start_date",
            "end_date",
            "pickup_location",
            "return_location",
            "rental_days",
            "items",
            "hoa_don_xuat",
            "hoa_don_xuat_ma",
        ]
        read_only_fields = ["user", "created_at", "total_price", "payment_status"]

    def get_hoa_don_xuat(self, obj):
        if obj.hoa_don_xuat:
            return {
                "ma_hdx": obj.hoa_don_xuat.ma_hdx,
                "ngay": obj.hoa_don_xuat.ngay,
                "nhan_vien": obj.hoa_don_xuat.nhan_vien.ten if obj.hoa_don_xuat.nhan_vien else None,
                "khach_hang": obj.hoa_don_xuat.khach_hang.ten if obj.hoa_don_xuat.khach_hang else None,
            }
        return None
