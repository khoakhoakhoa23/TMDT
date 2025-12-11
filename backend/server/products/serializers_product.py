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
        # Không override loai_xe, để nó vẫn hiển thị bình thường khi read
    
    def to_internal_value(self, data):
        """Convert string numbers to integers for FormData"""
        # Khi nhận FormData, data có thể là QueryDict hoặc dict
        # Convert các field số từ string sang int
        int_fields = ['gia', 'gia_thue', 'gia_khuyen_mai', 'so_luong', 'so_cho', 'dung_tich_nhien_lieu']
        
        # Xử lý QueryDict (từ FormData)
        if hasattr(data, 'get'):
            data_dict = {}
            for key in data.keys():
                value = data.get(key)
                if key in int_fields and isinstance(value, str) and value.strip():
                    try:
                        data_dict[key] = int(value)
                    except (ValueError, TypeError):
                        data_dict[key] = value
                else:
                    data_dict[key] = value
            data = data_dict
        elif isinstance(data, dict):
            # Xử lý dict thông thường
            for field in int_fields:
                if field in data and isinstance(data[field], str) and data[field].strip():
                    try:
                        data[field] = int(data[field])
                    except (ValueError, TypeError):
                        pass
        
        return super().to_internal_value(data)
    
    def validate_loai_xe(self, value):
        """Validate và tìm LoaiXe từ ma_loai (string) khi write"""
        # Nếu value đã là LoaiXe object, trả về luôn (khi read)
        if isinstance(value, LoaiXe):
            return value
        
        # Nếu là string (ma_loai), tìm LoaiXe tương ứng (khi write)
        if isinstance(value, str) and value.strip():
            try:
                loai_xe = LoaiXe.objects.get(ma_loai=value)
                return loai_xe
            except LoaiXe.DoesNotExist:
                raise serializers.ValidationError(f"Không tìm thấy loại xe với mã '{value}'. Vui lòng kiểm tra lại mã loại xe.")
            except LoaiXe.MultipleObjectsReturned:
                # Trường hợp này không nên xảy ra vì ma_loai là primary key
                raise serializers.ValidationError(f"Có nhiều loại xe với mã '{value}'")
        
        # Nếu value rỗng hoặc None
        if not value:
            raise serializers.ValidationError("Loại xe là bắt buộc")
        
        return value
    
    def validate_slug(self, value):
        """Đảm bảo slug unique"""
        if not value:
            return value
        
        # Kiểm tra slug đã tồn tại chưa
        from products.models import Xe
        queryset = Xe.objects.filter(slug=value)
        # Nếu đang update, loại trừ instance hiện tại
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        
        if queryset.exists():
            # Tạo slug mới bằng cách thêm timestamp
            import time
            value = f"{value}-{int(time.time())}"
        
        return value
    
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
        """Đảm bảo image_url luôn được cập nhật từ image và loai_xe được serialize đúng"""
        ret = super().to_representation(instance)
        # Thay image_url bằng image_url_display
        if 'image_url_display' in ret:
            ret['image_url'] = ret.pop('image_url_display')
        
        # Đảm bảo loai_xe được hiển thị đúng (depth=1 sẽ tự động serialize thành object)
        # Nếu loai_xe không có hoặc là string, đảm bảo nó là object
        if instance.loai_xe:
            if 'loai_xe' not in ret or not isinstance(ret.get('loai_xe'), dict):
                # Nếu depth không hoạt động, serialize thủ công
                ret['loai_xe'] = {
                    'ma_loai': instance.loai_xe.ma_loai,
                    'ten_loai': instance.loai_xe.ten_loai
                }
        
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


