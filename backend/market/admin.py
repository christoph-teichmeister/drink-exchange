from django.contrib import admin

from backend.market.models import Drink, Trade


@admin.register(Drink)
class DrinkAdmin(admin.ModelAdmin):
    list_display = ("name", "bar", "base_price")
    list_filter = ("bar",)


@admin.register(Trade)
class TradeAdmin(admin.ModelAdmin):
    list_display = ("drink", "bar", "price", "quantity", "executed_at")
    list_filter = ("bar",)
    ordering = ("-executed_at",)
