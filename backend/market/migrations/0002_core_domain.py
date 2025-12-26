from decimal import Decimal

import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("market", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="drink",
            name="current_price",
            field=models.DecimalField(
                default=Decimal("0.01"),
                max_digits=10,
                decimal_places=2,
                blank=True,
                null=False,
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="drink",
            name="min_price",
            field=models.DecimalField(
                default=Decimal("0.01"),
                max_digits=10,
                decimal_places=2,
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="drink",
            name="max_price",
            field=models.DecimalField(
                default=Decimal("0.01"),
                max_digits=10,
                decimal_places=2,
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="drink",
            name="volatility",
            field=models.DecimalField(
                default=Decimal("0.05"),
                max_digits=6,
                decimal_places=4,
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="drink",
            name="weight",
            field=models.DecimalField(
                default=Decimal("1.00"),
                max_digits=6,
                decimal_places=4,
            ),
            preserve_default=False,
        ),
        migrations.RenameField(
            model_name="trade",
            old_name="quantity",
            new_name="qty",
        ),
        migrations.RenameField(
            model_name="trade",
            old_name="executed_at",
            new_name="occurred_at",
        ),
        migrations.AlterField(
            model_name="trade",
            name="occurred_at",
            field=models.DateTimeField(default=django.utils.timezone.now),
        ),
        migrations.AddIndex(
            model_name="trade",
            index=models.Index(
                fields=["bar", "occurred_at"],
                name="market_trade_bar_occurred_idx",
            ),
        ),
        migrations.CreateModel(
            name="MarketSession",
            fields=[
                (
                    "id",
                    models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID"),
                ),
                (
                    "created_at",
                    models.DateTimeField(
                        db_index=True,
                        default=django.utils.timezone.now,
                        verbose_name="Created at",
                    ),
                ),
                (
                    "lastmodified_at",
                    models.DateTimeField(
                        db_index=True,
                        default=django.utils.timezone.now,
                        verbose_name="Last modified at",
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[("running", "running"), ("paused", "paused"), ("closed", "closed")],
                        default="running",
                        max_length=16,
                    ),
                ),
                ("started_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("ended_at", models.DateTimeField(blank=True, null=True)),
                ("metadata", models.JSONField(blank=True, default=dict)),
                (
                    "bar",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="market_sessions",
                        to="bars.bar",
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(app_label)s_%(class)s_created",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Created by",
                    ),
                ),
                (
                    "lastmodified_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(app_label)s_%(class)s_lastmodified",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Last modified by",
                    ),
                ),
            ],
            options={
                "ordering": ["-started_at"],
                "indexes": [
                    models.Index(
                        fields=["bar", "started_at"],
                        name="market_session_bar_started_idx",
                    )
                ],
            },
        ),
        migrations.CreateModel(
            name="PricePoint",
            fields=[
                (
                    "id",
                    models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID"),
                ),
                (
                    "created_at",
                    models.DateTimeField(
                        db_index=True,
                        default=django.utils.timezone.now,
                        verbose_name="Created at",
                    ),
                ),
                (
                    "lastmodified_at",
                    models.DateTimeField(
                        db_index=True,
                        default=django.utils.timezone.now,
                        verbose_name="Last modified at",
                    ),
                ),
                (
                    "price",
                    models.DecimalField(decimal_places=2, max_digits=10),
                ),
                ("recorded_at", models.DateTimeField(default=django.utils.timezone.now)),
                (
                    "bar",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="price_points",
                        to="bars.bar",
                    ),
                ),
                (
                    "drink",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="price_points",
                        to="market.drink",
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(app_label)s_%(class)s_created",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Created by",
                    ),
                ),
                (
                    "lastmodified_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(app_label)s_%(class)s_lastmodified",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="Last modified by",
                    ),
                ),
            ],
            options={
                "ordering": ["-recorded_at"],
                "indexes": [
                    models.Index(
                        fields=["bar", "recorded_at"],
                        name="market_pricepoint_bar_at_idx",
                    ),
                    models.Index(
                        fields=["drink", "recorded_at"],
                        name="market_pricepoint_drink_at_idx",
                    ),
                ],
            },
        ),
        migrations.AddConstraint(
            model_name="drink",
            constraint=models.CheckConstraint(
                check=models.Q(min_price__lte=models.F("max_price")),
                name="market_drink_min_lte_max",
            ),
        ),
        migrations.AddConstraint(
            model_name="drink",
            constraint=models.CheckConstraint(
                check=models.Q(min_price__lte=models.F("base_price"))
                & models.Q(models.F("base_price")__lte=models.F("max_price")),
                name="market_drink_base_within",
            ),
        ),
        migrations.AddConstraint(
            model_name="drink",
            constraint=models.CheckConstraint(
                check=models.Q(current_price__gte=models.F("min_price"))
                & models.Q(current_price__lte=models.F("max_price")),
                name="market_drink_current_within_bounds",
            ),
        ),
    ]
