from decimal import Decimal

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("bars", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="bar",
            name="last_tick_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="bar",
            name="tick_counter",
            field=models.PositiveBigIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="bar",
            name="tick_interval_seconds",
            field=models.PositiveSmallIntegerField(
                default=5,
                validators=[MinValueValidator(1)],
            ),
        ),
        migrations.AddField(
            model_name="bar",
            name="reversion_rate",
            field=models.DecimalField(
                decimal_places=3,
                default=Decimal("0.100"),
                max_digits=5,
                validators=[
                    MinValueValidator(Decimal("0")),
                    MaxValueValidator(Decimal("1")),
                ],
            ),
        ),
        migrations.AddField(
            model_name="bar",
            name="price_point_retention_ticks",
            field=models.PositiveIntegerField(
                default=1,
                validators=[MinValueValidator(0)],
            ),
        ),
    ]
