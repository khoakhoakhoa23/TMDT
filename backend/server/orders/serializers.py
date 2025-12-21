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
    class Meta:
        model = HoaDonNhap
        fields = "__all__"


class HoaDonXuatSerializer(serializers.ModelSerializer):
    class Meta:
        model = HoaDonXuat
        fields = "__all__"


class ChiTietHDXSerializer(serializers.ModelSerializer):
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
        ]
        read_only_fields = ["user", "created_at", "total_price", "payment_status"]
