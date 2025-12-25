"""
API views cho các utilities: kiểm tra xung đột, tính giá, validate coupon
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime
from orders.utils import check_schedule_conflict, calculate_rental_price, release_expired_reservations
from orders.models import Coupon
from products.models import Xe
import requests
import logging

logger = logging.getLogger(__name__)


@api_view(["POST"])
@permission_classes([AllowAny])
def check_schedule_conflict_api(request):
    """
    API kiểm tra xung đột lịch đặt
    
    Body:
    {
        "xe_id": "X001",
        "start_date": "2025-01-01",
        "end_date": "2025-01-05",
        "start_time": "08:00:00",  # optional
        "end_time": "18:00:00",    # optional
        "exclude_order_id": 123    # optional, khi update order
    }
    """
    xe_id = request.data.get("xe_id")
    start_date = request.data.get("start_date")
    end_date = request.data.get("end_date")
    start_time = request.data.get("start_time")
    end_time = request.data.get("end_time")
    exclude_order_id = request.data.get("exclude_order_id")
    
    if not xe_id or not start_date or not end_date:
        return Response(
            {"detail": "Thiếu xe_id, start_date hoặc end_date."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Parse dates
    try:
        if isinstance(start_date, str):
            start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
        if isinstance(end_date, str):
            end_date = datetime.strptime(end_date, "%Y-%m-%d").date()
        if start_time and isinstance(start_time, str):
            start_time = datetime.strptime(start_time, "%H:%M:%S").time()
        if end_time and isinstance(end_time, str):
            end_time = datetime.strptime(end_time, "%H:%M:%S").time()
    except ValueError as e:
        return Response(
            {"detail": f"Định dạng ngày/giờ không hợp lệ: {str(e)}"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Kiểm tra xe tồn tại
    try:
        xe = Xe.objects.get(pk=xe_id)
    except Xe.DoesNotExist:
        return Response(
            {"detail": f"Xe {xe_id} không tồn tại."},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Kiểm tra xung đột
    has_conflict, conflicting_orders = check_schedule_conflict(
        xe_id, start_date, end_date, start_time, end_time, exclude_order_id
    )
    
    return Response({
        "has_conflict": has_conflict,
        "conflicting_orders": [
            {
                "id": o.id,
                "start_date": str(o.start_date),
                "end_date": str(o.end_date),
                "status": o.status
            }
            for o in conflicting_orders
        ],
        "message": "Có xung đột lịch đặt" if has_conflict else "Không có xung đột"
    })


@api_view(["POST"])
@permission_classes([AllowAny])
def calculate_price_api(request):
    """
    API tính giá thuê xe chi tiết
    
    Body:
    {
        "xe_id": "X001",
        "start_date": "2025-01-01",
        "end_date": "2025-01-05",
        "start_time": "08:00:00",  # optional
        "end_time": "18:00:00",    # optional
        "pickup_location": "Hà Nội",
        "return_location": "Hồ Chí Minh",
        "delivery_address": "123 Đường ABC",  # optional
        "coupon_code": "DISCOUNT10"  # optional
    }
    """
    xe_id = request.data.get("xe_id")
    start_date = request.data.get("start_date")
    end_date = request.data.get("end_date")
    start_time = request.data.get("start_time")
    end_time = request.data.get("end_time")
    pickup_location = request.data.get("pickup_location", "")
    return_location = request.data.get("return_location", "")
    delivery_address = request.data.get("delivery_address", "")
    coupon_code = request.data.get("coupon_code", "").strip()
    
    if not xe_id or not start_date or not end_date:
        return Response(
            {"detail": "Thiếu xe_id, start_date hoặc end_date."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Parse dates
    try:
        if isinstance(start_date, str):
            start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
        if isinstance(end_date, str):
            end_date = datetime.strptime(end_date, "%Y-%m-%d").date()
        if start_time and isinstance(start_time, str):
            start_time = datetime.strptime(start_time, "%H:%M:%S").time()
        if end_time and isinstance(end_time, str):
            end_time = datetime.strptime(end_time, "%H:%M:%S").time()
    except ValueError as e:
        return Response(
            {"detail": f"Định dạng ngày/giờ không hợp lệ: {str(e)}"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Kiểm tra xe tồn tại
    try:
        xe = Xe.objects.get(pk=xe_id)
    except Xe.DoesNotExist:
        return Response(
            {"detail": f"Xe {xe_id} không tồn tại."},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Kiểm tra coupon
    coupon = None
    if coupon_code:
        try:
            coupon = Coupon.objects.get(code=coupon_code.upper())
            if not coupon.is_valid():
                return Response(
                    {"detail": "Mã coupon không hợp lệ hoặc đã hết hạn."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Coupon.DoesNotExist:
            return Response(
                {"detail": "Mã coupon không tồn tại."},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    # Tính giá
    price_info = calculate_rental_price(
        xe, start_date, end_date, start_time, end_time,
        pickup_location, return_location, delivery_address, coupon
    )
    
    return Response({
        "xe_id": xe_id,
        "xe_name": xe.ten_xe,
        "rental_days": price_info['rental_days'],
        "rental_hours": price_info['rental_hours'],
        "base_price": float(price_info['base_price']),
        "delivery_fee": float(price_info['delivery_fee']),
        "pickup_fee": float(price_info['pickup_fee']),
        "additional_fee": float(price_info['additional_fee']),
        "discount_amount": float(price_info['discount_amount']),
        "subtotal": float(price_info['base_price'] + price_info['delivery_fee'] + price_info['pickup_fee'] + price_info['additional_fee']),
        "total_price": float(price_info['total_price']),
        "coupon_applied": coupon_code.upper() if coupon_code else None
    })


@api_view(["POST"])
@permission_classes([AllowAny])
def validate_coupon_api(request):
    """
    API validate coupon
    
    Body:
    {
        "coupon_code": "DISCOUNT10",
        "order_total": 1000000  # optional, để kiểm tra min_order_value
    }
    """
    coupon_code = request.data.get("coupon_code", "").strip()
    order_total = request.data.get("order_total", 0)
    
    # Convert order_total to Decimal
    from decimal import Decimal
    try:
        order_total = Decimal(str(order_total))
    except (ValueError, TypeError):
        order_total = Decimal(0)
    
    if not coupon_code:
        return Response(
            {"detail": "Thiếu coupon_code."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        coupon = Coupon.objects.get(code=coupon_code.upper())
    except Coupon.DoesNotExist:
        return Response({
            "valid": False,
            "message": "Mã coupon không tồn tại."
        })
    
    if not coupon.is_valid():
        return Response({
            "valid": False,
            "message": "Mã coupon không hợp lệ hoặc đã hết hạn."
        })
    
    if order_total > 0 and order_total < coupon.min_order_value:
        return Response({
            "valid": False,
            "message": f"Đơn hàng tối thiểu {coupon.min_order_value:,.0f} VNĐ để sử dụng coupon này."
        })
    
    # Tính discount mẫu
    sample_discount = coupon.calculate_discount(order_total if order_total > 0 else 1000000)
    
    return Response({
        "valid": True,
        "coupon": {
            "code": coupon.code,
            "description": coupon.description,
            "discount_type": coupon.discount_type,
            "discount_value": float(coupon.discount_value),
            "min_order_value": float(coupon.min_order_value),
            "max_discount": float(coupon.max_discount) if coupon.max_discount else None,
        },
        "sample_discount": float(sample_discount) if order_total > 0 else None,
        "message": "Mã coupon hợp lệ."
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def release_expired_reservations_api(request):
    """
    API để release các order hết hạn giữ chỗ (thường được gọi bởi cron job)
    Chỉ admin mới có thể gọi
    """
    if not request.user.is_staff:
        return Response(
            {"detail": "Chỉ admin mới có thể thực hiện."},
            status=status.HTTP_403_FORBIDDEN
        )
    
    count = release_expired_reservations()
    
    return Response({
        "message": f"Đã giải phóng {count} order hết hạn giữ chỗ.",
        "released_count": count
    })


@api_view(["POST"])
@permission_classes([AllowAny])
def geocode_address_api(request):
    """
    API proxy để geocode địa chỉ (tránh CORS)
    
    Body:
    {
        "address": "Hà Nội, Việt Nam"
    }
    """
    address = request.data.get("address", "").strip()
    
    if not address:
        return Response(
            {"detail": "Thiếu địa chỉ."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Thử OpenRouteService trước (nếu có API key)
        ors_api_key = ""  # Có thể lấy từ settings nếu có
        if ors_api_key:
            url = "https://api.openrouteservice.org/v2/geocoding/search"
            params = {
                "api_key": ors_api_key,
                "text": address,
                "boundary.country": "VN"
            }
            
            try:
                response = requests.get(url, params=params, timeout=10)
                response.raise_for_status()
                data = response.json()
                
                if data.get("features") and len(data["features"]) > 0:
                    feature = data["features"][0]
                    coords = feature["geometry"]["coordinates"]  # [lng, lat]
                    
                    return Response({
                        "lat": coords[1],
                        "lng": coords[0],
                        "formatted": feature["properties"].get("label", address),
                    })
            except requests.exceptions.RequestException:
                # Fallback to Nominatim nếu OpenRouteService fail
                pass
        
        # Fallback: Sử dụng Nominatim (OpenStreetMap) - miễn phí, không cần API key
        # Giới hạn tìm kiếm trong khu vực Việt Nam bằng bbox
        # Bbox Việt Nam: [102.144, 8.559, 109.465, 23.393] (min_lng, min_lat, max_lng, max_lat)
        url = "https://nominatim.openstreetmap.org/search"
        params = {
            "q": address + ", Vietnam",
            "format": "json",
            "limit": 1,
            "addressdetails": 1,
            "countrycodes": "vn",  # Chỉ tìm trong Việt Nam
            "bounded": "1",  # Chỉ tìm trong bbox
            "viewbox": "102.144,23.393,109.465,8.559",  # viewbox format: left,top,right,bottom
        }
        headers = {
            "User-Agent": "MORENT-CarRental/1.0"  # Nominatim yêu cầu User-Agent
        }
        
        response = requests.get(url, params=params, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if data and len(data) > 0:
            result = data[0]
            return Response({
                "lat": float(result["lat"]),
                "lng": float(result["lon"]),
                "formatted": result.get("display_name", address),
            })
        
        return Response(
            {"detail": "Không tìm thấy địa chỉ."},
            status=status.HTTP_404_NOT_FOUND
        )
    except requests.exceptions.RequestException as e:
        logger.error(f"Geocoding API error: {str(e)}")
        return Response(
            {"detail": f"Lỗi khi geocode địa chỉ: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["POST"])
@permission_classes([AllowAny])
def calculate_distance_api(request):
    """
    API proxy để tính khoảng cách giữa 2 điểm (tránh CORS)
    
    Body:
    {
        "lat1": 21.0285,
        "lng1": 105.8542,
        "lat2": 10.8231,
        "lng2": 106.6297
    }
    """
    try:
        lat1 = float(request.data.get("lat1"))
        lng1 = float(request.data.get("lng1"))
        lat2 = float(request.data.get("lat2"))
        lng2 = float(request.data.get("lng2"))
    except (ValueError, TypeError):
        return Response(
            {"detail": "Tọa độ không hợp lệ."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Sử dụng OSRM (Open Source Routing Machine) - miễn phí, không cần API key
        # Public instance: http://router.project-osrm.org
        url = "http://router.project-osrm.org/route/v1/driving/{lng1},{lat1};{lng2},{lat2}"
        url = url.format(lng1=lng1, lat1=lat1, lng2=lng2, lat2=lat2)
        params = {
            "overview": "full",  # Lấy full geometry để vẽ route
            "geometries": "geojson",  # Format GeoJSON
            "steps": "false"  # Không cần chi tiết từng bước
        }
        
        try:
            response = requests.get(url, params=params, timeout=15)
            response.raise_for_status()
            data = response.json()
            
            if data.get("code") == "Ok" and data.get("routes") and len(data["routes"]) > 0:
                route = data["routes"][0]
                distance_m = route["distance"]  # OSRM trả về mét
                distance_km = round(distance_m / 1000, 2)
                duration_seconds = round(route["duration"])  # OSRM trả về giây
                
                # Lấy geometry từ OSRM
                geometry = route.get("geometry")
                
                return Response({
                    "distance": distance_km,
                    "duration": duration_seconds,
                    "geometry": geometry,  # GeoJSON format từ OSRM
                })
        except requests.exceptions.RequestException as e:
            logger.warning(f"OSRM API error: {str(e)}, falling back to Haversine")
            # Fallback to Haversine nếu OSRM fail
            pass
        
        # Fallback: Tính khoảng cách bằng Haversine (đường chim bay)
        from math import radians, cos, sin, asin, sqrt
        
        def haversine_distance(lat1, lon1, lat2, lon2):
            """Tính khoảng cách giữa 2 điểm bằng Haversine formula (km)"""
            R = 6371  # Bán kính Trái Đất (km)
            lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
            dlat = lat2 - lat1
            dlon = lon2 - lon1
            a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
            c = 2 * asin(sqrt(a))
            return R * c
        
        distance_km = round(haversine_distance(lat1, lng1, lat2, lng2), 2)
        # Ước tính thời gian: giả sử tốc độ trung bình 60 km/h
        duration_seconds = int((distance_km / 60) * 3600)
        
        return Response({
            "distance": distance_km,
            "duration": duration_seconds,
            "geometry": None,  # Không có route geometry với Haversine
        })
    except Exception as e:
        logger.error(f"Distance API error: {str(e)}")
        return Response(
            {"detail": f"Lỗi khi tính khoảng cách: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["POST"])
@permission_classes([AllowAny])
def calculate_distance_from_addresses_api(request):
    """
    API proxy để tính khoảng cách từ 2 địa chỉ (tránh CORS)
    
    Body:
    {
        "address1": "Hà Nội, Việt Nam",
        "address2": "Hồ Chí Minh, Việt Nam"
    }
    """
    address1 = request.data.get("address1", "").strip()
    address2 = request.data.get("address2", "").strip()
    
    if not address1 or not address2:
        return Response(
            {"detail": "Thiếu địa chỉ."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Geocode cả 2 địa chỉ song song
        geocode_url = "https://nominatim.openstreetmap.org/search"
        headers = {
            "User-Agent": "MORENT-CarRental/1.0"
        }
        
        # Geocode địa chỉ 1 - Giới hạn trong Việt Nam
        params1 = {
            "q": address1 + ", Vietnam",
            "format": "json",
            "limit": 1,
            "countrycodes": "vn",  # Chỉ tìm trong Việt Nam
            "bounded": "1",
            "viewbox": "102.144,23.393,109.465,8.559",  # Bbox Việt Nam
        }
        response1 = requests.get(geocode_url, params=params1, headers=headers, timeout=10)
        response1.raise_for_status()
        data1 = response1.json()
        
        if not data1 or len(data1) == 0:
            return Response(
                {"detail": f"Không tìm thấy địa chỉ: {address1}"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        coords1 = {
            "lat": float(data1[0]["lat"]),
            "lng": float(data1[0]["lon"])
        }
        address1_formatted = data1[0].get("display_name", address1)
        
        # Geocode địa chỉ 2 - Giới hạn trong Việt Nam
        params2 = {
            "q": address2 + ", Vietnam",
            "format": "json",
            "limit": 1,
            "countrycodes": "vn",  # Chỉ tìm trong Việt Nam
            "bounded": "1",
            "viewbox": "102.144,23.393,109.465,8.559",  # Bbox Việt Nam
        }
        response2 = requests.get(geocode_url, params=params2, headers=headers, timeout=10)
        response2.raise_for_status()
        data2 = response2.json()
        
        if not data2 or len(data2) == 0:
            return Response(
                {"detail": f"Không tìm thấy địa chỉ: {address2}"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        coords2 = {
            "lat": float(data2[0]["lat"]),
            "lng": float(data2[0]["lon"])
        }
        address2_formatted = data2[0].get("display_name", address2)
        
        # Kiểm tra tọa độ có trong khu vực Việt Nam không
        # Bbox Việt Nam: [102.144, 8.559, 109.465, 23.393]
        if not (102.144 <= coords1["lng"] <= 109.465 and 8.559 <= coords1["lat"] <= 23.393) or \
           not (102.144 <= coords2["lng"] <= 109.465 and 8.559 <= coords2["lat"] <= 23.393):
            return Response(
                {"detail": "Địa chỉ nằm ngoài khu vực Việt Nam."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Tính khoảng cách đường đi thực tế bằng OSRM
        url = "http://router.project-osrm.org/route/v1/driving/{lng1},{lat1};{lng2},{lat2}"
        url = url.format(
            lng1=coords1["lng"], 
            lat1=coords1["lat"],
            lng2=coords2["lng"], 
            lat2=coords2["lat"]
        )
        params = {
            "overview": "full",  # Lấy full geometry để vẽ route
            "geometries": "geojson",  # Format GeoJSON
            "steps": "false"  # Không cần chi tiết từng bước
        }
        
        try:
            response = requests.get(url, params=params, timeout=15)
            response.raise_for_status()
            data = response.json()
            
            if data.get("code") == "Ok" and data.get("routes") and len(data["routes"]) > 0:
                route = data["routes"][0]
                distance_m = route["distance"]  # OSRM trả về mét
                distance_km = round(distance_m / 1000, 2)
                duration_seconds = round(route["duration"])  # OSRM trả về giây
                geometry = route.get("geometry")
                
                return Response({
                    "distance": distance_km,
                    "duration": duration_seconds,
                    "geometry": geometry,  # GeoJSON format từ OSRM
                    "coords1": coords1,
                    "coords2": coords2,
                    "address1": address1_formatted,
                    "address2": address2_formatted,
                })
        except requests.exceptions.RequestException as e:
            logger.warning(f"OSRM API error: {str(e)}, falling back to Haversine")
            # Fallback to Haversine nếu OSRM fail
            pass
        
        # Fallback: Tính khoảng cách bằng Haversine (đường chim bay)
        from math import radians, cos, sin, asin, sqrt
        
        def haversine_distance(lat1, lon1, lat2, lon2):
            """Tính khoảng cách giữa 2 điểm bằng Haversine formula (km)"""
            R = 6371  # Bán kính Trái Đất (km)
            lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
            dlat = lat2 - lat1
            dlon = lon2 - lon1
            a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
            c = 2 * asin(sqrt(a))
            return R * c
        
        distance_km = round(haversine_distance(
            coords1["lat"], coords1["lng"],
            coords2["lat"], coords2["lng"]
        ), 2)
        
        # Ước tính thời gian: giả sử tốc độ trung bình 60 km/h
        duration_seconds = int((distance_km / 60) * 3600)
        
        return Response({
            "distance": distance_km,
            "duration": duration_seconds,
            "geometry": None,  # Không có route geometry với Haversine
            "coords1": coords1,
            "coords2": coords2,
            "address1": address1_formatted,
            "address2": address2_formatted,
        })
    except requests.exceptions.RequestException as e:
        logger.error(f"Distance from addresses API error: {str(e)}")
        return Response(
            {"detail": f"Lỗi khi tính khoảng cách: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    except Exception as e:
        logger.error(f"Distance from addresses API error: {str(e)}")
        return Response(
            {"detail": f"Lỗi khi tính khoảng cách: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

