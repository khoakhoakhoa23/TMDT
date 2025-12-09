import os
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status


ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def upload_media(request):
    file_obj = request.FILES.get("file")
    if not file_obj:
        return Response({"detail": "Thiếu file"}, status=status.HTTP_400_BAD_REQUEST)

    ext = os.path.splitext(file_obj.name)[1].lower()
    if ext not in ALLOWED_EXT:
        return Response({"detail": "Định dạng không hỗ trợ"}, status=status.HTTP_400_BAD_REQUEST)

    if file_obj.size > MAX_FILE_SIZE:
        return Response({"detail": "File quá lớn (tối đa 5MB)"}, status=status.HTTP_400_BAD_REQUEST)

    path = default_storage.save(f"uploads/{file_obj.name}", ContentFile(file_obj.read()))
    url = settings.MEDIA_URL + path
    return Response({"url": url}, status=status.HTTP_201_CREATED)


