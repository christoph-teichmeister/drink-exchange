from ambient_toolbox.admin.model_admins.mixins import CommonInfoAdminMixin
from django.contrib import admin

from market.models import Trade


@admin.register(Trade)
class TradeAdmin(CommonInfoAdminMixin, admin.ModelAdmin):
    """Surfaces completed trades for quick inspection."""

    list_display = ("drink", "bar", "price", "qty", "occurred_at")
    list_filter = ("bar",)
    ordering = ("-occurred_at",)
