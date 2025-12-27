from django.db import migrations


def _create_ci_demo_bar(apps, schema_editor):
    Bar = apps.get_model("bars", "Bar")
    Bar.objects.get_or_create(
        slug="ci-demo",
        defaults={
            "name": "CI Demo Bar",
            "description": "Temporary bar used by CI health checks.",
        },
    )


def _remove_ci_demo_bar(apps, schema_editor):
    Bar = apps.get_model("bars", "Bar")
    Bar.objects.filter(slug="ci-demo").delete()


class Migration(migrations.Migration):
    dependencies = [
        ("bars", "0002_bar_last_tick_at_bar_price_point_retention_ticks_and_more"),
    ]

    operations = [
        migrations.RunPython(_create_ci_demo_bar, _remove_ci_demo_bar),
    ]
