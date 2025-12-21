from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer cho Notification"""
    order_id = serializers.IntegerField(source="order.id", read_only=True, allow_null=True)

    class Meta:
        model = Notification
        fields = [
            "id",
            "type",
            "title",
            "message",
            "read",
            "order_id",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

