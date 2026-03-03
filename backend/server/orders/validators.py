"""
Custom validators cho orders app
"""
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.core.validators import RegexValidator
import re


def validate_vietnamese_phone(value):
    """
    Validate số điện thoại Việt Nam
    Hỗ trợ: 0xxxxxxxxx, +84xxxxxxxxx, 84xxxxxxxxx
    """
    if not value:
        return
    
    # Loại bỏ khoảng trắng
    value = value.strip()
    
    # Pattern cho số điện thoại Việt Nam
    patterns = [
        r'^0[3-9]\d{8}$',      # 03x, 04x, 05x, 07x, 08x, 09x
        r'^\+84[3-9]\d{8}$',   # +84...
        r'^84[3-9]\d{8}$',     # 84...
    ]
    
    if not any(re.match(pattern, value) for pattern in patterns):
        raise ValidationError(
            'Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam (VD: 0912345678)',
            code='invalid_phone'
        )


def validate_future_date(value):
    """Validate ngày phải là ngày tương lai hoặc hôm nay"""
    if value is None:
        return
    
    today = timezone.now().date()
    if value < today:
        raise ValidationError(
            'Ngày phải là ngày hôm nay hoặc ngày trong tương lai.',
            code='past_date'
        )


def validate_future_datetime(value):
    """Validate datetime phải là thời gian tương lai hoặc hiện tại"""
    if value is None:
        return
    
    now = timezone.now()
    if value < now:
        raise ValidationError(
            'Thời gian phải là thời điểm hiện tại hoặc tương lai.',
            code='past_datetime'
        )


def validate_positive_number(value):
    """Validate số phải lớn hơn 0"""
    if value is None:
        return
    
    if value <= 0:
        raise ValidationError(
            'Giá trị phải lớn hơn 0.',
            code='not_positive'
        )


def validate_non_negative_number(value):
    """Validate số phải lớn hơn hoặc bằng 0"""
    if value is None:
        return
    
    if value < 0:
        raise ValidationError(
            'Giá trị không được âm.',
            code='negative'
        )


def validate_min_max_range(value, min_val=None, max_val=None, field_name='Giá trị'):
    """Validate giá trị nằm trong khoảng cho phép"""
    if value is None:
        return
    
    if min_val is not None and value < min_val:
        raise ValidationError(
            f'{field_name} phải lớn hơn hoặc bằng {min_val}.',
            code='below_minimum'
        )
    
    if max_val is not None and value > max_val:
        raise ValidationError(
            f'{field_name} phải nhỏ hơn hoặc bằng {max_val}.',
            code='above_maximum'
        )


def validate_date_range(start_date, end_date, allow_same_day=True):
    """Validate ngày bắt đầu và kết thúc hợp lệ"""
    if start_date is None or end_date is None:
        return
    
    if allow_same_day:
        if end_date < start_date:
            raise ValidationError(
                'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.',
                code='invalid_date_range'
            )
    else:
        if end_date <= start_date:
            raise ValidationError(
                'Ngày kết thúc phải lớn hơn ngày bắt đầu.',
                code='invalid_date_range'
            )


def validate_order_quantity(value):
    """Validate số lượng sản phẩm trong đơn hàng"""
    if value is None:
        return
    
    if not isinstance(value, int):
        raise ValidationError(
            'Số lượng phải là số nguyên.',
            code='invalid_type'
        )
    
    if value <= 0:
        raise ValidationError(
            'Số lượng phải lớn hơn 0.',
            code='not_positive'
        )
    
    if value > 100:  # Giới hạn tối đa
        raise ValidationError(
            'Số lượng không được vượt quá 100.',
            code='exceeds_maximum'
        )


def validate_address_length(value, min_length=10, max_length=500):
    """Validate địa chỉ có độ dài hợp lệ"""
    if not value:
        return
    
    value = value.strip()
    
    if len(value) < min_length:
        raise ValidationError(
            f'Địa chỉ phải có ít nhất {min_length} ký tự.',
            code='too_short'
        )
    
    if len(value) > max_length:
        raise ValidationError(
            f'Địa chỉ không được vượt quá {max_length} ký tự.',
            code='too_long'
        )


def validate_future_date_for_rental(value):
    """
    Validate ngày thuê xe phải là hôm nay hoặc tương lai
    Cho phép đặt trước tối đa 90 ngày
    """
    if value is None:
        return
    
    today = timezone.now().date()
    max_advance_days = 90
    
    if value < today:
        raise ValidationError(
            'Ngày thuê xe phải là ngày hôm nay hoặc ngày trong tương lai.',
            code='past_date'
        )
    
    if value > today + timezone.timedelta(days=max_advance_days):
        raise ValidationError(
            f'Không thể đặt trước quá {max_advance_days} ngày.',
            code='too_far_advance'
        )


def validate_time_format(value):
    """Validate định dạng thời gian (HH:MM)"""
    if not value:
        return
    
    pattern = r'^([01]\d|2[0-3]):([0-5]\d)$'
    if not re.match(pattern, value):
        raise ValidationError(
            'Định dạng giờ không hợp lệ. Vui lòng sử dụng định dạng HH:MM (24 giờ).',
            code='invalid_time_format'
        )


def validate_payment_method(value, allowed_methods=None):
    """Validate phương thức thanh toán"""
    if not value:
        return
    
    if allowed_methods is None:
        allowed_methods = ['cash', 'momo', 'vnpay', 'bank_transfer', 'credit_card']
    
    if value not in allowed_methods:
        raise ValidationError(
            f'Phương thức thanh toán không hợp lệ. Các phương thức được chấp nhận: {", ".join(allowed_methods)}.',
            code='invalid_payment_method'
        )
