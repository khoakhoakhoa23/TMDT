from rest_framework import serializers
from django.contrib.auth.models import User


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    date_joined = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True)
    last_login = serializers.DateTimeField(format="%Y-%m-%d %H:%M:%S", read_only=True, allow_null=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "is_staff", "is_superuser", "is_active", "date_joined", "last_login", "role", "password"]
        read_only_fields = ["id", "date_joined", "last_login"]

    def get_role(self, obj):
        if obj.is_superuser:
            return "admin"
        elif obj.is_staff:
            return "staff"
        else:
            return "user"

    def validate_username(self, value):
        """Kiểm tra username không trùng khi tạo mới"""
        if self.instance is None:  # Tạo mới
            if User.objects.filter(username=value).exists():
                raise serializers.ValidationError("Username đã tồn tại.")
        else:  # Cập nhật
            if User.objects.filter(username=value).exclude(pk=self.instance.pk).exists():
                raise serializers.ValidationError("Username đã tồn tại.")
        return value

    def validate_email(self, value):
        """Kiểm tra email không trùng khi tạo mới"""
        if value:
            if self.instance is None:  # Tạo mới
                if User.objects.filter(email=value).exists():
                    raise serializers.ValidationError("Email đã tồn tại.")
            else:  # Cập nhật
                if User.objects.filter(email=value).exclude(pk=self.instance.pk).exists():
                    raise serializers.ValidationError("Email đã tồn tại.")
        return value

    def create(self, validated_data):
        """Tạo user mới"""
        password = validated_data.pop('password', None)
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
        else:
            # Nếu không có password, set mật khẩu mặc định
            user.set_password('password123')
        user.save()
        return user

    def update(self, instance, validated_data):
        """Cập nhật user"""
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

