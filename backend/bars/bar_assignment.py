from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class BarAssignment(models.Model):
    """Assigns a user to a bar so only allowed locations are visible."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="bar_assignments",
    )
    bar = models.ForeignKey(
        "bars.Bar",
        on_delete=models.CASCADE,
        related_name="assignments",
        related_query_name="assignment",
    )

    class Meta:
        unique_together = ("user", "bar")
        verbose_name = _("bar assignment")
        verbose_name_plural = _("bar assignments")

    def __str__(self) -> str:
        return f"{self.user} → {self.bar}"
