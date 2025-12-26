from ambient_toolbox.models import CommonInfo
from django.db import models
from django.utils.translation import gettext_lazy as _

EVENT_TYPE_CHOICES = [
    ("BOOM", _("boom")),
    ("CRASH", _("crash")),
    ("FOCUS", _("focus")),
]


class EventDefinition(CommonInfo):
    """Describe the reusable structure and instructions for an event that bars can host."""

    name = models.CharField(max_length=128)
    description = models.TextField(blank=True)
    type = models.CharField(
        max_length=16,
        choices=EVENT_TYPE_CHOICES,
        default="BOOM",
    )
    probability_weight = models.PositiveIntegerField(
        default=1,
        help_text=_("Higher weight increases the chances this definition is selected."),
    )
    duration_seconds = models.PositiveIntegerField(
        default=60,
        help_text=_("Length of the event in seconds, used to compute decay."),
    )
    cooldown_seconds = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text=_("Optional wait time after an event ends before it can start again."),
    )
    params = models.JSONField(
        default=dict,
        blank=True,
        help_text=_("Arbitrary configuration such as start_multiplier or target_drink_ids."),
    )

    class Meta:
        verbose_name = _("event definition")
        verbose_name_plural = _("event definitions")

    def __str__(self) -> str:
        return self.name
