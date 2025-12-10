from rest_framework import serializers
from payments.models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer cho Payment"""
    order_id = serializers.IntegerField(source='order.id', read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            "id",
            "order",
            "order_id",
            "user",
            "user_name",
            "payment_method",
            "amount",
            "status",
            "transaction_id",
            "payment_url",
            "qr_code",
            "callback_data",
            "created_at",
            "updated_at",
            "paid_at",
        ]
        read_only_fields = [
            "user",
            "status",
            "transaction_id",
            "payment_url",
            "qr_code",
            "callback_data",
            "created_at",
            "updated_at",
            "paid_at",
        ]


class PaymentCreateSerializer(serializers.Serializer):
    """Serializer để tạo payment"""
    order_id = serializers.IntegerField()
    payment_method = serializers.ChoiceField(choices=Payment.PAYMENT_METHODS)
    return_url = serializers.URLField(required=False, allow_blank=True)
    
    def validate_payment_method(self, value):
        """Validate payment method"""
        if value not in ["momo", "zalopay", "vnpay"]:
            raise serializers.ValidationError(
                "Chỉ hỗ trợ Momo, ZaloPay, VNPay cho thanh toán nội địa"
            )
        return value

