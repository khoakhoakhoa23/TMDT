from rest_framework import serializers
from products.models import CarImage


class CarImageSerializer(serializers.ModelSerializer):
    """Serializer cho CarImage"""
    image_url_display = serializers.SerializerMethodField()
    
    class Meta:
        model = CarImage
        fields = [
            "id",
            "xe",
            "image",
            "image_url",
            "image_url_display",
            "is_primary",
            "order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]
    
    def get_image_url_display(self, obj):
        """Trả về image_url từ image field hoặc image_url field"""
        request = self.context.get('request')
        if obj.image:
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return obj.image_url or None
    
    def to_representation(self, instance):
        """Đảm bảo image_url luôn được cập nhật từ image"""
        ret = super().to_representation(instance)
        if 'image_url_display' in ret:
            ret['image_url'] = ret.pop('image_url_display')
        return ret


class CarImageCreateSerializer(serializers.ModelSerializer):
    """Serializer đơn giản để tạo nhiều ảnh"""
    class Meta:
        model = CarImage
        fields = ["xe", "image", "image_url", "is_primary", "order"]
    
    def create(self, validated_data):
        """Tự động tạo image_url từ image nếu chưa có"""
        instance = super().create(validated_data)
        if instance.image and not instance.image_url:
            request = self.context.get('request')
            if request:
                instance.image_url = request.build_absolute_uri(instance.image.url)
                instance.save()
        return instance

