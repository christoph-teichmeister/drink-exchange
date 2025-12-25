from ambient_toolbox.admin.model_admins.mixins import CommonInfoAdminMixin
from market.models import Trade
from django.contrib import admin


@admin.register(Trade)
class TradeAdmin(CommonInfoAdminMixin, admin.ModelAdmin):
    """Surfaces completed trades for quick inspection."""

    list_display = ("drink", "bar", "price", "quantity", "executed_at")
    list_filter = ("bar",)
    ordering = ("-executed_at",)
