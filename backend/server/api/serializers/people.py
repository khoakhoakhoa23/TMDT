from rest_framework import serializers
from api.models import NhanVien, KhachHang, NCC


class NhanVienSerializer(serializers.ModelSerializer):
    class Meta:
        model = NhanVien
        fields = "__all__"


class KhachHangSerializer(serializers.ModelSerializer):
    class Meta:
        model = KhachHang
        fields = "__all__"


class NCCSerializer(serializers.ModelSerializer):
    class Meta:
        model = NCC
        fields = "__all__"

