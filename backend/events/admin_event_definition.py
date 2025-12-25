from django.contrib import admin

from backend.events.models import EventDefinition


@admin.register(EventDefinition)
class EventDefinitionAdmin(admin.ModelAdmin):
    """Manages event definitions within the Django admin."""
    list_display = ("name",)
    search_fields = ("name",)
