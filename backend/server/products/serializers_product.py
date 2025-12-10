from rest_framework import serializers
from products.models import Location, LoaiXe, Xe


class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = "__all__"
        read_only_fields = ['created_at', 'updated_at']


class LoaiXeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoaiXe
        fields = "__all__"


class XeSerializer(serializers.ModelSerializer):
    image_file = serializers.ImageField(write_only=True, required=False, help_text="Upload ảnh từ máy tính")
    image_url_display = serializers.SerializerMethodField()
    loai_xe_detail = LoaiXeSerializer(source='loai_xe', read_only=True)
    car_images = serializers.SerializerMethodField()  # Thêm danh sách ảnh
    
    class Meta:
        model = Xe
        fields = "__all__"
        read_only_fields = ['image']  # image chỉ đọc, upload qua image_file
        depth = 1  # Tự động serialize ForeignKey với depth 1
    
    def get_car_images(self, obj):
        """Lấy danh sách ảnh của xe"""
        from products.serializers import CarImageSerializer
        images = obj.car_images.all()
        request = self.context.get('request')
        return CarImageSerializer(images, many=True, context={'request': request}).data
    
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
        # Thay image_url bằng image_url_display
        if 'image_url_display' in ret:
            ret['image_url'] = ret.pop('image_url_display')
        return ret
    
    def create(self, validated_data):
        image_file = validated_data.pop('image_file', None)
        instance = super().create(validated_data)
        
        if image_file:
            instance.image = image_file
            # Tự động tạo image_url từ image nếu chưa có
            if not instance.image_url:
                request = self.context.get('request')
                if request:
                    instance.image_url = request.build_absolute_uri(instance.image.url)
            instance.save()
        
        return instance
    
    def update(self, instance, validated_data):
        image_file = validated_data.pop('image_file', None)
        instance = super().update(instance, validated_data)
        
        if image_file:
            # Xóa ảnh cũ nếu có
            if instance.image:
                instance.image.delete(save=False)
            instance.image = image_file
            # Tự động cập nhật image_url từ image
            request = self.context.get('request')
            if request:
                instance.image_url = request.build_absolute_uri(instance.image.url)
            instance.save()
        
        return instance


