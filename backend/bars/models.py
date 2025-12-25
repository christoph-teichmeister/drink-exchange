from ambient_toolbox.models import CommonInfo
from django.db import models


class Bar(CommonInfo):
    """Represents a bar location with metadata."""

    slug = models.SlugField(max_length=64, unique=True)
    name = models.CharField(max_length=128)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ["name"]  # Sort bars alphabetically for listings.

    def __str__(self) -> str:
        return self.name
