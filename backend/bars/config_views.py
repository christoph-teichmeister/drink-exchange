from django.db import transaction
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404
from django.utils.translation import gettext_lazy as _
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from api.decorators import json_login_required
from api.json_body import parse_json_body, unsupported_media_type
from bars.config_payloads import bar_settings_payload, drink_config_payload, event_definition_payload
from bars.forms import BarSettingsForm
from bars.permissions import bar_manager_required
from events.forms import EventDefinitionForm
from events.models import EventDefinition
from market.forms import DrinkConfigForm
from market.models import Drink
from market.services import broadcast_bar_prices

_INVALID_INPUT = _("Please correct the highlighted fields.")
_DRINK_HAS_TRADES = _("This drink has recorded trades and cannot be deleted. Adjust its prices instead.")

# Market configuration endpoints for bar managers. Like the other write endpoints they are CSRF-exempt but only accept
# JSON bodies, which foreign origins cannot send without a CORS preflight that CORS_ALLOWED_ORIGINS rejects.


def _needs_json(request) -> bool:
    return request.method in ("POST", "PATCH") and request.content_type != "application/json"


def _form_data(instance, form_class, payload: dict) -> dict:
    """Start from the instance's current values so PATCH only needs to send the changed fields."""
    fields = form_class._meta.fields
    data = {field: getattr(instance, field) for field in fields}
    data.update({key: value for key, value in payload.items() if key in fields})
    return data


def _invalid(form) -> JsonResponse:
    errors = {
        ("non_field" if field == "__all__" else field): [entry["message"] for entry in messages]
        for field, messages in form.errors.get_json_data().items()
    }
    return JsonResponse({"detail": _INVALID_INPUT, "errors": errors}, status=400)


def _broadcast_after_commit(bar) -> None:
    transaction.on_commit(lambda: broadcast_bar_prices(bar))


@csrf_exempt
@json_login_required
@require_http_methods(["GET", "PATCH"])
@bar_manager_required
def bar_settings(request, bar):
    if request.method == "GET":
        return JsonResponse(bar_settings_payload(bar))
    if _needs_json(request):
        return unsupported_media_type()
    form = BarSettingsForm(_form_data(bar, BarSettingsForm, parse_json_body(request)), instance=bar)
    if not form.is_valid():
        return _invalid(form)
    form.save()
    return JsonResponse(bar_settings_payload(bar))


@csrf_exempt
@json_login_required
@require_http_methods(["GET", "POST"])
@bar_manager_required
def bar_drinks(request, bar):
    if request.method == "GET":
        drinks = Drink.objects.filter(bar=bar).order_by("name")
        return JsonResponse({"drinks": [drink_config_payload(drink) for drink in drinks]})
    if _needs_json(request):
        return unsupported_media_type()
    drink = Drink(bar=bar)
    form = DrinkConfigForm(_form_data(drink, DrinkConfigForm, parse_json_body(request)), instance=drink)
    if not form.is_valid():
        return _invalid(form)
    with transaction.atomic():
        drink = form.save()
        _broadcast_after_commit(bar)
    return JsonResponse(drink_config_payload(drink), status=201)


@csrf_exempt
@json_login_required
@require_http_methods(["PATCH", "DELETE"])
@bar_manager_required
def bar_drink_detail(request, bar, drink_id: int):
    if _needs_json(request):
        return unsupported_media_type()
    with transaction.atomic():
        # Lock the row like the tick and apply_trade do, so a concurrent tick cannot overwrite the new bounds.
        drink = get_object_or_404(Drink.objects.select_for_update(), bar=bar, pk=drink_id)
        if request.method == "DELETE":
            if drink.trades.exists():
                return JsonResponse({"detail": _DRINK_HAS_TRADES}, status=409)
            drink.delete()
            _broadcast_after_commit(bar)
            return HttpResponse(status=204)
        form = DrinkConfigForm(_form_data(drink, DrinkConfigForm, parse_json_body(request)), instance=drink)
        if not form.is_valid():
            return _invalid(form)
        # The form already clamped the live price into the (possibly changed) bounds.
        drink = form.save()
        _broadcast_after_commit(bar)
    return JsonResponse(drink_config_payload(drink))


@csrf_exempt
@json_login_required
@require_http_methods(["GET", "POST"])
@bar_manager_required
def bar_events(request, bar):
    if request.method == "GET":
        definitions = EventDefinition.objects.filter(bar=bar).order_by("name")
        return JsonResponse({"events": [event_definition_payload(definition) for definition in definitions]})
    if _needs_json(request):
        return unsupported_media_type()
    definition = EventDefinition(bar=bar)
    form = EventDefinitionForm(
        _form_data(definition, EventDefinitionForm, parse_json_body(request)), instance=definition
    )
    if not form.is_valid():
        return _invalid(form)
    definition = form.save()
    return JsonResponse(event_definition_payload(definition), status=201)


@csrf_exempt
@json_login_required
@require_http_methods(["PATCH", "DELETE"])
@bar_manager_required
def bar_event_detail(request, bar, event_id: int):
    if _needs_json(request):
        return unsupported_media_type()
    definition = get_object_or_404(EventDefinition, bar=bar, pk=event_id)
    if request.method == "DELETE":
        definition.delete()
        return HttpResponse(status=204)
    form = EventDefinitionForm(
        _form_data(definition, EventDefinitionForm, parse_json_body(request)), instance=definition
    )
    if not form.is_valid():
        return _invalid(form)
    definition = form.save()
    return JsonResponse(event_definition_payload(definition))
