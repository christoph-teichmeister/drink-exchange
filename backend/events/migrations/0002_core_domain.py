from decimal import Decimal

import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("events", "0001_initial"),
        ("bars", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="eventdefinition",
            name="bar",
            field=models.ForeignKey(
                blank=False,
                null=False,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="event_definitions",
                to="bars.bar",
            ),
        ),
        migrations.AddField(
            model_name="eventdefinition",
            name="type",
            field=models.CharField(
                choices=[("boom", "boom"), ("crash", "crash"), ("focus", "focus"), ("normalize", "normalize")],
                max_length=16,
                default="boom",
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="eventdefinition",
            name="probability_weight",
            field=models.DecimalField(
                default=Decimal("1.00"),
                max_digits=6,
                decimal_places=2,
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="eventdefinition",
            name="duration_seconds",
            field=models.PositiveIntegerField(default=120),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="eventdefinition",
            name="params",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.RemoveField(
            model_name="eventdefinition",
            name="rules",
        ),
        migrations.AlterModelOptions(
            name="eventdefinition",
            options={
                "ordering": ["bar", "name"],
                "verbose_name": "event definition",
                "verbose_name_plural": "event definitions",
            },
        ),
        migrations.AddConstraint(
            model_name="eventdefinition",
            constraint=models.UniqueConstraint(fields=["bar", "name"], name="events_def_bar_name_idx"),
        ),
        migrations.AlterField(
            model_name="activeevent",
            name="starts_at",
            field=models.DateTimeField(default=django.utils.timezone.now),
        ),
        migrations.AddField(
            model_name="activeevent",
            name="state",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddIndex(
            model_name="activeevent",
            index=models.Index(fields=["bar", "starts_at"], name="events_active_bar_start_idx"),
        ),
    ]
