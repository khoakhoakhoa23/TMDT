from rest_framework import serializers
from orders.models import (
    HoaDonNhap, ChiTietHDN, HoaDonXuat, ChiTietHDX,
    BaoHanh,
    Cart, CartItem, Order, OrderItem
)
from products.models import Xe
from products.serializers import XeSerializer
from .validators import (
    validate_vietnamese_phone,
    validate_future_date_for_rental,
    validate_non_negative_number,
    validate_address_length,
    validate_payment_method,
    validate_time_format,
    validate_date_range,
    validate_order_quantity,
)


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

    def validate_quantity(self, value):
        """Validate số lượng sản phẩm"""
        from .validators import validate_order_quantity
        validate_order_quantity(value)
        return value

    def validate(self, attrs):
        """Validate OrderItem data"""
        from decimal import Decimal
        
        xe = attrs.get('xe')
        quantity = attrs.get('quantity', 1)
        
        if xe and quantity:
            # Kiểm tra tồn kho
            if xe.so_luong < quantity:
                raise serializers.ValidationError(
                    f"Xe '{xe.ten_xe}' chỉ còn {xe.so_luong} chiếc, không đủ để đặt {quantity} chiếc."
                )
            
            # Validate giá
            price = attrs.get('price_at_purchase', 0)
            if price and price < 0:
                raise serializers.ValidationError(
                    {'price_at_purchase': 'Giá không được âm.'}
                )
        
        return attrs


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    hoa_don_xuat = serializers.SerializerMethodField()
    hoa_don_xuat_ma = serializers.CharField(source='hoa_don_xuat.ma_hdx', read_only=True, allow_null=True)
    coupon_code = serializers.CharField(source='coupon.code', read_only=True, allow_null=True)

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
            "start_time",
            "end_time",
            "pickup_location",
            "return_location",
            "rental_days",
            "rental_hours",
            "base_price",
            "delivery_fee",
            "pickup_fee",
            "additional_fee",
            "discount_amount",
            "late_fee",
            "coupon_code",
            "reserved_until",
            "actual_return_date",
            "actual_return_time",
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

    def validate(self, attrs):
        """Validate toàn bộ order data"""
        from django.utils import timezone
        from decimal import Decimal
        
        # Validate shipping phone nếu có
        shipping_phone = attrs.get('shipping_phone')
        if shipping_phone:
            validate_vietnamese_phone(shipping_phone)
        
        # Validate shipping address
        shipping_address = attrs.get('shipping_address')
        if shipping_address:
            validate_address_length(shipping_address, min_length=10, max_length=500)
        
        # Validate rental dates
        start_date = attrs.get('start_date')
        end_date = attrs.get('end_date')
        
        if start_date and end_date:
            # Ngày kết thúc phải >= ngày bắt đầu
            validate_date_range(start_date, end_date, allow_same_day=True)
            
            # Ngày bắt đầu phải là tương lai hoặc hôm nay
            validate_future_date_for_rental(start_date)
        
        # Validate rental days and hours
        rental_days = attrs.get('rental_days', 0)
        rental_hours = attrs.get('rental_hours', 0)
        
        if rental_days is not None and rental_days < 0:
            raise serializers.ValidationError({'rental_days': 'Số ngày thuê không được âm.'})
        
        if rental_hours is not None and rental_hours < 0:
            raise serializers.ValidationError({'rental_hours': 'Số giờ thuê không được âm.'})
        
        # Validate prices
        for field in ['base_price', 'delivery_fee', 'pickup_fee', 'additional_fee', 'discount_amount', 'late_fee', 'total_price']:
            value = attrs.get(field)
            if value is not None:
                validate_non_negative_number(value)
        
        # Validate payment method
        payment_method = attrs.get('payment_method')
        if payment_method:
            validate_payment_method(payment_method)
        
        # Validate pickup and return locations cho thuê xe
        pickup_location = attrs.get('pickup_location')
        return_location = attrs.get('return_location')
        
        # Nếu có rental dates thì phải có pickup/return location
        if (start_date or end_date) and not pickup_location:
            raise serializers.ValidationError({'pickup_location': 'Vui lòng chọn địa điểm nhận xe.'})
        
        if (start_date or end_date) and not return_location:
            raise serializers.ValidationError({'return_location': 'Vui lòng chọn địa điểm trả xe.'})
        
        return attrs
