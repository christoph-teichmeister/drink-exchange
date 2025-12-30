import json
from typing import Optional

from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.http import HttpRequest, JsonResponse
from django.utils.translation import gettext_lazy as _
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from api.decorators import json_login_required


def _default_language() -> str:
    if settings.LANGUAGES:
        return settings.LANGUAGES[0][0]
    return settings.LANGUAGE_CODE


def _match_supported_language(language_code: Optional[str]) -> str:
    if not language_code:
        return _default_language()

    normalized = language_code.lower()
    for code, label in settings.LANGUAGES:
        candidate = code.lower()
        if normalized == candidate or normalized.startswith(f"{candidate}-"):
            return code

    return _default_language()


def _parse_json_body(request: HttpRequest) -> dict:
    if request.content_type != "application/json":
        return {}

    try:
        return json.loads(request.body.decode("utf-8") or "{}")
    except json.JSONDecodeError:
        return {}


@csrf_exempt
@require_POST
def login_user(request: HttpRequest) -> JsonResponse:
    payload = _parse_json_body(request)
    username = payload.get("username") or request.POST.get("username")
    password = payload.get("password") or request.POST.get("password")
    if not username or not password:
        return JsonResponse(
            {"detail": _("Username and password are required.")},
            status=400,
        )

    user = authenticate(request, username=username, password=password)
    if user is None:
        return JsonResponse({"detail": _("Invalid credentials.")}, status=400)
    if not user.is_active:
        return JsonResponse({"detail": _("Account is disabled.")}, status=403)

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
