from django.db import models


class CarImage(models.Model):
    """Ảnh của xe - mỗi xe có thể có nhiều ảnh"""
    xe = models.ForeignKey("Xe", on_delete=models.CASCADE, related_name="car_images")
    image = models.ImageField(upload_to="cars/", help_text="Upload ảnh xe")
    image_url = models.URLField(max_length=500, blank=True, help_text="URL ảnh (nếu có)")
    is_primary = models.BooleanField(default=False, help_text="Ảnh chính")
    order = models.IntegerField(default=0, help_text="Thứ tự hiển thị")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["is_primary", "-order", "created_at"]
        verbose_name = "Ảnh xe"
        verbose_name_plural = "Ảnh xe"
        indexes = [
            models.Index(fields=["xe", "is_primary"]),
        ]

    def __str__(self):
        return f"{self.xe.ten_xe} - Image {self.id}"

    def save(self, *args, **kwargs):
        # Nếu set is_primary=True, bỏ primary của các ảnh khác
        if self.is_primary:
            CarImage.objects.filter(xe=self.xe, is_primary=True).exclude(pk=self.pk).update(is_primary=False)
        super().save(*args, **kwargs)


