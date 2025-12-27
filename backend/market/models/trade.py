from decimal import Decimal

from ambient_toolbox.models import CommonInfo
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from bars.models import Bar
from market.models.drink import Drink


class Trade(CommonInfo):
    """Log each completed drink trade so dashboards can surface the latest activity."""

    drink = models.ForeignKey(Drink, on_delete=models.CASCADE, related_name="trades")
    bar = models.ForeignKey(Bar, on_delete=models.CASCADE, related_name="trades")
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    qty = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
    )
    occurred_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-occurred_at"]  # Keep recent trades at the top of summaries.
        indexes = [models.Index(fields=["bar", "occurred_at"], name="market_trade_bar_occurred_idx")]
        verbose_name = _("trade")
        verbose_name_plural = _("trades")

    def __str__(self) -> str:
        return f"{self.qty}x {self.drink.name} @ {self.price}"
