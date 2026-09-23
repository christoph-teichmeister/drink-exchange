from django import forms

from market.models import Drink
from market.services.price_math import clamp_price


class DrinkConfigForm(forms.ModelForm):
    """Validates a drink's configuration; the bounds rules on `Drink` stay the single source of truth.

    `current_price` is not user input: new drinks start at their base price, and on edits the live price is clamped
    into the (possibly changed) bounds before the model validation runs.
    """

    class Meta:
        model = Drink
        fields = ["name", "base_price", "min_price", "max_price", "volatility", "weight", "rounding_step"]

    def clean(self):
        cleaned_data = super().clean()
        base, minimum, maximum = (cleaned_data.get(key) for key in ("base_price", "min_price", "max_price"))
        if base is not None and minimum is not None and maximum is not None and minimum <= maximum:
            current = self.instance.current_price if self.instance.pk and self.instance.current_price else base
            self.instance.current_price = clamp_price(current, minimum, maximum)
        return cleaned_data
