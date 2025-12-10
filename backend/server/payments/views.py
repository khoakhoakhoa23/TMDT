from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import transaction

from payments.models import Payment
from payments.serializers import PaymentSerializer, PaymentCreateSerializer
from payments.payment_gateways import get_payment_gateway
from cart.commerce_models import Order


class PaymentViewSet(viewsets.ModelViewSet):
    """ViewSet cho Payment"""
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter payments theo user"""
        queryset = Payment.objects.select_related("order", "user").all()
        if not self.request.user.is_staff:
            queryset = queryset.filter(user=self.request.user)
        return queryset
    
    @action(detail=False, methods=["post"], url_path="create")
    def create_payment(self, request):
        """Tạo payment request"""
        serializer = PaymentCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        order_id = serializer.validated_data["order_id"]
        payment_method = serializer.validated_data["payment_method"]
        return_url = serializer.validated_data.get("return_url", "")
        
        # Lấy order
        order = get_object_or_404(Order, id=order_id, user=request.user)
        
        # Kiểm tra xem đã có payment chưa
        existing_payment = Payment.objects.filter(
            order=order,
            status__in=["pending", "processing"]
        ).first()
        
        if existing_payment:
            return Response(
                {"detail": "Đơn hàng này đã có thanh toán đang chờ xử lý"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Tạo IPN URL
        ipn_url = request.build_absolute_uri(f"/api/payment/{order_id}/ipn/")
        
        try:
            # Lấy payment gateway
            gateway = get_payment_gateway(
                payment_method=payment_method,
                order=order,
                amount=order.total_price,
                return_url=return_url,
                ipn_url=ipn_url
            )
            
            # Tạo payment request
            gateway_response = gateway.create_payment()
            
            if not gateway_response.get("success"):
                return Response(
                    {"detail": "Không thể tạo payment request"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Lưu payment vào database
            payment = Payment.objects.create(
                order=order,
                user=request.user,
                payment_method=payment_method,
                amount=order.total_price,
                transaction_id=gateway_response.get("transaction_id", ""),
                payment_url=gateway_response.get("payment_url", ""),
                qr_code=gateway_response.get("qr_code", ""),
                ipn_url=ipn_url,
                status="pending"
            )
            
            return Response(
                PaymentSerializer(payment, context={"request": request}).data,
                status=status.HTTP_201_CREATED
            )
            
        except Exception as e:
            return Response(
                {"detail": f"Lỗi: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=["post"], url_path="ipn", permission_classes=[AllowAny])
    def ipn_callback(self, request, pk=None):
        """IPN callback từ payment gateway"""
        payment = self.get_object()
        
        try:
            # Lấy payment gateway
            gateway = get_payment_gateway(
                payment_method=payment.payment_method,
                order=payment.order,
                amount=payment.amount
            )
            
            # Verify payment
            verify_result = gateway.verify_payment(request.data)
            
            if verify_result.get("success"):
                with transaction.atomic():
                    payment.status = "completed"
                    payment.paid_at = timezone.now()
                    payment.callback_data = request.data
                    payment.save()
                    
                    # Cập nhật order status
                    payment.order.payment_status = "paid"
                    payment.order.status = "paid"
                    payment.order.save()
                
                return Response({"RspCode": "00", "Message": "Success"})
            else:
                payment.status = "failed"
                payment.callback_data = request.data
                payment.save()
                return Response({"RspCode": "07", "Message": "Failed"})
                
        except Exception as e:
            payment.status = "failed"
            payment.callback_data = {"error": str(e)}
            payment.save()
            return Response({"RspCode": "99", "Message": str(e)})
    
    @action(detail=True, methods=["get"], url_path="status")
    def check_status(self, request, pk=None):
        """Kiểm tra trạng thái payment"""
        payment = self.get_object()
        return Response(
            {
                "status": payment.status,
                "transaction_id": payment.transaction_id,
                "paid_at": payment.paid_at,
            }
        )


@api_view(["POST"])
@permission_classes([AllowAny])
def payment_callback(request, order_id):
    """Callback URL cho payment gateway"""
    try:
        payment = Payment.objects.get(order_id=order_id)
        
        # Verify và cập nhật payment
        gateway = get_payment_gateway(
            payment_method=payment.payment_method,
            order=payment.order,
            amount=payment.amount
        )
        
        verify_result = gateway.verify_payment(request.data)
        
        if verify_result.get("success"):
            payment.status = "completed"
            payment.paid_at = timezone.now()
            payment.callback_data = request.data
            payment.save()
            
            payment.order.payment_status = "paid"
            payment.order.status = "paid"
            payment.order.save()
        
        return Response({"success": True})
        
    except Payment.DoesNotExist:
        return Response(
            {"detail": "Payment not found"},
            status=status.HTTP_404_NOT_FOUND
        )
