from rest_framework import serializers
from products.models import LoaiXe, Xe


class LoaiXeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoaiXe
        fields = "__all__"


class XeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Xe
        fields = "__all__"


