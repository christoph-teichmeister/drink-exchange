from django.contrib import admin

from backend.market.models import Drink, Trade


@admin.register(Drink)
class DrinkAdmin(admin.ModelAdmin):
    """Configures admin listing behavior for drinks."""
    list_display = ("name", "bar", "base_price")
    list_filter = ("bar",)


@admin.register(Trade)
class TradeAdmin(admin.ModelAdmin):
    """Surfaces completed trades for quick inspection."""
    list_display = ("drink", "bar", "price", "quantity", "executed_at")
    list_filter = ("bar",)
    ordering = ("-executed_at",)
