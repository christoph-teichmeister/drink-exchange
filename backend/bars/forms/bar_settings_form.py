from django import forms

from bars.models import Bar


class BarSettingsForm(forms.ModelForm):
    """Validates the market settings a bar manager may change."""

    class Meta:
        model = Bar
        fields = [
            "name",
            "description",
            "tick_interval_seconds",
            "reversion_rate",
            "impulse_factor",
            "normalization_factor",
            "price_point_retention_ticks",
        ]
