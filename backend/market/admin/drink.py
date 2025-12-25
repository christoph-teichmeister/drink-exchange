from ambient_toolbox.admin.model_admins.mixins import CommonInfoAdminMixin
from django.contrib import admin

from market.models import Drink


@admin.register(Drink)
class DrinkAdmin(CommonInfoAdminMixin, admin.ModelAdmin):
    """Configures admin listing behavior for drinks."""

    list_display = ("name", "bar", "base_price")
    list_filter = ("bar",)
