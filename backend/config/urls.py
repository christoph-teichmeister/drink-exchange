from django.contrib import admin
from django.urls import path

from api.views import (
    current_user,
    login_user,
    logout_user,
    set_user_language,
)
from bars.views import bar_list, bar_market_snapshot

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/login/", login_user, name="api-login"),
    path("api/auth/logout/", logout_user, name="api-logout"),
    path("api/auth/me/", current_user, name="api-current-user"),
    path("api/bars/", bar_list, name="bar-list"),
    path(
        "api/bars/<slug:bar_id>/market/",
        bar_market_snapshot,
        name="bar-market-snapshot",
    ),
    path("api/locale/", set_user_language, name="set-user-language"),
]
