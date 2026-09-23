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

    drink = models.ForeignKey(
        Drink,
        on_delete=models.CASCADE,
        related_name="trades",
        verbose_name=_("drink"),
    )
    bar = models.ForeignKey(
        Bar,
        on_delete=models.CASCADE,
        related_name="trades",
        verbose_name=_("bar"),
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
        verbose_name=_("price"),
    )
    qty = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
        verbose_name=_("quantity"),
    )
    occurred_at = models.DateTimeField(
        default=timezone.now,
        verbose_name=_("occurred at"),
    )

    class Meta:
        ordering = ["-occurred_at"]  # Keep recent trades at the top of summaries.
        indexes = [models.Index(fields=["bar", "occurred_at"], name="market_trade_bar_occurred_idx")]
        verbose_name = _("trade")
        verbose_name_plural = _("trades")

    def __str__(self) -> str:
        return f"{self.qty}x {self.drink.name} @ {self.price}"
