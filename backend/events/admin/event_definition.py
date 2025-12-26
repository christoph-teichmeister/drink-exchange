from ambient_toolbox.admin.model_admins.mixins import CommonInfoAdminMixin
from django.contrib import admin

from events.models import EventDefinition


@admin.register(EventDefinition)
class EventDefinitionAdmin(CommonInfoAdminMixin, admin.ModelAdmin):
    """Manages event definitions within the Django admin."""

    list_display = ("name",)
    search_fields = ("name",)
