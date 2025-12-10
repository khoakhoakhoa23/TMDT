from django.contrib import admin
from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("id", "order", "user", "payment_method", "amount", "status", "created_at", "paid_at")
    list_filter = ("payment_method", "status", "created_at")
    search_fields = ("transaction_id", "order__id", "user__username")
    readonly_fields = ("created_at", "updated_at", "paid_at", "callback_data")
    list_editable = ("status",)

