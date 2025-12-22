from rest_framework import serializers
from products.models import Location, LoaiXe, Xe, Review, CarImage, BlogPost
from django.contrib.auth.models import User


# ==================== Location Serializers ====================

class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = "__all__"
        read_only_fields = ['created_at', 'updated_at']


# ==================== LoaiXe Serializers ====================

class LoaiXeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoaiXe
        fields = "__all__"


# ==================== Xe Serializers ====================

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
    
    def validate(self, attrs):
        """Validate toàn bộ data, đặc biệt xử lý loai_xe nếu là string"""
        # Xử lý loai_xe nếu là string (ma_loai_xe) trong initial_data
        if 'loai_xe' in self.initial_data:
            loai_xe_value = self.initial_data.get('loai_xe')
            if isinstance(loai_xe_value, str) and loai_xe_value.strip():
                try:
                    loai_xe_obj = LoaiXe.objects.get(ma_loai=loai_xe_value.strip())
                    # Thay thế trong attrs để validation tiếp tục với object
                    attrs['loai_xe'] = loai_xe_obj
                except LoaiXe.DoesNotExist:
                    raise serializers.ValidationError({
                        'loai_xe': f"Không tìm thấy loại xe với mã '{loai_xe_value}'. Vui lòng kiểm tra lại mã loại xe."
                    })
                except LoaiXe.MultipleObjectsReturned:
                    raise serializers.ValidationError({
                        'loai_xe': f"Có nhiều loại xe với mã '{loai_xe_value}'. Vui lòng liên hệ quản trị viên."
                    })
        
        return attrs
    
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
        # Xử lý loai_xe nếu là string (ma_loai_xe)
        loai_xe_value = validated_data.get('loai_xe')
        if isinstance(loai_xe_value, str) and loai_xe_value.strip():
            try:
                loai_xe_obj = LoaiXe.objects.get(ma_loai=loai_xe_value)
                validated_data['loai_xe'] = loai_xe_obj
            except LoaiXe.DoesNotExist:
                raise serializers.ValidationError({
                    'loai_xe': f"Không tìm thấy loại xe với mã '{loai_xe_value}'. Vui lòng kiểm tra lại mã loại xe."
                })
            except LoaiXe.MultipleObjectsReturned:
                raise serializers.ValidationError({
                    'loai_xe': f"Có nhiều loại xe với mã '{loai_xe_value}'. Vui lòng liên hệ quản trị viên."
                })
        elif loai_xe_value is None:
            raise serializers.ValidationError({
                'loai_xe': 'Loại xe là bắt buộc.'
            })
        
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
        # Xử lý loai_xe nếu là string (ma_loai_xe)
        loai_xe_value = validated_data.get('loai_xe')
        if isinstance(loai_xe_value, str) and loai_xe_value.strip():
            try:
                loai_xe_obj = LoaiXe.objects.get(ma_loai=loai_xe_value)
                validated_data['loai_xe'] = loai_xe_obj
            except LoaiXe.DoesNotExist:
                raise serializers.ValidationError({
                    'loai_xe': f"Không tìm thấy loại xe với mã '{loai_xe_value}'. Vui lòng kiểm tra lại mã loại xe."
                })
            except LoaiXe.MultipleObjectsReturned:
                raise serializers.ValidationError({
                    'loai_xe': f"Có nhiều loại xe với mã '{loai_xe_value}'. Vui lòng liên hệ quản trị viên."
                })
        
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


# ==================== Review Serializers ====================

class UserReviewSerializer(serializers.ModelSerializer):
    """Serializer cho user trong review"""
    avatar_url = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "email", "avatar_url"]
        read_only_fields = ["avatar_url"]
    
    def get_avatar_url(self, obj):
        """Trả về avatar URL từ profile"""
        try:
            if hasattr(obj, "profile") and obj.profile:
                # Ưu tiên 1: Avatar URL từ OAuth provider
                if obj.profile.avatar_url:
                    return obj.profile.avatar_url
                
                # Ưu tiên 2: Avatar từ file upload
                if obj.profile.avatar:
                    request = self.context.get("request")
                    if request:
                        return request.build_absolute_uri(obj.profile.avatar.url)
                    return obj.profile.avatar.url
        except Exception:
            pass
        return None


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


# ==================== CarImage Serializers ====================

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


# ==================== BlogPost Serializers ====================

class BlogPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogPost
        fields = "__all__"
