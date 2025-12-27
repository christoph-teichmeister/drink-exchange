from django.contrib import admin
from django.urls import path

from bars.views import bar_market_snapshot

urlpatterns = [
    path("admin/", admin.site.urls),
    path(
        "api/bars/<slug:bar_id>/market/",
        bar_market_snapshot,
        name="bar-market-snapshot",
    ),
]
