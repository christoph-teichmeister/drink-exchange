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

    bar = models.ForeignKey(
        Bar,
        on_delete=models.CASCADE,
        related_name="market_sessions",
        verbose_name=_("bar"),
    )
    status = models.CharField(
        max_length=16,
        choices=Status.choices,
        default=Status.RUNNING,
        verbose_name=_("status"),
    )
    started_at = models.DateTimeField(
        default=timezone.now,
        verbose_name=_("started at"),
    )
    ended_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_("ended at"),
    )
    metadata = models.JSONField(
        default=dict,
        blank=True,
        verbose_name=_("metadata"),
    )

    class Meta:
        ordering = ["-started_at"]  # Show the latest session first.
        indexes = [models.Index(fields=["bar", "started_at"], name="market_session_bar_started_idx")]
        verbose_name = _("market session")
        verbose_name_plural = _("market sessions")

    def __str__(self) -> str:
        return f"{self.bar.slug} session ({self.status})"
