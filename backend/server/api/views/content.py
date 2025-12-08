from rest_framework import viewsets
from rest_framework.permissions import IsAdminUser

from api.models import BlogPost
from api.serializers import BlogPostSerializer


class BlogPostViewSet(viewsets.ModelViewSet):
    queryset = BlogPost.objects.all().order_by("-published_at")
    serializer_class = BlogPostSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return []
        return [IsAdminUser()]


