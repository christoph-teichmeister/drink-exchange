from django.db import models
from django.utils.translation import gettext_lazy as _

from backend.bars.models import Bar
from backend.events.models.event_definition import EventDefinition


class ActiveEvent(models.Model):
    definition = models.ForeignKey(EventDefinition, on_delete=models.CASCADE, related_name="active_events")
    bar = models.ForeignKey(Bar, on_delete=models.CASCADE, related_name="active_events")
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["starts_at"]
        verbose_name = _("active event")
        verbose_name_plural = _("active events")

    def __str__(self) -> str:
        return f"{self.definition.name} @ {self.bar.slug}"
