import logging
logger = logging.getLogger(__name__)

from django.db import transaction
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied

from orders.models import Cart, CartItem, Order, OrderItem, Coupon
from products.models import Xe
from orders.serializers import CartSerializer, CartItemSerializer, OrderSerializer
from decimal import Decimal


def _get_session_key(request):
    return request.headers.get("X-Session-Key") or request.query_params.get("session_key") or ""


class CartViewSet(viewsets.ModelViewSet):
    serializer_class = CartSerializer

    def get_queryset(self):
        session_key = _get_session_key(self.request)
        if self.request.user.is_authenticated:
            return Cart.objects.filter(user=self.request.user).prefetch_related("items__xe")
        if session_key:
            return Cart.objects.filter(session_key=session_key, user__isnull=True).prefetch_related(
                "items__xe"
            )
        return Cart.objects.none()
    
    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(user=self.request.user, session_key="")
        else:
            session_key = _get_session_key(self.request)
            if not session_key:
                raise PermissionDenied("Thiếu session_key cho khách.")
            serializer.save(user=None, session_key=session_key)


class CartItemViewSet(viewsets.ModelViewSet):
    serializer_class = CartItemSerializer

    def get_queryset(self):
        session_key = _get_session_key(self.request)
        if self.request.user.is_authenticated:
            return CartItem.objects.filter(cart__user=self.request.user).select_related("xe", "cart")
        if session_key:
            return CartItem.objects.filter(
                cart__session_key=session_key, cart__user__isnull=True
            ).select_related("xe", "cart")
        return CartItem.objects.none()

    def create(self, request, *args, **kwargs):
        """
        Override create to handle idempotent requests.
        If the car already exists in the cart, update the quantity instead of throwing an error.
        """
        logger.info(f"[CartItem] Nhận request POST /api/cart-item/: {request.data}")

        # First, validate with serializer to get/create cart
        serializer = self.get_serializer(data=request.data)

        if not serializer.is_valid():
            logger.error(f"[CartItem] Validation failed: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        logger.info(f"[CartItem] Validation passed. Creating/updating cart item...")

        cart = serializer.validated_data.get("cart")
        xe = serializer.validated_data.get("xe")
        quantity = int(serializer.validated_data.get("quantity", 1))

        # Check if item already exists in cart
        existing_item = CartItem.objects.filter(cart=cart, xe=xe).first()

        if existing_item:
            logger.info(f"[CartItem] Item already exists (cart={cart.id}, xe={xe.id}), updating quantity to {quantity}")
            # Item already exists - update quantity
            existing_item.quantity = quantity
            existing_item.save()
            output_serializer = self.get_serializer(existing_item)
            return Response(output_serializer.data, status=status.HTTP_200_OK)
        else:
            logger.info(f"[CartItem] Item not found, creating new one (cart={cart.id}, xe={xe.id})")
            # Item doesn't exist - create new one
            cart_item = CartItem.objects.create(
                cart=cart,
                xe=xe,
                quantity=quantity
            )
            output_serializer = self.get_serializer(cart_item)
            return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        cart = serializer.validated_data.get("cart")
        session_key = _get_session_key(self.request)
        if cart.user:
            if not self.request.user.is_authenticated or cart.user != self.request.user:
                raise PermissionDenied("Không thể thêm vào giỏ của người khác.")
        else:
            if not session_key or cart.session_key != session_key:
                raise PermissionDenied("Không thể thêm vào giỏ của người khác.")
        serializer.save()


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        """Chỉ admin mới có thể update/delete đơn hàng"""
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdminUser()]
        return [IsAuthenticated()]

    def get_queryset(self):
        qs = Order.objects.filter(user=self.request.user).prefetch_related("items__xe")
        if self.request.user.is_staff or self.request.user.is_superuser:
            return Order.objects.all().prefetch_related("items__xe").order_by('-created_at')
        return qs
    
    def update(self, request, *args, **kwargs):
        """Override update để tự động cập nhật payment status khi order status = 'paid'"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        # Lấy status mới từ request data
        new_status = request.data.get('status', instance.status)

        # Lưu status cũ để tạo notification
        old_status = instance.status

        # Kiểm tra xem có cập nhật actual_return_date/time không
        return_date_updated = 'actual_return_date' in request.data or 'actual_return_time' in request.data
        
        # Tính late fee nếu cập nhật return date/time
        if return_date_updated and (instance.actual_return_date or instance.actual_return_time):
            from orders.utils import calculate_late_fee
            new_late_fee = calculate_late_fee(instance)
            if new_late_fee != instance.late_fee:
                instance.late_fee = new_late_fee
                instance.total_price = instance.base_price + instance.delivery_fee + instance.pickup_fee + instance.additional_fee - instance.discount_amount + new_late_fee
                instance.save()

        # Nếu status được set thành "paid", tự động cập nhật payment_status và payment
        if new_status == "paid" and instance.status != "paid":
            with transaction.atomic():
                # Cập nhật order
                self.perform_update(serializer)
                
                # Refresh instance từ database để có dữ liệu mới nhất
                instance.refresh_from_db()
                
                # Cập nhật order.payment_status
                instance.payment_status = "paid"
                instance.save()
                
                # Cập nhật payment status nếu có
                try:
                    from payments.models import Payment
                    payment = Payment.objects.filter(order=instance).first()
                    if payment and payment.status != "completed":
                        payment.status = "completed"
                        payment.paid_at = timezone.now()
                        payment.save()
                        
                        # Tạo notification và gửi email thanh toán thành công
                        try:
                            from core.notifications import create_payment_success_notification
                            create_payment_success_notification(instance, payment)
                            
                            # Gửi email thanh toán thành công
                            from core.email_service import EmailService
                            EmailService.send_payment_success_email(instance, payment)
                        except Exception as e:
                            import logging
                            logger = logging.getLogger(__name__)
                            logger.warning(f"Không thể tạo payment notification/email: {str(e)}")
                except Exception as e:
                    # Log lỗi nhưng không fail update order
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.warning(f"Không thể cập nhật payment status: {str(e)}")
        else:
            self.perform_update(serializer)
        
        # Tạo notification khi order status thay đổi
        if old_status != new_status:
            try:
                from core.notifications import create_order_status_notification
                create_order_status_notification(instance, old_status, new_status)
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"Không thể tạo order status notification: {str(e)}")
        
        # Refresh instance và serializer để trả về dữ liệu mới nhất
        instance.refresh_from_db()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    def partial_update(self, request, *args, **kwargs):
        """Override partial_update để tự động cập nhật payment status"""
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        user = request.user
        items_data = request.data.get("items", [])
        if not isinstance(items_data, list) or len(items_data) == 0:
            return Response({"detail": "items trống."}, status=status.HTTP_400_BAD_REQUEST)

        subtotal = Decimal(0)
        order_items = []

        for item in items_data:
            xe_id = item.get("xe_id")
            quantity = int(item.get("quantity", 0))
            if not xe_id or quantity <= 0:
                return Response(
                    {"detail": "Thiếu xe_id hoặc quantity không hợp lệ."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            try:
                # Use select_for_update to prevent race condition
                xe = Xe.objects.select_for_update().get(pk=xe_id)
            except Xe.DoesNotExist:
                return Response({"detail": f"Xe {xe_id} không tồn tại."}, status=404)

            if xe.so_luong < quantity:
                return Response(
                    {"detail": f"Xe '{xe.ten_xe}' chỉ còn {xe.so_luong} chiếc."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Ưu tiên gia_thue cho thuê xe, sau đó gia_khuyen_mai, cuối cùng là gia
            price = xe.gia_thue if xe.gia_thue else (xe.gia_khuyen_mai if xe.gia_khuyen_mai else xe.gia)
            subtotal += Decimal(str(price)) * quantity
            order_items.append((xe, quantity, price))

        # Xử lý coupon
        coupon_code = request.data.get("coupon_code", "").strip()
        coupon = None
        discount_amount = Decimal(0)
        
        # Nếu có base_price từ frontend (từ calculate_price_api), dùng nó
        base_price_from_request = request.data.get("base_price")
        if base_price_from_request:
            subtotal = Decimal(str(base_price_from_request))
            # Cộng thêm delivery_fee, pickup_fee, additional_fee nếu có
            delivery_fee = Decimal(str(request.data.get("delivery_fee", 0)))
            pickup_fee = Decimal(str(request.data.get("pickup_fee", 0)))
            additional_fee = Decimal(str(request.data.get("additional_fee", 0)))
            subtotal = subtotal + delivery_fee + pickup_fee + additional_fee
        else:
            # Nếu không có, tính từ items
            delivery_fee = Decimal(str(request.data.get("delivery_fee", 0)))
            pickup_fee = Decimal(str(request.data.get("pickup_fee", 0)))
            additional_fee = Decimal(str(request.data.get("additional_fee", 0)))
            subtotal = subtotal + delivery_fee + pickup_fee + additional_fee
        
        if coupon_code:
            try:
                # Use select_for_update to prevent race condition with coupon usage
                coupon = Coupon.objects.select_for_update().get(code=coupon_code.upper())
                if not coupon.is_valid():
                    return Response(
                        {"detail": "Mã coupon không hợp lệ hoặc đã hết hạn."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                if subtotal < coupon.min_order_value:
                    return Response(
                        {"detail": f"Đơn hàng tối thiểu {coupon.min_order_value:,.0f} VNĐ để sử dụng coupon này."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                # Double-check usage limit after locking
                if coupon.usage_limit and coupon.used_count >= coupon.usage_limit:
                    return Response(
                        {"detail": "Mã coupon đã hết số lần sử dụng."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                discount_amount = coupon.calculate_discount(subtotal)
                # Note: used_count will be incremented after successful order creation
            except Coupon.DoesNotExist:
                return Response(
                    {"detail": "Mã coupon không tồn tại."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        total_price = subtotal - discount_amount

        order = Order.objects.create(
            user=user,
            total_price=total_price,
            status="pending",
            shipping_name=request.data.get("shipping_name", ""),
            shipping_phone=request.data.get("shipping_phone", ""),
            shipping_address=request.data.get("shipping_address", ""),
            shipping_city=request.data.get("shipping_city", ""),
            payment_method=request.data.get("payment_method", ""),
            start_date=request.data.get("start_date"),
            end_date=request.data.get("end_date"),
            pickup_location=request.data.get("pickup_location", ""),
            return_location=request.data.get("return_location", ""),
            rental_days=request.data.get("rental_days", 1),
            rental_hours=request.data.get("rental_hours", 0),
            base_price=subtotal - delivery_fee - pickup_fee - additional_fee,
            delivery_fee=delivery_fee,
            pickup_fee=pickup_fee,
            additional_fee=additional_fee,
            discount_amount=discount_amount,
            late_fee=request.data.get("late_fee", 0),
            coupon_code=coupon_code.upper() if coupon_code else "",
            coupon=coupon,
        )
        for xe, qty, price in order_items:
            OrderItem.objects.create(
                order=order, xe=xe, quantity=qty, price_at_purchase=price
            )
            # Double-check inventory before decrementing (xe is already locked from select_for_update above)
            if xe.so_luong < qty:
                # Rollback transaction by raising exception
                raise ValueError(f"Xe '{xe.ten_xe}' chỉ còn {xe.so_luong} chiếc, không đủ để đặt {qty} chiếc.")
            xe.so_luong -= qty
            # Ensure inventory doesn't go negative
            if xe.so_luong < 0:
                xe.so_luong = 0
            xe.save()

        # Increment coupon used_count only after successful order creation
        if coupon:
            coupon.used_count += 1
            coupon.save()

        # Gửi email xác nhận đơn hàng
        try:
            from core.email_service import EmailService
            EmailService.send_order_confirmation_email(order)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Không thể gửi email xác nhận đơn hàng: {str(e)}")
        
        serializer = self.get_serializer(order)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

@transaction.atomic
def _checkout_transaction(cart, coupon_code=None):
    # Lock all Xe objects to prevent race conditions
    xe_ids = [item.xe_id for item in cart.items.select_related("xe")]
    locked_xes = {xe.pk: xe for xe in Xe.objects.select_for_update().filter(pk__in=xe_ids)}
    
    items = list(cart.items.select_related("xe"))
    subtotal = Decimal(0)
    for item in items:
        xe = locked_xes[item.xe_id]
        if xe.so_luong < item.quantity:
            return None, {"detail": f"Xe '{xe.ten_xe}' chỉ còn {xe.so_luong} chiếc."}
        # Ưu tiên gia_thue cho thuê xe, sau đó gia_khuyen_mai, cuối cùng là gia
        price = xe.gia_thue if xe.gia_thue else (xe.gia_khuyen_mai if xe.gia_khuyen_mai else xe.gia)
        subtotal += Decimal(str(price)) * item.quantity

    # Xử lý coupon
    coupon = None
    discount_amount = Decimal(0)
    if coupon_code:
        try:
            # Use select_for_update to prevent race condition with coupon usage
            coupon = Coupon.objects.select_for_update().get(code=coupon_code.upper())
            if not coupon.is_valid():
                return None, {"detail": "Mã coupon không hợp lệ hoặc đã hết hạn."}
            if subtotal < coupon.min_order_value:
                return None, {
                    "detail": f"Đơn hàng tối thiểu {coupon.min_order_value:,.0f} VNĐ để sử dụng coupon này."
                }
            # Double-check usage limit after locking
            if coupon.usage_limit and coupon.used_count >= coupon.usage_limit:
                return None, {"detail": "Mã coupon đã hết số lần sử dụng."}
            discount_amount = coupon.calculate_discount(subtotal)
            # Note: used_count will be incremented after successful order creation
        except Coupon.DoesNotExist:
            return None, {"detail": "Mã coupon không tồn tại."}
    
    total_price = subtotal - discount_amount

    order = Order.objects.create(
        user=cart.user,
        total_price=total_price,
        status="pending",
        shipping_name="",
        shipping_phone="",
        shipping_address="",
        shipping_city="",
        payment_method="",
        base_price=subtotal,
        delivery_fee=0,
        pickup_fee=0,
        additional_fee=0,
        discount_amount=discount_amount,
        late_fee=0,
        rental_hours=0,
        coupon_code=coupon_code.upper() if coupon_code else "",
        coupon=coupon,
    )
    for item in items:
        xe = locked_xes[item.xe_id]
        # Ưu tiên gia_thue cho thuê xe, sau đó gia_khuyen_mai, cuối cùng là gia
        price = xe.gia_thue if xe.gia_thue else (xe.gia_khuyen_mai if xe.gia_khuyen_mai else xe.gia)
        OrderItem.objects.create(
            order=order, xe=xe, quantity=item.quantity, price_at_purchase=price
        )
        # Double-check inventory before decrementing (xe is already locked with select_for_update)
        if xe.so_luong < item.quantity:
            raise ValueError(f"Xe '{xe.ten_xe}' chỉ còn {xe.so_luong} chiếc, không đủ để đặt {item.quantity} chiếc.")
        xe.so_luong -= item.quantity
        # Ensure inventory doesn't go negative
        if xe.so_luong < 0:
            xe.so_luong = 0
        xe.save()

    # Increment coupon used_count only after successful order creation
    if coupon:
        coupon.used_count += 1
        coupon.save()

    cart.items.all().delete()
    return order, None


from rest_framework.decorators import api_view, permission_classes  # noqa: E402


@api_view(["POST"])
@permission_classes([AllowAny])
def checkout(request):
    session_key = _get_session_key(request)
    user = request.user if request.user.is_authenticated else None

    if user:
        cart = Cart.objects.filter(user=user).prefetch_related("items__xe").first()
    else:
        cart = (
            Cart.objects.filter(session_key=session_key, user__isnull=True)
            .prefetch_related("items__xe")
            .first()
        )
    if not cart or cart.items.count() == 0:
        return Response({"detail": "Giỏ hàng trống."}, status=status.HTTP_400_BAD_REQUEST)

    # Lấy coupon code từ request
    coupon_code = request.data.get("coupon_code", "").strip()
    if coupon_code:
        coupon_code = coupon_code.upper()

    order, error = _checkout_transaction(cart, coupon_code=coupon_code if coupon_code else None)
    if error:
        return Response(error, status=status.HTTP_400_BAD_REQUEST)
    # If client requested a payment, create payment record and gateway request
    payment_method = request.data.get("payment_method") or ""
    payment_response = None
    if payment_method:
        try:
            from payments.payment_gateways import get_payment_gateway
            from payments.models import Payment

            # Build IPN URL for gateway callbacks
            ipn_url = request.build_absolute_uri(f"/api/payment/callback/{order.id}/")
            return_url = request.data.get("return_url", "")

            gateway = get_payment_gateway(
                payment_method=payment_method,
                order=order,
                amount=order.total_price,
                return_url=return_url,
                ipn_url=ipn_url,
            )
            gateway_response = gateway.create_payment()

            # Persist Payment record (best-effort)
            payment = Payment.objects.create(
                order=order,
                user=request.user if request.user.is_authenticated else order.user,
                payment_method=payment_method,
                amount=order.total_price,
                transaction_id=gateway_response.get("transaction_id", ""),
                payment_url=gateway_response.get("payment_url", ""),
                qr_code=gateway_response.get("qr_code", ""),
                ipn_url=ipn_url,
                status="pending",
            )
            payment_response = {
                "payment_id": payment.id,
                "payment_url": payment.payment_url,
                "qr_code": payment.qr_code,
                "transaction_id": payment.transaction_id,
            }
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Could not create payment for order {order.id}: {str(e)}")

    serialized_order = OrderSerializer(order).data
    if payment_response:
        serialized_order["payment"] = payment_response
    return Response(serialized_order, status=status.HTTP_201_CREATED)
