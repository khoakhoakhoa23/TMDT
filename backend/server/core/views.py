from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Notification
from .serializers import NotificationSerializer


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
