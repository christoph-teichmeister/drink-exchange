from django.contrib import admin
from django.urls import path

from api.views import (
    current_user,
    login_user,
    logout_user,
    set_user_language,
)
from bars.config_views import bar_drink_detail, bar_drinks, bar_event_detail, bar_events, bar_settings
from bars.views import bar_list, bar_market_snapshot, bar_record_trade

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
    path("api/bars/<slug:bar_id>/trades/", bar_record_trade, name="bar-record-trade"),
    path("api/bars/<slug:bar_id>/settings/", bar_settings, name="bar-settings"),
    path("api/bars/<slug:bar_id>/drinks/", bar_drinks, name="bar-drinks"),
    path("api/bars/<slug:bar_id>/drinks/<int:drink_id>/", bar_drink_detail, name="bar-drink-detail"),
    path("api/bars/<slug:bar_id>/events/", bar_events, name="bar-events"),
    path("api/bars/<slug:bar_id>/events/<int:event_id>/", bar_event_detail, name="bar-event-detail"),
    path("api/locale/", set_user_language, name="set-user-language"),
]
