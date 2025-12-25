from ambient_toolbox.models import CommonInfo
from django.db import models
from django.utils.translation import gettext_lazy as _


class EventDefinition(CommonInfo):
    """Describe the reusable structure and instructions for an event that bars can host."""

    name = models.CharField(max_length=128)
    description = models.TextField(blank=True)
    rules = models.JSONField(
        default=dict,
        blank=True,
    )  # Stores the structured, versioned rules that describe how the event should behave.

    class Meta:
        verbose_name = _("event definition")  # Label event definitions clearly in the admin.
        verbose_name_plural = _("event definitions")

    def __str__(self) -> str:
        return self.name
