from ambient_toolbox.models import CommonInfo
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from bars.models import Bar


class MarketSession(CommonInfo):
    """Represents a single market runtime window belonging to a bar."""

    class Status(models.TextChoices):
        RUNNING = "running", _("running")
        PAUSED = "paused", _("paused")
        CLOSED = "closed", _("closed")

    bar = models.ForeignKey(Bar, on_delete=models.CASCADE, related_name="market_sessions")
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.RUNNING)
    started_at = models.DateTimeField(default=timezone.now)
    ended_at = models.DateTimeField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["-started_at"]  # Show the latest session first.
        indexes = [models.Index(fields=["bar", "started_at"], name="market_session_bar_started_idx")]

    def __str__(self) -> str:
        return f"{self.bar.slug} session ({self.status})"
