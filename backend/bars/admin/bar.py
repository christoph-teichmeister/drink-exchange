from ambient_toolbox.admin.model_admins.mixins import CommonInfoAdminMixin
from bars.models import Bar
from django.contrib import admin


@admin.register(Bar)
class BarAdmin(CommonInfoAdminMixin, admin.ModelAdmin):
    """Controls admin list rendering for bars."""

    list_display = ("name", "slug")
    search_fields = ("name", "slug")
