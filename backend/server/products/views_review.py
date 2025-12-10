from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.shortcuts import get_object_or_404

from products.models import Review, Xe
from products.serializers import ReviewSerializer, ReviewCreateSerializer


class ReviewViewSet(viewsets.ModelViewSet):
    """ViewSet cho Review"""
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [AllowAny]  # Cho phép xem reviews, nhưng chỉ authenticated user mới tạo được
    
    def get_permissions(self):
        """Chỉ authenticated user mới có thể tạo, cập nhật, xóa review"""
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAuthenticated()]
        return [AllowAny()]
    
    def get_queryset(self):
        """Filter reviews theo xe nếu có xe_id trong query params"""
        queryset = Review.objects.select_related("user", "xe").all()
        xe_id = self.request.query_params.get("xe_id")
        if xe_id:
            queryset = queryset.filter(xe_id=xe_id)
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Tạo review mới"""
        serializer = ReviewCreateSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            xe = serializer.validated_data["xe"]
            
            # Kiểm tra xem user đã đánh giá xe này chưa
            existing_review = Review.objects.filter(xe=xe, user=request.user).first()
            if existing_review:
                return Response(
                    {"detail": "Bạn đã đánh giá xe này rồi. Bạn có thể cập nhật đánh giá của mình."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            review = Review.objects.create(
                xe=xe,
                user=request.user,
                rating=serializer.validated_data["rating"],
                comment=serializer.validated_data["comment"]
            )
            
            return Response(
                ReviewSerializer(review, context={"request": request}).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def update(self, request, *args, **kwargs):
        """Chỉ cho phép user cập nhật review của chính mình"""
        review = self.get_object()
        if review.user != request.user:
            return Response(
                {"detail": "Bạn không có quyền cập nhật đánh giá này."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Chỉ cho phép user xóa review của chính mình"""
        review = self.get_object()
        if review.user != request.user:
            return Response(
                {"detail": "Bạn không có quyền xóa đánh giá này."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=False, methods=["get"])
    def by_car(self, request):
        """Lấy tất cả reviews của một xe cụ thể"""
        xe_id = request.query_params.get("xe_id")
        if not xe_id:
            return Response(
                {"detail": "Vui lòng cung cấp xe_id"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reviews = Review.objects.filter(xe_id=xe_id).select_related("user")
        serializer = self.get_serializer(reviews, many=True)
        return Response(serializer.data)

