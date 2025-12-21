from django.db import transaction
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied

from orders.models import Cart, CartItem, Order, OrderItem
from products.models import Xe
from orders.serializers import CartSerializer, CartItemSerializer, OrderSerializer


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
                        
                        # Tạo notification thanh toán thành công
                        try:
                            from core.notifications import create_payment_success_notification
                            create_payment_success_notification(instance, payment)
                        except Exception as e:
                            import logging
                            logger = logging.getLogger(__name__)
                            logger.warning(f"Không thể tạo payment notification: {str(e)}")
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

        total = 0
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
                xe = Xe.objects.get(pk=xe_id)
            except Xe.DoesNotExist:
                return Response({"detail": f"Xe {xe_id} không tồn tại."}, status=404)

            if xe.so_luong < quantity:
                return Response(
                    {"detail": f"Xe '{xe.ten_xe}' chỉ còn {xe.so_luong} chiếc."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Ưu tiên gia_thue cho thuê xe, sau đó gia_khuyen_mai, cuối cùng là gia
            price = xe.gia_thue if xe.gia_thue else (xe.gia_khuyen_mai if xe.gia_khuyen_mai else xe.gia)
            total += price * quantity
            order_items.append((xe, quantity, price))

        order = Order.objects.create(
            user=user,
            total_price=total,
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
        )
        for xe, qty, price in order_items:
            OrderItem.objects.create(
                order=order, xe=xe, quantity=qty, price_at_purchase=price
            )
            xe.so_luong -= qty
            xe.save()

        serializer = self.get_serializer(order)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

@transaction.atomic
def _checkout_transaction(cart):
    items = list(cart.items.select_related("xe"))
    total = 0
    for item in items:
        xe = item.xe
        if xe.so_luong < item.quantity:
            return None, {"detail": f"Xe '{xe.ten_xe}' chỉ còn {xe.so_luong} chiếc."}
        # Ưu tiên gia_thue cho thuê xe, sau đó gia_khuyen_mai, cuối cùng là gia
        price = xe.gia_thue if xe.gia_thue else (xe.gia_khuyen_mai if xe.gia_khuyen_mai else xe.gia)
        total += price * item.quantity

    order = Order.objects.create(
        user=cart.user,
        total_price=total,
        status="pending",
        shipping_name="",
        shipping_phone="",
        shipping_address="",
        shipping_city="",
        payment_method="",
    )
    for item in items:
        xe = item.xe
        # Ưu tiên gia_thue cho thuê xe, sau đó gia_khuyen_mai, cuối cùng là gia
        price = xe.gia_thue if xe.gia_thue else (xe.gia_khuyen_mai if xe.gia_khuyen_mai else xe.gia)
        OrderItem.objects.create(
            order=order, xe=xe, quantity=item.quantity, price_at_purchase=price
        )
        xe.so_luong -= item.quantity
        xe.save()
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

    order, error = _checkout_transaction(cart)
    if error:
        return Response(error, status=status.HTTP_400_BAD_REQUEST)
    return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)
