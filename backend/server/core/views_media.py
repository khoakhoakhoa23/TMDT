import os
import uuid
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status


ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def upload_media(request):
    """
    Upload ảnh từ máy tính
    POST /api/upload/
    Body: multipart/form-data với field 'file'
    """
    file_obj = request.FILES.get("file")
    if not file_obj:
        return Response({"detail": "Thiếu file"}, status=status.HTTP_400_BAD_REQUEST)

    ext = os.path.splitext(file_obj.name)[1].lower()
    if ext not in ALLOWED_EXT:
        return Response(
            {"detail": f"Định dạng không hỗ trợ. Chỉ chấp nhận: {', '.join(ALLOWED_EXT)}"}, 
            status=status.HTTP_400_BAD_REQUEST
        )

    if file_obj.size > MAX_FILE_SIZE:
        return Response(
            {"detail": f"File quá lớn (tối đa {MAX_FILE_SIZE // (1024*1024)}MB)"}, 
            status=status.HTTP_400_BAD_REQUEST
        )

    # Tạo tên file unique để tránh trùng
    file_name = file_obj.name
    file_base, file_ext = os.path.splitext(file_name)
    unique_name = f"{file_base}_{uuid.uuid4().hex[:8]}{file_ext}"
    
    # Lưu file vào thư mục uploads/
    path = default_storage.save(f"uploads/{unique_name}", ContentFile(file_obj.read()))
    
    # Tạo URL đầy đủ
    if request:
        url = request.build_absolute_uri(settings.MEDIA_URL + path)
    else:
        url = settings.MEDIA_URL + path
    
    return Response({
        "url": url,
        "path": path,
        "filename": unique_name
    }, status=status.HTTP_201_CREATED)


