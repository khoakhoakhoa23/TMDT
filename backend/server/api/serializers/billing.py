from rest_framework import serializers
from api.models import HoaDonNhap, ChiTietHDN, HoaDonXuat, ChiTietHDX


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


