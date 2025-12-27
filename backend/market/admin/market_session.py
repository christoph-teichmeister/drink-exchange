from ambient_toolbox.admin.model_admins.mixins import CommonInfoAdminMixin
from django.contrib import admin

from market.models import MarketSession


@admin.register(MarketSession)
class MarketSessionAdmin(CommonInfoAdminMixin, admin.ModelAdmin):
    """Exposes market session metadata so staff can inspect runtime windows."""

    list_display = ("bar", "status", "started_at", "ended_at")
    list_filter = ("bar", "status")
