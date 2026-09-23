from django.db.models import Prefetch
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.views.decorators.http import require_safe

from api.decorators import json_login_required
from bars.models import Bar, BarAssignment
from events.models import ActiveEvent
from market.models import Drink, PricePoint
from market.serializers import HISTORY_LIMIT

_BAR_ACCESS_DENIED = _("You are not assigned to this bar.")


@json_login_required
@require_safe
def bar_market_snapshot(request, bar_id: str):
    bar = get_object_or_404(Bar, slug=bar_id)
    if not BarAssignment.objects.filter(user=request.user, bar=bar).exists():
        return JsonResponse({"detail": _BAR_ACCESS_DENIED}, status=403)

    # Use the same source of truth as the WebSocket feed: the tick-maintained current price plus the
    # recorded price points, limited to the newest entries.
    points_prefetch = Prefetch(
        "price_points",
        queryset=PricePoint.objects.order_by("-recorded_at")[:HISTORY_LIMIT],
        to_attr="recent_points",
    )

    drinks = Drink.objects.filter(bar=bar).order_by("name").prefetch_related(points_prefetch)
    now = timezone.now()
    last_updated = bar.last_tick_at or now
    drink_payload = []

    for drink in drinks:
        points = getattr(drink, "recent_points", [])
        latest_price = drink.current_price if drink.current_price is not None else drink.base_price
        # The newest point usually mirrors the current price; the one before it is the previous tick.
        previous_price = latest_price
        if points and points[0].price != latest_price:
            previous_price = points[0].price
        elif len(points) > 1:
            previous_price = points[1].price

        delta = float(latest_price - previous_price)
        trend = "flat"
        if delta > 0:
            trend = "up"
        elif delta < 0:
            trend = "down"

        history = [
            {"timestamp": point.recorded_at.isoformat(), "price": float(point.price)} for point in reversed(points)
        ]

        if not history:
            history = [{"timestamp": now.isoformat(), "price": float(latest_price)}]

        drink_payload.append(
            {
                "id": str(drink.id),
                "name": drink.name,
                "price": float(latest_price),
                "delta": delta,
                "trend": trend,
                "history": history,
            }
        )

    active_events = ActiveEvent.objects.filter(bar=bar).select_related("definition").order_by("-starts_at")[:4]

    event_payload = [
        {
            "title": event.definition.name,
            "description": event.definition.description,
            "status": "running" if event.is_active else "ended",
            "starts_at": event.starts_at.isoformat(),
            "ends_at": event.ends_at.isoformat(),
        }
        for event in active_events
    ]

    snapshot = {
        "bar": {"id": bar.id, "slug": bar.slug, "name": bar.name},
        "drinks": drink_payload,
        "events": event_payload,
        "updated_at": last_updated.isoformat(),
    }

    return JsonResponse(snapshot)


@json_login_required
@require_safe
def bar_list(request):
    assignments = BarAssignment.objects.filter(user=request.user).select_related("bar").order_by("bar__name")
    bars = [
        {"slug": assignment.bar.slug, "name": assignment.bar.name, "description": assignment.bar.description}
        for assignment in assignments
    ]
    return JsonResponse({"bars": bars})
