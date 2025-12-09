from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from orders.models import BaoHanh
from orders.serializers import BaoHanhSerializer
from core.views_permissions import IsNhanVien


class BaoHanhViewSet(viewsets.ModelViewSet):
    queryset = BaoHanh.objects.all()
    serializer_class = BaoHanhSerializer
    permission_classes = [IsAuthenticated, IsNhanVien]


