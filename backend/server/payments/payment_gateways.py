"""
Payment Gateway Services cho Momo, ZaloPay, VNPay
Đã tích hợp API thực tế cho production environment
"""
import hashlib
import hmac
import json
import requests
import base64
import io
from datetime import datetime
from decimal import Decimal
from django.conf import settings

# Import cryptography cho RSA signature verification (MoMo)
try:
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.asymmetric import padding
    from cryptography.hazmat.primitives import serialization
    CRYPTOGRAPHY_AVAILABLE = True
except ImportError:
    CRYPTOGRAPHY_AVAILABLE = False

# Import QR code generator (miễn phí, không cần API)
try:
    import qrcode
    QR_AVAILABLE = True
except ImportError:
    QR_AVAILABLE = False


def generate_qr_code_base64(data, size=256):
    """
    Tạo QR code từ data và trả về base64 image (MIỄN PHÍ, không cần API)
    
    Args:
        data: String hoặc dict chứa thông tin thanh toán
        size: Kích thước QR code (pixels)
    
    Returns:
        str: Base64 encoded image data URL (có thể dùng trực tiếp trong <img src="data:image/png;base64,...">)
    """
    if not QR_AVAILABLE:
        # Fallback: trả về URL placeholder nếu không có qrcode library
        return f"https://api.qrserver.com/v1/create-qr-code/?size={size}x{size}&data={data}"
    
    # Chuyển data thành string nếu là dict
    if isinstance(data, dict):
        data = json.dumps(data)
    
    # Tạo QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(str(data))
    qr.make(fit=True)
    
    # Tạo image
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Resize nếu cần
    if size != 256:
        img = img.resize((size, size))
    
    # Convert sang base64
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    img_str = base64.b64encode(buffer.getvalue()).decode()
    
    return f"data:image/png;base64,{img_str}"


class PaymentGatewayBase:
    """Base class cho các payment gateway"""
    
    def __init__(self, order, amount, return_url=None, ipn_url=None):
        self.order = order
        self.amount = int(amount)  # VNĐ
        self.return_url = return_url
        self.ipn_url = ipn_url
        # Kiểm tra mode development (tự động approve payment trong test)
        # Trong test environment, DEBUG thường False, nên check PAYMENT_DEV_MODE trực tiếp
        self.is_development = getattr(settings, 'PAYMENT_DEV_MODE', False)
    
    def create_payment(self):
        """Tạo payment request - Override trong subclass"""
        raise NotImplementedError
    
    def verify_payment(self, callback_data):
        """Verify payment callback - Override trong subclass"""
        raise NotImplementedError


class MoMoGateway(PaymentGatewayBase):
    """MoMo Payment Gateway"""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Lấy từ settings hoặc environment variables
        self.partner_code = getattr(settings, 'MOMO_PARTNER_CODE', 'MOMO_PARTNER_CODE')
        self.access_key = getattr(settings, 'MOMO_ACCESS_KEY', 'MOMO_ACCESS_KEY')
        self.secret_key = getattr(settings, 'MOMO_SECRET_KEY', 'MOMO_SECRET_KEY')

        # Chọn endpoint dựa trên môi trường
        is_production = getattr(settings, 'MOMO_PRODUCTION', False)
        self.endpoint = (
            'https://payment.momo.vn/v2/gateway/api/create' if is_production
            else 'https://test-payment.momo.vn/v2/gateway/api/create'
        )
    
    def create_payment(self):
        """Tạo payment request với MoMo"""
        # Trong development mode, trả về mock response thành công
        if self.is_development:
            order_id = f"DEV_ORDER_{self.order.id}_{int(datetime.now().timestamp())}"
            qr_data = {
                "type": "momo",
                "orderId": order_id,
                "amount": self.amount,
                "orderInfo": f"Thanh toan don hang {self.order.id}",
                "payment_url": f"https://test-payment.momo.vn/v2/gateway/api/create?orderId={order_id}",
                "dev_mode": True
            }
            qr_code = generate_qr_code_base64(qr_data, size=300)

            return {
                "success": True,
                "transaction_id": order_id,
                "payment_url": f"https://test-payment.momo.vn/v2/gateway/api/create?orderId={order_id}",
                "qr_code": qr_code,
                "deep_link": f"momo://app?action=pay&orderId={order_id}",
                "response_data": {"dev_mode": True, "mock_response": True}
            }

        order_id = f"ORDER_{self.order.id}_{int(datetime.now().timestamp())}"
        request_id = f"REQUEST_{self.order.id}_{int(datetime.now().timestamp())}"
        
        # Tạo raw signature
        raw_signature = (
            f"accessKey={self.access_key}&"
            f"amount={self.amount}&"
            f"extraData=&"
            f"ipnUrl={self.ipn_url or ''}&"
            f"orderId={order_id}&"
            f"orderInfo=Thanh toan don hang {self.order.id}&"
            f"partnerCode={self.partner_code}&"
            f"redirectUrl={self.return_url or ''}&"
            f"requestId={request_id}&"
            f"requestType=captureWallet"
        )
        
        signature = hmac.new(
            self.secret_key.encode(),
            raw_signature.encode(),
            hashlib.sha256
        ).hexdigest()
        
        data = {
            "partnerCode": self.partner_code,
            "partnerName": "Car Rental",
            "storeId": "MOMO_STORE",
            "requestId": request_id,
            "amount": str(self.amount),
            "orderId": order_id,
            "orderInfo": f"Thanh toan don hang {self.order.id}",
            "redirectUrl": self.return_url or "",
            "ipnUrl": self.ipn_url or "",
            "lang": "vi",
            "extraData": "",
            "requestType": "captureWallet",
            "signature": signature
        }

        try:
            # Gọi API MoMo thật
            headers = {
                'Content-Type': 'application/json',
            }
            response = requests.post(self.endpoint, json=data, headers=headers, timeout=30)
            response_data = response.json()

            # Kiểm tra response từ MoMo
            if response.status_code == 200 and response_data.get('resultCode') == 0:
                payment_url = response_data.get('payUrl', '')
                qr_code_url = response_data.get('qrCodeUrl', '')

                # Tạo QR code từ QR code URL của MoMo (nếu có)
                qr_code = None
                if qr_code_url:
                    # Download QR code từ MoMo và convert sang base64
                    qr_response = requests.get(qr_code_url, timeout=10)
                    if qr_response.status_code == 200:
                        qr_code = base64.b64encode(qr_response.content).decode()
                        qr_code = f"data:image/png;base64,{qr_code}"
                else:
                    # Fallback: tạo QR code từ payment URL
                    qr_data = {
                        "type": "momo",
                        "orderId": order_id,
                        "amount": self.amount,
                        "orderInfo": f"Thanh toan don hang {self.order.id}",
                        "payment_url": payment_url
                    }
                    qr_code = generate_qr_code_base64(qr_data, size=300)

                return {
                    "success": True,
                    "transaction_id": order_id,
                    "payment_url": payment_url,
                    "qr_code": qr_code,
                    "deep_link": f"momo://app?action=pay&orderId={order_id}",
                    "response_data": response_data  # Lưu raw response để debug
                }
            else:
                # MoMo trả về lỗi
                return {
                    "success": False,
                    "error_code": response_data.get('resultCode'),
                    "error_message": response_data.get('message', 'Unknown error'),
                    "response_data": response_data
                }

        except requests.exceptions.RequestException as e:
            # Network error
            return {
                "success": False,
                "error_code": "NETWORK_ERROR",
                "error_message": f"Không thể kết nối đến MoMo API: {str(e)}"
            }
        except Exception as e:
            # Unexpected error
            return {
                "success": False,
                "error_code": "INTERNAL_ERROR",
                "error_message": f"Lỗi không mong muốn: {str(e)}"
            }
    
    def verify_payment(self, callback_data):
        """Verify MoMo callback"""
        # Trong development mode, tự động approve
        if self.is_development:
            return {
                "success": True,
                "transaction_id": callback_data.get("orderId") or f"DEV_{self.order.id}",
                "amount": callback_data.get("amount") or self.amount,
            }

        # Production mode: verify signature thực tế
        if not CRYPTOGRAPHY_AVAILABLE:
            return {
                "success": False,
                "error": "Cryptography library not available for signature verification"
            }

        try:
            # Lấy public key từ settings
            public_key = getattr(settings, 'MOMO_PUBLIC_KEY', None)
            if not public_key:
                return {
                    "success": False,
                    "error": "MoMo public key not configured"
                }

            # Tạo raw signature string từ callback data
            signature = callback_data.get("signature", "")
            if not signature:
                return {
                    "success": False,
                    "error": "Missing signature in callback"
                }

            # Tạo raw data để verify (theo thứ tự MoMo quy định)
            raw_data = (
                f"accessKey={callback_data.get('accessKey', '')}&"
                f"amount={callback_data.get('amount', '')}&"
                f"extraData={callback_data.get('extraData', '')}&"
                f"message={callback_data.get('message', '')}&"
                f"orderId={callback_data.get('orderId', '')}&"
                f"orderInfo={callback_data.get('orderInfo', '')}&"
                f"orderType={callback_data.get('orderType', '')}&"
                f"partnerCode={callback_data.get('partnerCode', '')}&"
                f"payType={callback_data.get('payType', '')}&"
                f"requestId={callback_data.get('requestId', '')}&"
                f"responseTime={callback_data.get('responseTime', '')}&"
                f"resultCode={callback_data.get('resultCode', '')}&"
                f"transId={callback_data.get('transId', '')}"
            )

            # Load public key
            public_key_obj = serialization.load_pem_public_key(public_key.encode())

            # Decode signature
            signature_bytes = base64.b64decode(signature)

            # Verify signature
            public_key_obj.verify(
                signature_bytes,
                raw_data.encode(),
                padding.PKCS1v15(),
                hashes.SHA256()
            )

            # Kiểm tra resultCode
            result_code = callback_data.get("resultCode")
            if result_code == 0:  # Thành công
                return {
                    "success": True,
                    "transaction_id": callback_data.get("orderId"),
                    "amount": callback_data.get("amount"),
                    "trans_id": callback_data.get("transId"),
                    "result_code": result_code
                }
            else:
                return {
                    "success": False,
                    "error": f"Payment failed with result code: {result_code}",
                    "result_code": result_code
                }

        except Exception as e:
            return {
                "success": False,
                "error": f"Signature verification failed: {str(e)}"
            }


class ZaloPayGateway(PaymentGatewayBase):
    """ZaloPay Payment Gateway"""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.app_id = getattr(settings, 'ZALOPAY_APP_ID', 'ZALOPAY_APP_ID')
        self.key1 = getattr(settings, 'ZALOPAY_KEY1', 'ZALOPAY_KEY1')
        self.key2 = getattr(settings, 'ZALOPAY_KEY2', 'ZALOPAY_KEY2')

        # Chọn endpoint dựa trên môi trường
        is_production = getattr(settings, 'ZALOPAY_PRODUCTION', False)
        self.endpoint = (
            'https://openapi.zalopay.vn/v2/create' if is_production
            else 'https://sb-openapi.zalopay.vn/v2/create'
        )
    
    def create_payment(self):
        """Tạo payment request với ZaloPay"""
        # Trong development mode, trả về mock response thành công
        if self.is_development:
            app_trans_id = f"DEV_{int(datetime.now().timestamp())}_{self.order.id}"
            qr_data = {
                "type": "zalopay",
                "app_trans_id": app_trans_id,
                "amount": self.amount,
                "orderInfo": f"Thanh toan don hang {self.order.id}",
                "payment_url": f"https://sb-openapi.zalopay.vn/v2/create?app_trans_id={app_trans_id}",
                "dev_mode": True
            }
            qr_code = generate_qr_code_base64(qr_data, size=300)

            return {
                "success": True,
                "transaction_id": app_trans_id,
                "payment_url": f"https://sb-openapi.zalopay.vn/v2/create?app_trans_id={app_trans_id}",
                "qr_code": qr_code,
                "deep_link": f"zalopay://app?action=pay&app_trans_id={app_trans_id}",
                "response_data": {"dev_mode": True, "mock_response": True}
            }

        order_id = f"ORDER_{self.order.id}_{int(datetime.now().timestamp())}"
        
        # Tạo embeddata
        embed_data = {
            "redirecturl": self.return_url or ""
        }
        
        # Tạo items
        items = [{
            "itemid": str(self.order.id),
            "itemname": f"Thue xe {self.order.items.first().xe.ten_xe if self.order.items.exists() else 'N/A'}",
            "itemprice": self.amount,
            "itemquantity": 1
        }]
        
        # Tạo apptransid
        app_trans_id = f"{int(datetime.now().timestamp())}_{self.order.id}"
        
        # Tạo mac
        mac_data = f"{self.app_id}|{app_trans_id}|{self.order.user.id if self.order.user else 'guest'}|{self.amount}|{int(datetime.now().timestamp())}|{json.dumps(embed_data)}|{json.dumps(items)}"
        mac = hmac.new(self.key1.encode(), mac_data.encode(), hashlib.sha256).hexdigest()
        
        data = {
            "app_id": self.app_id,
            "app_user": str(self.order.user.id if self.order.user else 'guest'),
            "app_time": int(datetime.now().timestamp() * 1000),
            "amount": self.amount,
            "app_trans_id": app_trans_id,
            "embed_data": json.dumps(embed_data),
            "items": json.dumps(items),
            "description": f"Thanh toan don hang {self.order.id}",
            "bank_code": "zalopayapp",
            "mac": mac
        }

        try:
            # Gọi API ZaloPay thật
            headers = {
                'Content-Type': 'application/json',
            }
            response = requests.post(self.endpoint, json=data, headers=headers, timeout=30)
            response_data = response.json()

            # Kiểm tra response từ ZaloPay
            if response.status_code == 200 and response_data.get('return_code') == 1:
                payment_url = response_data.get('order_url', '')

                # Tạo QR code từ payment URL (ZaloPay không cung cấp QR code trực tiếp)
                qr_data = {
                    "type": "zalopay",
                    "app_trans_id": app_trans_id,
                    "amount": self.amount,
                    "orderInfo": f"Thanh toan don hang {self.order.id}",
                    "payment_url": payment_url
                }
                qr_code = generate_qr_code_base64(qr_data, size=300)

                return {
                    "success": True,
                    "transaction_id": app_trans_id,
                    "payment_url": payment_url,
                    "qr_code": qr_code,
                    "deep_link": f"zalopay://app?action=pay&app_trans_id={app_trans_id}",
                    "response_data": response_data  # Lưu raw response để debug
                }
            else:
                # ZaloPay trả về lỗi
                return {
                    "success": False,
                    "error_code": response_data.get('return_code'),
                    "error_message": response_data.get('return_message', 'Unknown error'),
                    "response_data": response_data
                }

        except requests.exceptions.RequestException as e:
            # Network error
            return {
                "success": False,
                "error_code": "NETWORK_ERROR",
                "error_message": f"Không thể kết nối đến ZaloPay API: {str(e)}"
            }
        except Exception as e:
            # Unexpected error
            return {
                "success": False,
                "error_code": "INTERNAL_ERROR",
                "error_message": f"Lỗi không mong muốn: {str(e)}"
            }
    
    def verify_payment(self, callback_data):
        """Verify ZaloPay callback"""
        # Trong development mode, tự động approve
        if self.is_development:
            return {
                "success": True,
                "transaction_id": callback_data.get("app_trans_id") or f"DEV_{self.order.id}",
                "amount": callback_data.get("amount") or self.amount,
            }

        # Production mode: verify signature thực tế
        try:
            # Kiểm tra callback có hợp lệ không
            if not callback_data.get("app_id") or callback_data.get("app_id") != self.app_id:
                return {
                    "success": False,
                    "error": "Invalid app_id in callback"
                }

            # Lấy signature từ callback
            signature = callback_data.get("mac", "")
            if not signature:
                return {
                    "success": False,
                    "error": "Missing signature in callback"
                }

            # Tạo raw data để verify (theo thứ tự ZaloPay quy định)
            raw_data = (
                f"{callback_data.get('app_id', '')}|"
                f"{callback_data.get('app_trans_id', '')}|"
                f"{callback_data.get('zp_trans_token', '')}|"
                f"{callback_data.get('amount', '')}|"
                f"{callback_data.get('server_time', '')}"
            )

            # Tính expected signature
            expected_mac = hmac.new(
                self.key2.encode(),
                raw_data.encode(),
                hashlib.sha256
            ).hexdigest()

            # So sánh signature
            if signature != expected_mac:
                return {
                    "success": False,
                    "error": "Invalid signature"
                }

            # Kiểm tra zp_trans_token (nếu có)
            zp_trans_token = callback_data.get("zp_trans_token", "")
            if zp_trans_token:
                return {
                    "success": True,
                    "transaction_id": callback_data.get("app_trans_id"),
                    "amount": callback_data.get("amount"),
                    "zp_trans_token": zp_trans_token,
                    "server_time": callback_data.get("server_time")
                }
            else:
                return {
                    "success": False,
                    "error": "Missing zp_trans_token"
                }

        except Exception as e:
            return {
                "success": False,
                "error": f"Signature verification failed: {str(e)}"
            }


class VNPayGateway(PaymentGatewayBase):
    """VNPay Payment Gateway"""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.tmn_code = getattr(settings, 'VNPAY_TMN_CODE', 'VNPAY_TMN_CODE')
        self.secret_key = getattr(settings, 'VNPAY_SECRET_KEY', 'VNPAY_SECRET_KEY')

        # Chọn endpoint dựa trên môi trường
        is_production = getattr(settings, 'VNPAY_PRODUCTION', False)
        self.endpoint = (
            'https://pay.vnpay.vn/vpcpay.html' if is_production
            else 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'
        )
    
    def create_payment(self):
        """Tạo payment request với VNPay"""
        # Trong development mode, trả về mock response thành công
        if self.is_development:
            order_id = f"DEV_{self.order.id}_{int(datetime.now().timestamp())}"
            payment_url = f"https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_TxnRef={order_id}"

            qr_data = {
                "type": "vnpay",
                "orderId": order_id,
                "amount": self.amount,
                "orderInfo": f"Thanh toan don hang {self.order.id}",
                "payment_url": payment_url,
                "dev_mode": True
            }
            qr_code = generate_qr_code_base64(qr_data, size=300)

            return {
                "success": True,
                "transaction_id": order_id,
                "payment_url": payment_url,
                "qr_code": qr_code,
                "vnp_params": {"dev_mode": True, "mock_response": True}
            }

        order_id = f"{self.order.id}_{int(datetime.now().timestamp())}"
        
        # Tạo payment data
        vnp_params = {
            'vnp_Version': '2.1.0',
            'vnp_Command': 'pay',
            'vnp_TmnCode': self.tmn_code,
            'vnp_Amount': self.amount * 100,  # VNPay yêu cầu số tiền nhân 100
            'vnp_CurrCode': 'VND',
            'vnp_TxnRef': order_id,
            'vnp_OrderInfo': f'Thanh toan don hang {self.order.id}',
            'vnp_OrderType': 'other',
            'vnp_Locale': 'vn',
            'vnp_ReturnUrl': self.return_url or '',
            'vnp_IpAddr': '127.0.0.1',
            'vnp_CreateDate': datetime.now().strftime('%Y%m%d%H%M%S'),
        }
        
        # Sắp xếp và tạo query string
        query_string = '&'.join([f"{k}={v}" for k, v in sorted(vnp_params.items())])
        secure_hash = hmac.new(
            self.secret_key.encode(),
            query_string.encode(),
            hashlib.sha512
        ).hexdigest()
        
        vnp_params['vnp_SecureHash'] = secure_hash
        
        # Tạo payment URL
        payment_url = f"{self.endpoint}?{query_string}&vnp_SecureHash={secure_hash}"

        try:
            # Với VNPay, không cần gọi API - chỉ cần tạo URL
            # Kiểm tra URL có hợp lệ không bằng cách test connection (optional)
            if not self.is_development:
                # Trong production, có thể test URL bằng HEAD request
                test_response = requests.head(payment_url, timeout=5, allow_redirects=True)
                if test_response.status_code >= 400:
                    return {
                        "success": False,
                        "error_code": "URL_INVALID",
                        "error_message": f"VNPay URL không hợp lệ: {test_response.status_code}"
                    }

            # Tạo QR code từ payment URL
            qr_data = {
                "type": "vnpay",
                "orderId": order_id,
                "amount": self.amount,
                "orderInfo": f"Thanh toan don hang {self.order.id}",
                "payment_url": payment_url
            }
            qr_code = generate_qr_code_base64(qr_data, size=300)

            return {
                "success": True,
                "transaction_id": order_id,
                "payment_url": payment_url,
                "qr_code": qr_code,
                "vnp_params": vnp_params  # Lưu parameters để debug
            }

        except requests.exceptions.RequestException as e:
            # Network error khi test URL
            return {
                "success": False,
                "error_code": "NETWORK_ERROR",
                "error_message": f"Không thể verify VNPay URL: {str(e)}"
            }
        except Exception as e:
            # Unexpected error
            return {
                "success": False,
                "error_code": "INTERNAL_ERROR",
                "error_message": f"Lỗi không mong muốn: {str(e)}"
            }
    
    def verify_payment(self, callback_data):
        """Verify VNPay callback"""
        # Trong development mode, tự động approve
        if self.is_development:
            return {
                "success": True,
                "transaction_id": callback_data.get("vnp_TxnRef") or f"DEV_{self.order.id}",
                "amount": callback_data.get("vnp_Amount", self.amount * 100) / 100,
            }

        # Production mode: verify secure hash thực tế
        try:
            # Lấy secure hash từ callback
            secure_hash = callback_data.get("vnp_SecureHash", "")
            if not secure_hash:
                return {
                    "success": False,
                    "error": "Missing secure hash in callback"
                }

            # Tạo raw data để verify (loại bỏ vnp_SecureHash)
            vnp_params = {k: v for k, v in callback_data.items() if k != "vnp_SecureHash"}
            query_string = '&'.join([f"{k}={v}" for k, v in sorted(vnp_params.items())])

            # Tính expected secure hash
            expected_hash = hmac.new(
                self.secret_key.encode(),
                query_string.encode(),
                hashlib.sha512
            ).hexdigest()

            # So sánh hash
            if secure_hash != expected_hash:
                return {
                    "success": False,
                    "error": "Invalid secure hash"
                }

            # Kiểm tra response code
            response_code = callback_data.get("vnp_ResponseCode", "")
            if response_code == "00":  # Thành công
                return {
                    "success": True,
                    "transaction_id": callback_data.get("vnp_TxnRef"),
                    "amount": callback_data.get("vnp_Amount", 0) / 100,  # Chia 100 vì VNPay nhân 100
                    "bank_code": callback_data.get("vnp_BankCode"),
                    "bank_tran_no": callback_data.get("vnp_BankTranNo"),
                    "card_type": callback_data.get("vnp_CardType"),
                    "pay_date": callback_data.get("vnp_PayDate"),
                    "response_code": response_code
                }
            else:
                return {
                    "success": False,
                    "error": f"Payment failed with response code: {response_code}",
                    "response_code": response_code
                }

        except Exception as e:
            return {
                "success": False,
                "error": f"Secure hash verification failed: {str(e)}"
            }


def get_payment_gateway(payment_method, order, amount, return_url=None, ipn_url=None):
    """Factory function để lấy payment gateway phù hợp"""
    gateways = {
        "momo": MoMoGateway,
        "zalopay": ZaloPayGateway,
        "vnpay": VNPayGateway,
    }
    
    gateway_class = gateways.get(payment_method.lower())
    if not gateway_class:
        raise ValueError(f"Payment method {payment_method} not supported")
    
    return gateway_class(order, amount, return_url, ipn_url)

