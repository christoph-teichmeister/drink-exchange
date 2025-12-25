from django.contrib import admin

from backend.bars.models import Bar


@admin.register(Bar)
class BarAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    search_fields = ("name", "slug")
