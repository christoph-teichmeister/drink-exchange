from functools import wraps

from django.http import JsonResponse
from django.utils.translation import gettext_lazy as _


def json_login_required(view_func):
    @wraps(view_func)
    def _wrapped(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({"detail": _("Authentication required.")}, status=401)
        return view_func(request, *args, **kwargs)

    return _wrapped
