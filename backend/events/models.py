from django.db import models
from django.utils.translation import gettext_lazy as _

from backend.bars.models import Bar


class EventDefinition(models.Model):
    name = models.CharField(max_length=128)
    description = models.TextField(blank=True)
    rules = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name = _("event definition")
        verbose_name_plural = _("event definitions")

    def __str__(self) -> str:
        return self.name


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
