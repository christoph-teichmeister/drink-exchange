from django.contrib import admin

from bars.bar_assignment import BarAssignment


@admin.register(BarAssignment)
class BarAssignmentAdmin(admin.ModelAdmin):
    list_display = ("user", "bar")
    list_filter = ("bar", "user")
    search_fields = ("user__username", "bar__name")
