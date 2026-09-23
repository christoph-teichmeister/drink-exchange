from decimal import Decimal

from ambient_toolbox.models import CommonInfo
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils.translation import gettext_lazy as _


class Bar(CommonInfo):
    """Represents a bar location with metadata."""

    slug = models.SlugField(
        max_length=64,
        unique=True,
        verbose_name=_("slug"),
    )
    name = models.CharField(
        max_length=128,
        verbose_name=_("name"),
    )
    description = models.TextField(
        blank=True,
        verbose_name=_("description"),
    )
    tick_interval_seconds = models.PositiveSmallIntegerField(
        default=5,
        validators=[MinValueValidator(1)],
        verbose_name=_("tick interval (seconds)"),
    )
    reversion_rate = models.DecimalField(
        max_digits=5,
        decimal_places=3,
        default=Decimal("0.100"),
        validators=[MinValueValidator(Decimal("0")), MaxValueValidator(Decimal("1"))],
        verbose_name=_("reversion rate"),
    )
    last_tick_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_("last tick at"),
    )
    tick_counter = models.PositiveBigIntegerField(
        default=0,
        verbose_name=_("tick counter"),
    )
    # Scales how strongly a purchase pushes its drink's price up (see ADR 0001, "Impulse per trade").
    impulse_factor = models.DecimalField(
        max_digits=6,
        decimal_places=3,
        default=Decimal("1.000"),
        validators=[MinValueValidator(Decimal("0"))],
        verbose_name=_("impulse factor"),
    )
    # Share of a purchase's impulse that is taken off the other drinks (ADR 0001, "Normalization").
    normalization_factor = models.DecimalField(
        max_digits=4,
        decimal_places=3,
        default=Decimal("0.500"),
        validators=[MinValueValidator(Decimal("0")), MaxValueValidator(Decimal("1"))],
        verbose_name=_("normalization factor"),
    )
    price_point_retention_ticks = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(0)],
        verbose_name=_("price point retention (ticks)"),
    )

    class Meta:
        ordering = ["name"]  # Sort bars alphabetically for listings.
        verbose_name = _("bar")
        verbose_name_plural = _("bars")

    def __str__(self) -> str:
        return self.name
