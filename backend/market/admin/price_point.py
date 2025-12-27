from ambient_toolbox.admin.model_admins.mixins import CommonInfoAdminMixin
from django.contrib import admin

from market.models import PricePoint


@admin.register(PricePoint)
class PricePointAdmin(CommonInfoAdminMixin, admin.ModelAdmin):
    """Surface recent price points for debugging and retention audits."""

    list_display = ("drink", "bar", "price", "recorded_at")
    list_filter = ("bar",)
