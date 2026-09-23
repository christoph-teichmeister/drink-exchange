from decimal import Decimal

from ambient_toolbox.models import CommonInfo
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Bar(CommonInfo):
    """Represents a bar location with metadata."""

    slug = models.SlugField(max_length=64, unique=True)
    name = models.CharField(max_length=128)
    description = models.TextField(blank=True)
    tick_interval_seconds = models.PositiveSmallIntegerField(
        default=5,
        validators=[MinValueValidator(1)],
    )
    reversion_rate = models.DecimalField(
        max_digits=5,
        decimal_places=3,
        default=Decimal("0.100"),
        validators=[MinValueValidator(Decimal("0")), MaxValueValidator(Decimal("1"))],
    )
    last_tick_at = models.DateTimeField(null=True, blank=True)
    tick_counter = models.PositiveBigIntegerField(default=0)
    price_point_retention_ticks = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(0)],
    )

    class Meta:
        ordering = ["name"]  # Sort bars alphabetically for listings.

    def __str__(self) -> str:
        return self.name
