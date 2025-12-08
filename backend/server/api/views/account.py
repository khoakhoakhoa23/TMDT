from rest_framework import viewsets
from rest_framework.permissions import IsAdminUser

from api.models import Admin
from api.serializers import AdminSerializer


class AdminViewSet(viewsets.ModelViewSet):
    queryset = Admin.objects.all()
    serializer_class = AdminSerializer
    permission_classes = [IsAdminUser]


