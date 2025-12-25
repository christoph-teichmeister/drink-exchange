from django.db import models
from django.utils.translation import gettext_lazy as _

from backend.bars.models import Bar
from backend.market.models.drink import Drink


class Trade(models.Model):
    """Log each completed drink trade so dashboards can display the most recent activity."""

    drink = models.ForeignKey(Drink, on_delete=models.CASCADE, related_name="trades")
    bar = models.ForeignKey(Bar, on_delete=models.CASCADE, related_name="trades")
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField()
    executed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-executed_at"]  # Keep recent trades at the top of summaries.
        verbose_name = _("trade")
        verbose_name_plural = _("trades")

    def __str__(self) -> str:
        return f"{self.quantity}x {self.drink.name} @ {self.price}"
