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
from orders.models import Order
from tenants.scoping import apply_tenant_filter, get_current_tenant
from core.permissions import IsSuperAdminOrTenantAdmin


class PaymentViewSet(viewsets.ModelViewSet):
    """ViewSet cho Payment"""
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated, IsSuperAdminOrTenantAdmin]

    def get_queryset(self):
        """Filter payments theo user"""
        queryset = Payment.objects.select_related("order", "user").all()
        queryset = apply_tenant_filter(queryset, self.request)
        if not self.request.user.is_staff:
            queryset = queryset.filter(user=self.request.user)
        return queryset

    def perform_create(self, serializer):
        serializer.save(tenant=get_current_tenant(self.request))

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
            tenant = get_current_tenant(request)
            payment = Payment.objects.create(
                tenant=tenant,
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
        with transaction.atomic():
            # Use select_for_update to prevent race condition
            payment = Payment.objects.select_for_update().get(pk=pk)
            
            # Idempotency check: if payment is already completed, return success without processing again
            if payment.status == "completed":
                return Response({"RspCode": "00", "Message": "Success - Already processed"})
            
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
                    payment.status = "completed"
                    payment.paid_at = timezone.now()
                    payment.callback_data = request.data
                    payment.save()
                    
                    # Cập nhật order status
                    payment.order.payment_status = "paid"
                    payment.order.status = "paid"
                    payment.order.save()
                    
                    # Tạo notification và gửi email thanh toán thành công
                    try:
                        from core.notifications import create_payment_success_notification
                        create_payment_success_notification(payment.order, payment)
                        
                        # Gửi email thanh toán thành công
                        from core.email_service import EmailService
                        EmailService.send_payment_success_email(payment.order, payment)
                    except Exception as e:
                        import logging
                        logger = logging.getLogger(__name__)
                        logger.warning(f"Không thể tạo payment notification/email: {str(e)}")
                    
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
    
    @action(detail=True, methods=["post"], url_path="simulate", permission_classes=[AllowAny])
    def simulate_payment(self, request, pk=None):
        """
        Simulate payment trong development mode (KHÔNG TỐN PHÍ)
        Chỉ hoạt động khi DEBUG=True và PAYMENT_DEV_MODE=True
        """
        from django.conf import settings
        
        if not (getattr(settings, 'DEBUG', False) and getattr(settings, 'PAYMENT_DEV_MODE', False)):
            return Response(
                {"detail": "Chức năng này chỉ khả dụng trong development mode"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        payment = self.get_object()
        
        if payment.status in ["completed", "success"]:
            return Response(
                {"detail": "Payment đã được thanh toán"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Simulate payment thành công
        with transaction.atomic():
            payment.status = "completed"
            payment.paid_at = timezone.now()
            payment.callback_data = {"simulated": True, "dev_mode": True}
            payment.save()
            
            # Cập nhật order status
            payment.order.payment_status = "paid"
            payment.order.status = "paid"
            payment.order.save()
            
            # Tạo notification và gửi email
            try:
                from core.notifications import create_payment_success_notification
                create_payment_success_notification(payment.order, payment)
                
                # Gửi email thanh toán thành công
                from core.email_service import EmailService
                EmailService.send_payment_success_email(payment.order, payment)
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"Không thể tạo payment notification/email: {str(e)}")
        
        return Response(
            {
                "success": True,
                "message": "Payment đã được simulate thành công (Development Mode)",
                "status": payment.status,
            },
            status=status.HTTP_200_OK
        )


@api_view(["POST"])
@permission_classes([AllowAny])
@transaction.atomic
def payment_callback(request, order_id):
    """Callback URL cho payment gateway"""
    import traceback
    
    # Audit log cho payment callback
    audit_logger = logging.getLogger('payment_audit')
    audit_logger.info(f"Payment callback received - Order ID: {order_id}, Method: {request.method}")
    
    # Log request data (trong production, có thể muốn mask sensitive data)
    if request.method == "POST":
        audit_logger.debug(f"Callback data: {request.data}")
    
    try:
        # Validate order_id
        try:
            order_id = int(order_id)
        except (ValueError, TypeError):
            audit_logger.warning(f"Invalid order_id format: {order_id}")
            return Response(
                {"detail": "Invalid order ID format"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Use select_for_update to prevent race condition if callback is called multiple times
        # Get the most recent pending/processing payment for this order
        payment = Payment.objects.select_for_update().filter(
            order_id=order_id,
            status__in=["pending", "processing"]
        ).order_by("-created_at").first()
        
        if not payment:
            # Try to get any payment for this order (might be completed)
            payment = Payment.objects.filter(order_id=order_id).order_by("-created_at").first()
            if not payment:
                audit_logger.warning(f"Payment not found for order_id: {order_id}")
                return Response(
                    {"detail": "Payment not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Idempotency check: if payment is already completed, return success without processing again
        if payment.status == "completed":
            audit_logger.info(f"Payment already completed - Order ID: {order_id}, Payment ID: {payment.id}")
            return Response({"success": True, "message": "Payment already processed"})
        
        # Validate callback data
        if not request.data:
            audit_logger.warning(f"Empty callback data for order_id: {order_id}")
            return Response(
                {"detail": "Invalid callback data"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
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
            
            audit_logger.info(f"Payment successful - Order ID: {order_id}, Payment ID: {payment.id}, Amount: {payment.amount}")
            
            # Tạo notification và gửi email thanh toán thành công
            try:
                from core.notifications import create_payment_success_notification
                create_payment_success_notification(payment.order, payment)
                
                from core.email_service import EmailService
                EmailService.send_payment_success_email(payment.order, payment)
            except Exception as e:
                logger = logging.getLogger(__name__)
                logger.warning(f"Không thể tạo payment notification/email: {str(e)}")
                # Non-critical, don't fail the payment
        else:
            error_message = verify_result.get("message", "Unknown error")
            audit_logger.warning(f"Payment verification failed - Order ID: {order_id}, Error: {error_message}")
        
        return Response({"success": True})
        
    except Payment.DoesNotExist:
        audit_logger.warning(f"Payment.DoesNotExist - Order ID: {order_id}")
        return Response(
            {"detail": "Payment not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        # Log full traceback for debugging
        logger.error(f"Payment callback error: {str(e)}\n{traceback.format_exc()}", exc_info=True)
        
        audit_logger.error(f"Payment callback exception - Order ID: {order_id}, Error: {str(e)}")
        
        return Response(
            {"detail": "Internal server error"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
