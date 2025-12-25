from django.db import models
from django.utils.translation import gettext_lazy as _


class EventDefinition(models.Model):
    name = models.CharField(max_length=128)
    description = models.TextField(blank=True)
    rules = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name = _("event definition")
        verbose_name_plural = _("event definitions")

    def __str__(self) -> str:
        return self.name
