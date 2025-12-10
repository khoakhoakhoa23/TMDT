"""
Payment Gateway Services cho Momo, ZaloPay, VNPay
Lưu ý: Đây là cấu trúc mô phỏng, cần tích hợp với API thực tế từ các nhà cung cấp
"""
import hashlib
import hmac
import json
import requests
from datetime import datetime
from decimal import Decimal
from django.conf import settings


class PaymentGatewayBase:
    """Base class cho các payment gateway"""
    
    def __init__(self, order, amount, return_url=None, ipn_url=None):
        self.order = order
        self.amount = int(amount)  # VNĐ
        self.return_url = return_url
        self.ipn_url = ipn_url
    
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
        self.endpoint = getattr(settings, 'MOMO_ENDPOINT', 'https://test-payment.momo.vn/v2/gateway/api/create')
    
    def create_payment(self):
        """Tạo payment request với MoMo"""
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
        
        # Trong môi trường thực tế, gọi API MoMo
        # response = requests.post(self.endpoint, json=data)
        # return response.json()
        
        # Mô phỏng response (sandbox mode)
        payment_url = f"https://test-payment.momo.vn/payment?orderId={order_id}&amount={self.amount}"
        qr_code = f"https://api.vietqr.io/v2/generate?accountNo=9704228524960933&accountName=NGUYEN VAN A&acqId=970415&amount={self.amount}&addInfo=Thanh toan don hang {self.order.id}&format=compact"
        
        return {
            "success": True,
            "transaction_id": order_id,
            "payment_url": payment_url,
            "qr_code": qr_code,
            "deep_link": f"momo://app?action=pay&orderId={order_id}",
        }
    
    def verify_payment(self, callback_data):
        """Verify MoMo callback"""
        # Verify signature từ callback
        return {
            "success": True,
            "transaction_id": callback_data.get("orderId"),
            "amount": callback_data.get("amount"),
        }


class ZaloPayGateway(PaymentGatewayBase):
    """ZaloPay Payment Gateway"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.app_id = getattr(settings, 'ZALOPAY_APP_ID', 'ZALOPAY_APP_ID')
        self.key1 = getattr(settings, 'ZALOPAY_KEY1', 'ZALOPAY_KEY1')
        self.key2 = getattr(settings, 'ZALOPAY_KEY2', 'ZALOPAY_KEY2')
        self.endpoint = getattr(settings, 'ZALOPAY_ENDPOINT', 'https://sb-openapi.zalopay.vn/v2/create')
    
    def create_payment(self):
        """Tạo payment request với ZaloPay"""
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
        
        # Trong môi trường thực tế, gọi API ZaloPay
        # response = requests.post(self.endpoint, json=data)
        # return response.json()
        
        # Mô phỏng response
        payment_url = f"https://zalopay.vn/payment?app_trans_id={app_trans_id}"
        qr_code = f"https://api.vietqr.io/v2/generate?accountNo=9704228524960933&accountName=NGUYEN VAN A&acqId=970415&amount={self.amount}&addInfo=Thanh toan don hang {self.order.id}&format=compact"
        
        return {
            "success": True,
            "transaction_id": app_trans_id,
            "payment_url": payment_url,
            "qr_code": qr_code,
            "deep_link": f"zalopay://app?action=pay&app_trans_id={app_trans_id}",
        }
    
    def verify_payment(self, callback_data):
        """Verify ZaloPay callback"""
        return {
            "success": True,
            "transaction_id": callback_data.get("app_trans_id"),
            "amount": callback_data.get("amount"),
        }


class VNPayGateway(PaymentGatewayBase):
    """VNPay Payment Gateway"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.tmn_code = getattr(settings, 'VNPAY_TMN_CODE', 'VNPAY_TMN_CODE')
        self.secret_key = getattr(settings, 'VNPAY_SECRET_KEY', 'VNPAY_SECRET_KEY')
        self.endpoint = getattr(settings, 'VNPAY_ENDPOINT', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html')
    
    def create_payment(self):
        """Tạo payment request với VNPay"""
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
        qr_code = f"https://api.vietqr.io/v2/generate?accountNo=9704228524960933&accountName=NGUYEN VAN A&acqId=970415&amount={self.amount}&addInfo=Thanh toan don hang {self.order.id}&format=compact"
        
        return {
            "success": True,
            "transaction_id": order_id,
            "payment_url": payment_url,
            "qr_code": qr_code,
        }
    
    def verify_payment(self, callback_data):
        """Verify VNPay callback"""
        # Verify secure hash
        return {
            "success": True,
            "transaction_id": callback_data.get("vnp_TxnRef"),
            "amount": callback_data.get("vnp_Amount", 0) / 100,  # Chia 100 vì VNPay nhân 100
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

