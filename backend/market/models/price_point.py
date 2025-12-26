from ambient_toolbox.models import CommonInfo
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from bars.models import Bar
from market.models.drink import Drink


class PricePoint(CommonInfo):
    """Stores a time-series checkpoint of a drink's price for analytics."""

    bar = models.ForeignKey(
        Bar,
        on_delete=models.CASCADE,
        related_name="price_points",
    )
    drink = models.ForeignKey(
        Drink,
        on_delete=models.CASCADE,
        related_name="price_points",
    )
    price = models.DecimalField(max_digits=10, decimal_places=2)
    recorded_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-recorded_at"]
        indexes = [
            models.Index(fields=["bar", "recorded_at"]),
            models.Index(fields=["drink", "recorded_at"]),
        ]
        verbose_name = _("price point")
        verbose_name_plural = _("price points")

    def __str__(self) -> str:
        return f"{self.drink.name} @ {self.price}"
