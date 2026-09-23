import json

from django.http import HttpRequest, JsonResponse
from django.utils.translation import gettext_lazy as _


def parse_json_body(request: HttpRequest) -> dict:
    """Decode a JSON object body; anything malformed or non-object becomes an empty dict."""
    try:
        payload = json.loads(request.body.decode("utf-8") or "{}")
    except (json.JSONDecodeError, UnicodeDecodeError):
        return {}
    return payload if isinstance(payload, dict) else {}


def unsupported_media_type() -> JsonResponse:
    return JsonResponse({"detail": _("Requests must be sent as application/json.")}, status=415)
