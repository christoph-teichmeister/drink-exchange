from ambient_toolbox.admin.model_admins.mixins import CommonInfoAdminMixin
from django.contrib import admin

from backend.events.models import ActiveEvent


@admin.register(ActiveEvent)
class ActiveEventAdmin(CommonInfoAdminMixin, admin.ModelAdmin):
    """Surfaces active events so staff can review and filter them."""
    list_display = ("definition", "bar", "starts_at", "ends_at", "is_active")
    list_filter = ("bar", "is_active")
