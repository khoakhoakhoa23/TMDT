from rest_framework import serializers
from products.models import Review
from django.contrib.auth.models import User


class UserReviewSerializer(serializers.ModelSerializer):
    """Serializer cho user trong review"""
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "email"]


class ReviewSerializer(serializers.ModelSerializer):
    """Serializer cho Review"""
    user = UserReviewSerializer(read_only=True)
    user_name = serializers.SerializerMethodField()
    user_title = serializers.SerializerMethodField()
    
    class Meta:
        model = Review
        fields = [
            "id",
            "xe",
            "user",
            "user_name",
            "user_title",
            "rating",
            "comment",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["user", "created_at", "updated_at"]
    
    def get_user_name(self, obj):
        """Lấy tên đầy đủ hoặc username"""
        if obj.user.first_name or obj.user.last_name:
            return f"{obj.user.first_name} {obj.user.last_name}".strip()
        return obj.user.username
    
    def get_user_title(self, obj):
        """Lấy title của user (có thể mở rộng sau)"""
        # Có thể thêm profile model sau để lưu title
        return None
    
    def validate_rating(self, value):
        """Validate rating phải từ 1-5"""
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating phải từ 1 đến 5 sao")
        return value
    
    def create(self, validated_data):
        """Tự động gán user từ request"""
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class ReviewCreateSerializer(serializers.ModelSerializer):
    """Serializer đơn giản để tạo review"""
    class Meta:
        model = Review
        fields = ["xe", "rating", "comment"]
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Set queryset cho xe field
        from products.models import Xe
        self.fields['xe'] = serializers.PrimaryKeyRelatedField(queryset=Xe.objects.all())
    
    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating phải từ 1 đến 5 sao")
        return value
    
    def validate_xe(self, value):
        """Validate xe tồn tại"""
        if not value:
            raise serializers.ValidationError("Vui lòng chọn xe")
        return value

