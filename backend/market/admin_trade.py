from django.contrib import admin

from backend.market.models import Trade


@admin.register(Trade)
class TradeAdmin(admin.ModelAdmin):
    """Surfaces completed trades for quick inspection."""
    list_display = ("drink", "bar", "price", "quantity", "executed_at")
    list_filter = ("bar",)
    ordering = ("-executed_at",)
