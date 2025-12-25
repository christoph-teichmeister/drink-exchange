from django.contrib import admin

from backend.events.models import ActiveEvent, EventDefinition


@admin.register(EventDefinition)
class EventDefinitionAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ("name",)


@admin.register(ActiveEvent)
class ActiveEventAdmin(admin.ModelAdmin):
    list_display = ("definition", "bar", "starts_at", "ends_at", "is_active")
    list_filter = ("bar", "is_active")
