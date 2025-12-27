#!/usr/bin/env sh
set -euo pipefail

if [ "${DJANGO_SETTINGS_MODULE:-}" = "config.settings.dev" ]; then
  python manage.py migrate --noinput
  if [ "${DEV_FIXTURES_ENABLED:-1}" != "0" ]; then
    python manage.py ensure_dev_data
  fi
fi

if [ "$#" -gt 0 ]; then
  exec "$@"
fi

if [ -n "${DEFAULT_CMD:-}" ]; then
  exec sh -c "$DEFAULT_CMD"
fi

exec uvicorn config.asgi:application --host 0.0.0.0 --port 8000
