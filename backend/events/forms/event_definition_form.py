from decimal import Decimal, InvalidOperation

from django import forms
from django.utils.translation import gettext_lazy as _

from events.models import EventDefinition
from market.models import Drink

ALLOWED_PARAMS = {"start_multiplier", "target_drink_ids"}


class EventDefinitionForm(forms.ModelForm):
    """Validates an event definition of one bar, including its limited `params`.

    `params` may only carry `start_multiplier` (number > 0) and, for focus events, `target_drink_ids` (drinks of the
    same bar). The bar is taken from the instance, never from user input.
    """

    class Meta:
        model = EventDefinition
        fields = ["name", "description", "type", "probability_weight", "duration_seconds", "cooldown_seconds", "params"]

    def clean_name(self):
        name = self.cleaned_data["name"]
        # The (bar, name) unique constraint is skipped by ModelForm validation because `bar` is not a form field.
        duplicates = EventDefinition.objects.filter(bar=self.instance.bar, name=name).exclude(pk=self.instance.pk)
        if duplicates.exists():
            raise forms.ValidationError(_("An event with this name already exists for this bar."))
        return name

    def clean_params(self):
        params = self.cleaned_data.get("params") or {}
        if not isinstance(params, dict):
            raise forms.ValidationError(_("Parameters must be an object."))
        unknown = set(params) - ALLOWED_PARAMS
        if unknown:
            raise forms.ValidationError(
                _("Unsupported parameters: %(keys)s."), params={"keys": ", ".join(sorted(unknown))}
            )
        cleaned = {}
        if "start_multiplier" in params:
            value = params["start_multiplier"]
            try:
                multiplier = Decimal(str(value)) if not isinstance(value, bool) else None
            except InvalidOperation:
                multiplier = None
            if multiplier is None or not multiplier.is_finite() or multiplier <= 0:
                raise forms.ValidationError(_("The start multiplier must be a number greater than 0."))
            cleaned["start_multiplier"] = float(multiplier)
        if "target_drink_ids" in params:
            targets = params["target_drink_ids"]
            if not isinstance(targets, list) or any(
                isinstance(item, bool) or not isinstance(item, int) for item in targets
            ):
                raise forms.ValidationError(_("Target drinks must be a list of drink ids."))
            cleaned["target_drink_ids"] = sorted(set(targets))
        return cleaned

    def clean(self):
        cleaned_data = super().clean()
        params = cleaned_data.get("params")
        if params is None:
            return cleaned_data
        targets = params.get("target_drink_ids")
        if cleaned_data.get("type") != EventDefinition.EventType.FOCUS:
            # Only focus events target specific drinks.
            params.pop("target_drink_ids", None)
        elif targets:
            known = set(Drink.objects.filter(bar=self.instance.bar, pk__in=targets).values_list("pk", flat=True))
            if known != set(targets):
                self.add_error("params", _("Target drinks must belong to this bar."))
        return cleaned_data
