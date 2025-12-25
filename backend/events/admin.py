from django.contrib import admin

from backend.events.models import ActiveEvent, EventDefinition


@admin.register(EventDefinition)
class EventDefinitionAdmin(admin.ModelAdmin):
    """Manages event definitions within the Django admin."""
    list_display = ("name",)
    search_fields = ("name",)


@admin.register(ActiveEvent)
class ActiveEventAdmin(admin.ModelAdmin):
    """Surfaces active events so staff can review and filter them."""
    list_display = ("definition", "bar", "starts_at", "ends_at", "is_active")
    list_filter = ("bar", "is_active")
