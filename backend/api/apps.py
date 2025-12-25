from django.apps import AppConfig


class ApiConfig(AppConfig):
    """Configuration for the API surface exposed to clients."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "api"
