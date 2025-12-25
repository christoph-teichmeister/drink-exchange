import os

from celery import Celery
from django.conf import settings

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.dev")

app = Celery("drink_exchange")
app.config_from_object("django.conf:settings", namespace="CELERY")

# Let Celery discover task modules from each installed app.
app.autodiscover_tasks(lambda: settings.INSTALLED_APPS)
