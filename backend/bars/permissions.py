from functools import wraps

from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils.translation import gettext_lazy as _

from bars.models import Bar, BarAssignment

BAR_ACCESS_DENIED = _("You are not assigned to this bar.")
MANAGER_REQUIRED = _("Only bar managers can change the market configuration.")


def assignment_role(user, bar: Bar) -> str | None:
    """Return the user's effective role for the bar, or None when they are not assigned.

    Superusers count as managers for every bar they are assigned to.
    """

    assignment = BarAssignment.objects.filter(user=user, bar=bar).only("role").first()
    if assignment is None:
        return None
    if user.is_superuser:
        return BarAssignment.Role.MANAGER
    return assignment.role


def bar_manager_required(view_func):
    """Resolve `bar_id` (slug) to a Bar and require the manager role; the view receives the Bar instance.

    Expects `json_login_required` to run first so anonymous users get 401.
    """

    @wraps(view_func)
    def _wrapped(request, bar_id: str, *args, **kwargs):
        bar = get_object_or_404(Bar, slug=bar_id)
        role = assignment_role(request.user, bar)
        if role is None:
            return JsonResponse({"detail": BAR_ACCESS_DENIED}, status=403)
        if role != BarAssignment.Role.MANAGER:
            return JsonResponse({"detail": MANAGER_REQUIRED}, status=403)
        return view_func(request, bar, *args, **kwargs)

    return _wrapped
