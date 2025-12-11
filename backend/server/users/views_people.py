from rest_framework import viewsets
from rest_framework.permissions import IsAdminUser, IsAuthenticated

from users.models import NhanVien, KhachHang, NCC
from users.serializers import NhanVienSerializer, KhachHangSerializer, NCCSerializer


class NhanVienViewSet(viewsets.ModelViewSet):
    queryset = NhanVien.objects.all()
    serializer_class = NhanVienSerializer
    permission_classes = [IsAdminUser]


class KhachHangViewSet(viewsets.ModelViewSet):
    queryset = KhachHang.objects.all()
    serializer_class = KhachHangSerializer
    permission_classes = [IsAuthenticated]


class NCCViewSet(viewsets.ModelViewSet):
    queryset = NCC.objects.all()
    serializer_class = NCCSerializer
    permission_classes = [IsAdminUser]


