from ambient_toolbox.admin.model_admins.mixins import CommonInfoAdminMixin
from django.contrib import admin

from bars.models import BarAssignment


@admin.register(BarAssignment)
class BarAssignmentAdmin(CommonInfoAdminMixin, admin.ModelAdmin):
    """Controls admin list rendering for bar assignments."""

    list_display = ("user", "bar", "role")
    list_filter = ("bar", "role", "user")
    search_fields = ("user__username", "bar__name")
