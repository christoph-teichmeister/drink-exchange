from ambient_toolbox.models import CommonInfo
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from bars.models import Bar
from events.models.event_definition import EventDefinition


class ActiveEvent(CommonInfo):
    """Track when a definition is running at a bar so we can display live status and history."""

    definition = models.ForeignKey(
        EventDefinition,
        on_delete=models.CASCADE,
        related_name="active_events",
    )
    bar = models.ForeignKey(
        Bar,
        on_delete=models.CASCADE,
        related_name="active_events",
    )
    starts_at = models.DateTimeField(default=timezone.now)
    ends_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)  # Flags whether the event is still running.
    state = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["starts_at"]  # Keep active events ordered by their start time.
        indexes = [
            models.Index(fields=["bar", "starts_at"], name="events_active_bar_start_idx")
        ]
        verbose_name = _("active event")
        verbose_name_plural = _("active events")

    def __str__(self) -> str:
        return f"{self.definition.name} @ {self.bar.slug}"

    def clean(self) -> None:
        super().clean()
        if self.ends_at <= self.starts_at:
            raise ValidationError(
                {"ends_at": _("Event end must be after the start time.")}
            )
