from ambient_toolbox.admin.model_admins.mixins import CommonInfoAdminMixin
from backend.market.models import Drink
from django.contrib import admin


@admin.register(Drink)
class DrinkAdmin(CommonInfoAdminMixin, admin.ModelAdmin):
    """Configures admin listing behavior for drinks."""

    list_display = ("name", "bar", "base_price")
    list_filter = ("bar",)
