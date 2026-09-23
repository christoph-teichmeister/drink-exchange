from typing import Optional

from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.http import HttpRequest, JsonResponse
from django.utils.translation import gettext_lazy as _
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from api.decorators import json_login_required
from api.json_body import parse_json_body, unsupported_media_type


def _default_language() -> str:
    if settings.LANGUAGES:
        return settings.LANGUAGES[0][0]
    return settings.LANGUAGE_CODE


def _match_supported_language(language_code: Optional[str]) -> str:
    if not language_code:
        return _default_language()

    normalized = language_code.lower()
    for code, _label in settings.LANGUAGES:
        candidate = code.lower()
        if normalized == candidate or normalized.startswith(f"{candidate}-"):
            return code

    return _default_language()


# These endpoints are CSRF-exempt so the cross-origin SvelteKit frontend can call them without a token
# handshake. They only accept `application/json` bodies instead: browsers cannot send that content type
# cross-site without a CORS preflight, which CORS_ALLOWED_ORIGINS rejects for foreign origins. That blocks
# login CSRF (forging a login into an attacker-controlled account) via plain HTML forms.
@csrf_exempt
@require_POST
def login_user(request: HttpRequest) -> JsonResponse:
    if request.content_type != "application/json":
        return unsupported_media_type()
    payload = parse_json_body(request)
    username = payload.get("username")
    password = payload.get("password")
    if not username or not password:
        return JsonResponse(
            {"detail": _("Username and password are required.")},
            status=400,
        )

    # authenticate() already returns None for inactive users, so no separate is_active check is needed.
    user = authenticate(request, username=username, password=password)
    if user is None:
        return JsonResponse({"detail": _("Invalid credentials.")}, status=400)

    login(request, user)
    return JsonResponse(
        {
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
        }
    )


@csrf_exempt
@require_POST
def logout_user(request: HttpRequest) -> JsonResponse:
    logout(request)
    return JsonResponse({"detail": _("Logged out.")})


@json_login_required
@require_GET
def current_user(request: HttpRequest) -> JsonResponse:
    user = request.user
    return JsonResponse(
        {
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
        }
    )


@csrf_exempt
@require_POST
def set_user_language(request: HttpRequest) -> JsonResponse:
    if request.content_type != "application/json":
        return unsupported_media_type()
    requested_language = parse_json_body(request).get("language")

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
