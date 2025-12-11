from django.contrib.auth.models import User
from rest_framework import generics, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response

from users.serializers import RegisterSerializer, UserSerializer


class RegisterAPIView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_role(request):
    user = request.user
    role = "user"
    if user.is_superuser:
        role = "admin"
    elif user.is_staff:
        role = "staff"
    return Response({"username": user.username, "role": role})


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet để quản lý tất cả tài khoản User (CRUD - chỉ admin)
    """
    queryset = User.objects.all().order_by("-date_joined")
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]

    def perform_create(self, serializer):
        """Tạo user mới với password"""
        password = self.request.data.get('password')
        user = serializer.save()
        if password:
            user.set_password(password)
            user.save()

    def perform_update(self, serializer):
        """Cập nhật user, bao gồm password nếu có"""
        password = self.request.data.get('password')
        user = serializer.save()
        if password:
            user.set_password(password)
            user.save()


