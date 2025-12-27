from decimal import Decimal

from ambient_toolbox.models import CommonInfo
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models
from django.utils.translation import gettext_lazy as _

from bars.models import Bar


class Drink(CommonInfo):
    """Represents a bar-specific beverage and its current pricing metadata."""

    bar = models.ForeignKey(Bar, on_delete=models.CASCADE, related_name="drinks")
    name = models.CharField(max_length=128)
    base_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    current_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=False,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    min_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    max_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    volatility = models.DecimalField(
        max_digits=6,
        decimal_places=4,
        default=Decimal("0.05"),
        validators=[MinValueValidator(Decimal("0"))],
    )
    weight = models.DecimalField(
        max_digits=6,
        decimal_places=4,
        default=Decimal("1.00"),
        validators=[MinValueValidator(Decimal("0"))],
    )

    class Meta:
        ordering = ["bar", "name"]  # Keep drinks grouped per bar and sorted alphabetically.
        verbose_name = _("drink")
        verbose_name_plural = _("drinks")
        constraints = [
            models.CheckConstraint(
                condition=models.Q(min_price__lte=models.F("max_price")),
                name="market_drink_min_lte_max",
            ),
            models.CheckConstraint(
                condition=models.Q(min_price__lte=models.F("base_price"))
                & models.Q(base_price__lte=models.F("max_price")),
                name="market_drink_base_within",
            ),
            models.CheckConstraint(
                condition=models.Q(current_price__gte=models.F("min_price"))
                & models.Q(current_price__lte=models.F("max_price")),
                name="market_drink_current_within_bounds",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.bar.slug})"

    def full_clean(self, *args, **kwargs) -> None:
        self._ensure_current_price()
        super().full_clean(*args, **kwargs)

    def clean(self) -> None:
        super().clean()
        if self.min_price > self.max_price:
            raise ValidationError({"min_price": _("Minimum price cannot exceed the maximum price.")})
        if not (self.min_price <= self.base_price <= self.max_price):
            raise ValidationError({"base_price": _("Base price must sit between min and max price.")})
        if not (self.min_price <= self.current_price <= self.max_price):
            raise ValidationError({"current_price": _("Current price must remain between the configured bounds.")})

    def _ensure_current_price(self) -> None:
        if self.current_price is None and self.base_price is not None:
            self.current_price = self.base_price

    def save(self, *args, **kwargs) -> None:
        self.full_clean()
        super().save(*args, **kwargs)
