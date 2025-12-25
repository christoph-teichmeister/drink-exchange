from django.db import models
from django.utils.translation import gettext_lazy as _

from backend.bars.models import Bar


class Drink(models.Model):
    bar = models.ForeignKey(Bar, on_delete=models.CASCADE, related_name="drinks")
    name = models.CharField(max_length=128)
    base_price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]
        verbose_name = _("drink")
        verbose_name_plural = _("drinks")

    def __str__(self) -> str:
        return f"{self.name} ({self.bar.slug})"


class Trade(models.Model):
    drink = models.ForeignKey(Drink, on_delete=models.CASCADE, related_name="trades")
    bar = models.ForeignKey(Bar, on_delete=models.CASCADE, related_name="trades")
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField()
    executed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-executed_at"]
        verbose_name = _("trade")
        verbose_name_plural = _("trades")

    def __str__(self) -> str:
        return f"{self.quantity}x {self.drink.name} @ {self.price}"
