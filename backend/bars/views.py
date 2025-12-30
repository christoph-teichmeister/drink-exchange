from django.db.models import Prefetch
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.http import require_safe

from bars.models import Bar
from events.models import ActiveEvent
from market.models import Drink, Trade


def bar_market_snapshot(request, bar_id: str):
    bar = get_object_or_404(Bar, slug=bar_id)

    trades_prefetch = Prefetch("trades", queryset=Trade.objects.order_by("-occurred_at"), to_attr="recent_trades")

    drinks = Drink.objects.filter(bar=bar).prefetch_related(trades_prefetch)
    now = timezone.now()
    last_updated = now
    drink_payload = []

    for drink in drinks:
        trades = getattr(drink, "recent_trades", [])[:12]
        latest_price = drink.base_price
        previous_price = drink.base_price
        if trades:
            latest_price = trades[0].price
            previous_price = trades[1].price if len(trades) > 1 else drink.base_price
            last_updated = max(last_updated, trades[0].occurred_at)

        delta = float(latest_price - previous_price)
        trend = "flat"
        if delta > 0:
            trend = "up"
        elif delta < 0:
            trend = "down"

        history = [
            {"timestamp": trade.occurred_at.isoformat(), "price": float(trade.price)} for trade in reversed(trades)
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


@require_safe
def bar_list(request):
    bars = list(Bar.objects.order_by("name").values("slug", "name", "description"))
    return JsonResponse({"bars": bars})
