from decimal import Decimal

from ambient_toolbox.models import CommonInfo
from django.core.validators import MinValueValidator
from django.db import models
from django.utils.translation import gettext_lazy as _

from bars.models import Bar


class EventDefinition(CommonInfo):
    """Describe the reusable structure and instructions for an event that bars can host."""

    class EventType(models.TextChoices):
        BOOM = "boom", _("boom")
        CRASH = "crash", _("crash")
        FOCUS = "focus", _("focus")
        NORMALIZE = "normalize", _("normalize")

    bar = models.ForeignKey(
        Bar,
        on_delete=models.CASCADE,
        related_name="event_definitions",
    )
    name = models.CharField(max_length=128)
    description = models.TextField(blank=True)
    type = models.CharField(max_length=16, choices=EventType.choices)
    probability_weight = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=Decimal("1.00"),
        validators=[MinValueValidator(Decimal("0"))],
    )
    duration_seconds = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
        help_text=_("Duration in seconds the event should run before expiring."),
    )
    params = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["bar", "name"]  # Keep definitions grouped per bar and sorted.
        verbose_name = _("event definition")
        verbose_name_plural = _("event definitions")
        constraints = [models.UniqueConstraint(fields=["bar", "name"], name="events_def_bar_name_idx")]

    def __str__(self) -> str:
        return self.name
