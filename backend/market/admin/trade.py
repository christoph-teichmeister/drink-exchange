from ambient_toolbox.admin.model_admins.mixins import CommonInfoAdminMixin
from django.contrib import admin

from market.models import Trade
from market.services.trading import apply_trade


@admin.register(Trade)
class TradeAdmin(CommonInfoAdminMixin, admin.ModelAdmin):
    """Surfaces completed trades and lets staff record purchases that move the market."""

    list_display = ("drink", "bar", "price", "qty", "occurred_at")
    list_filter = ("bar",)
    ordering = ("-occurred_at",)

    def get_fields(self, request, obj=None):
        # New trades only need drink and quantity; bar, price and time are derived when the trade is applied.
        if obj is None:
            return ("drink", "qty")
        return super().get_fields(request, obj)

    def save_model(self, request, obj, form, change):
        if change:
            super().save_model(request, obj, form, change)
            return
        trade, _drinks = apply_trade(obj.drink.bar, obj.drink, obj.qty)
        # Hand the stored row back to the admin so its redirect and change log point at the real trade.
        obj.pk = trade.pk
        obj.bar = trade.bar
        obj.price = trade.price
        obj.occurred_at = trade.occurred_at
