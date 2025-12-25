from django.db import models
from django.utils.translation import gettext_lazy as _

from backend.bars.models import Bar


class Drink(models.Model):
    """Represents a bar-specific beverage and its default pricing metadata."""

    bar = models.ForeignKey(Bar, on_delete=models.CASCADE, related_name="drinks")
    name = models.CharField(max_length=128)
    base_price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]  # Order drinks alphabetically per bar for consistent UIs.
        verbose_name = _("drink")
        verbose_name_plural = _("drinks")

    def __str__(self) -> str:
        return f"{self.name} ({self.bar.slug})"
