from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Notification
from .serializers import NotificationSerializer
from rest_framework.permissions import IsAdminUser
from django.shortcuts import get_object_or_404
from django.utils import timezone
from core.notifications import create_notification


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet cho Notification - chỉ đọc"""
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Chỉ trả về notifications của user hiện tại"""
        return Notification.objects.filter(user=self.request.user).order_by("-created_at")

    @action(detail=True, methods=["patch"], url_path="read")
    def mark_as_read(self, request, pk=None):
        """Đánh dấu notification đã đọc"""
        notification = self.get_object()
        if notification.user != request.user:
            return Response(
                {"detail": "Không có quyền truy cập."},
                status=status.HTTP_403_FORBIDDEN
            )
        notification.read = True
        notification.save()
        return Response(NotificationSerializer(notification).data)

    @action(detail=False, methods=["post"], url_path="mark-all-read")
    def mark_all_as_read(self, request):
        """Đánh dấu tất cả notifications đã đọc"""
        updated = Notification.objects.filter(
            user=request.user,
            read=False
        ).update(read=True)
        return Response({"updated": updated})

    @action(detail=False, methods=["post"], url_path="send-test", permission_classes=[IsAuthenticated, IsAdminUser])
    def send_test_notification(self, request):
        """
        Admin-only endpoint to send a test notification to a user (for debugging).
        Body: { "user_id": 1, "type": "payment_success", "title": "...", "message": "...", "order_id": 123 }
        """
        data = request.data
        user_id = data.get("user_id")
        notif_type = data.get("type", "test")
        title = data.get("title", "Test Notification")
        message = data.get("message", "This is a test notification.")
        order_id = data.get("order_id", None)

        if not user_id:
            return Response({"detail": "user_id is required"}, status=400)

        # Create notification in DB
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            user = User.objects.get(pk=user_id)
        except Exception:
            return Response({"detail": "User not found"}, status=404)

        notification = create_notification(user=user, type=notif_type, title=title, message=message, order=None)

        # Send real-time notification via channels (best-effort)
        try:
            # Import channels helpers at runtime (optional dependency)
            try:
                from core.consumers import send_notification, send_order_update
            except Exception:
                send_notification = None
                send_order_update = None

            if send_notification:
                send_notification(user.id, {
                    "id": notification.id,
                    "type": notif_type,
                    "title": title,
                    "message": message,
                    "order_id": order_id,
                    "created_at": notification.created_at.isoformat() if hasattr(notification, "created_at") else timezone.now().isoformat(),
                })
            if order_id and send_order_update:
                send_order_update(order_id, {"order_id": order_id, "status": "test_update", "message": message})
        except Exception as e:
            # log but don't fail
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Failed to send real-time test notification: {str(e)}")

        return Response(NotificationSerializer(notification).data, status=201)
