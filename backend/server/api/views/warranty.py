from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from api.models import BaoHanh
from api.serializers import BaoHanhSerializer
from .permissions import IsNhanVien


class BaoHanhViewSet(viewsets.ModelViewSet):
    queryset = BaoHanh.objects.all()
    serializer_class = BaoHanhSerializer
    permission_classes = [IsAuthenticated, IsNhanVien]


