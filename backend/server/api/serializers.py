from rest_framework import serializers
from .models import *
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password



class LoaiXeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoaiXe
        fields = '__all__'


class XeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Xe
        fields = '__all__'


class NhanVienSerializer(serializers.ModelSerializer):
    class Meta:
        model = NhanVien
        fields = '__all__'


class KhachHangSerializer(serializers.ModelSerializer):
    class Meta:
        model = KhachHang
        fields = '__all__'


class NCCSerializer(serializers.ModelSerializer):
    class Meta:
        model = NCC
        fields = '__all__'


class ChiTietHDNSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChiTietHDN
        fields = '__all__'

    def create(self, validated_data):
        xe = validated_data['xe']
        so_luong = validated_data['so_luong']

        # Cộng tồn kho
        xe.so_luong += so_luong
        xe.save()

        return ChiTietHDN.objects.create(**validated_data)



class HoaDonNhapSerializer(serializers.ModelSerializer):
    class Meta:
        model = HoaDonNhap
        fields = '__all__'


class HoaDonXuatSerializer(serializers.ModelSerializer):
    class Meta:
        model = HoaDonXuat
        fields = '__all__'


class ChiTietHDXSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChiTietHDX
        fields = '__all__'

    def validate(self, data):
        xe = data['xe']
        so_luong = data['so_luong']

        # Kiểm tra tồn kho
        if xe.so_luong < so_luong:
            raise serializers.ValidationError(
                f"Xe '{xe.ten_xe}' chỉ còn {xe.so_luong} chiếc, không đủ để bán {so_luong} chiếc."
            )
        return data

    def create(self, validated_data):
        xe = validated_data['xe']
        so_luong = validated_data['so_luong']

        # Trừ tồn kho
        xe.so_luong -= so_luong
        xe.save()

        # Lưu chi tiết hóa đơn
        return ChiTietHDX.objects.create(**validated_data)



class BaoHanhSerializer(serializers.ModelSerializer):
    class Meta:
        model = BaoHanh
        fields = '__all__'


class AdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = Admin
        fields = '__all__'

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "email", "password"]

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username đã tồn tại.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email đã tồn tại.")
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"]
        )
        return user