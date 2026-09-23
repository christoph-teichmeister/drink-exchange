import os

from django.core.exceptions import ImproperlyConfigured

from config.settings.base import *  # noqa: F401,F403
from config.settings.base import SECRET_KEY


def _env_bool(name: str, default: bool) -> bool:
    return os.environ.get(name, str(default)).lower() in ("1", "true", "yes")


def _env_list(name: str) -> list[str]:
    return [item.strip() for item in os.environ.get(name, "").split(",") if item.strip()]


DEBUG = False
ALLOWED_HOSTS = _env_list("DJANGO_ALLOWED_HOSTS")

# Refuse to boot with the placeholder key from .env.example / base settings.
if not SECRET_KEY or SECRET_KEY.startswith("django-insecure"):
    raise ImproperlyConfigured("DJANGO_SECRET_KEY must be set to a strong, unique value in production.")

CSRF_TRUSTED_ORIGINS = _env_list("DJANGO_CSRF_TRUSTED_ORIGINS")

# TLS is expected to terminate at a reverse proxy that sets X-Forwarded-Proto.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = _env_bool("DJANGO_SECURE_SSL_REDIRECT", True)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = int(os.environ.get("DJANGO_SECURE_HSTS_SECONDS", "31536000"))
SECURE_HSTS_INCLUDE_SUBDOMAINS = _env_bool("DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS", False)
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "same-origin"
