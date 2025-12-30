import json
from typing import Optional

from django.conf import settings
from django.http import HttpRequest, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST


def _default_language() -> str:
    if settings.LANGUAGES:
        return settings.LANGUAGES[0][0]
    return settings.LANGUAGE_CODE


def _match_supported_language(language_code: Optional[str]) -> str:
    if not language_code:
        return _default_language()

    normalized = language_code.lower()
    for code, _ in settings.LANGUAGES:
        candidate = code.lower()
        if normalized == candidate or normalized.startswith(f"{candidate}-"):
            return code

    return _default_language()


@csrf_exempt
@require_POST
def set_user_language(request: HttpRequest) -> JsonResponse:
    requested_language = None
    if request.content_type == "application/json":
        try:
            payload = json.loads(request.body.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            payload = {}
        requested_language = payload.get("language")
    else:
        requested_language = request.POST.get("language")

    language_code = _match_supported_language(requested_language)
    response = JsonResponse({"language": language_code})
    response.set_cookie(
        settings.LANGUAGE_COOKIE_NAME,
        language_code,
        path="/",
        max_age=31536000,
        samesite="Lax",
    )
    response["Content-Language"] = language_code

    return response
