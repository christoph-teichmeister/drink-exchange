from django.apps import AppConfig


class MarketConfig(AppConfig):
    """Configuration for the market domain and its workers."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "market"
