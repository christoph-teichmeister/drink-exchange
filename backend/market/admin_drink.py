from django.contrib import admin

from backend.market.models import Drink


@admin.register(Drink)
class DrinkAdmin(admin.ModelAdmin):
    """Configures admin listing behavior for drinks."""
    list_display = ("name", "bar", "base_price")
    list_filter = ("bar",)
