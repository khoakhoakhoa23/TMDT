from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied

from orders.models import Cart, CartItem, Order, OrderItem`r`nfrom products.models import Xe
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

    def get_queryset(self):
        qs = Order.objects.filter(user=self.request.user).prefetch_related("items__xe")
        if self.request.user.is_staff or self.request.user.is_superuser:
            return Order.objects.all().prefetch_related("items__xe")
        return qs

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

            price = xe.gia_khuyen_mai if xe.gia_khuyen_mai else xe.gia
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
        price = xe.gia_khuyen_mai if xe.gia_khuyen_mai else xe.gia
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
        price = xe.gia_khuyen_mai if xe.gia_khuyen_mai else xe.gia
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

