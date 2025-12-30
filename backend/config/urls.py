from django.contrib import admin
from django.urls import path

from api.views import set_user_language
from bars.views import bar_list, bar_market_snapshot

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/bars/", bar_list, name="bar-list"),
    path(
        "api/bars/<slug:bar_id>/market/",
        bar_market_snapshot,
        name="bar-market-snapshot",
    ),
    path("api/locale/", set_user_language, name="set-user-language"),
]
