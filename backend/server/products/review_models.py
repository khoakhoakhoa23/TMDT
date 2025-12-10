from django.db import models
from django.contrib.auth.models import User


class Review(models.Model):
    """Đánh giá và nhận xét của khách hàng về xe"""
    xe = models.ForeignKey("Xe", on_delete=models.CASCADE, related_name="reviews")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reviews")
    rating = models.IntegerField(
        choices=[(1, "1 sao"), (2, "2 sao"), (3, "3 sao"), (4, "4 sao"), (5, "5 sao")],
        default=5,
        help_text="Đánh giá từ 1-5 sao"
    )
    comment = models.TextField(help_text="Nội dung đánh giá")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        unique_together = ("xe", "user")  # Mỗi user chỉ đánh giá 1 lần cho 1 xe
        verbose_name = "Đánh giá"
        verbose_name_plural = "Đánh giá"

    def __str__(self):
        return f"{self.user.username} - {self.xe.ten_xe} ({self.rating} sao)"


