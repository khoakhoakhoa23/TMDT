from rest_framework import serializers
from api.models import BaoHanh


class BaoHanhSerializer(serializers.ModelSerializer):
    class Meta:
        model = BaoHanh
        fields = "__all__"


