#!/usr/bin/env sh
set -euo pipefail

copy_venv_base() {
  mkdir -p /app/.venv
  if [ -d /app/.venv ]; then
    rm -rf /app/.venv/* /app/.venv/.[!.]* /app/.venv/..?* || true
  fi
  cp -a /.venv-base/. /app/.venv
  if [ -f /.venv-base/uv.lock.sha256 ]; then
    cp /.venv-base/uv.lock.sha256 /app/.venv/uv.lock.sha256
  fi
}

BASE_HASH=""
CURRENT_HASH=""
if [ -f /.venv-base/uv.lock.sha256 ]; then
  BASE_HASH=$(cat /.venv-base/uv.lock.sha256)
fi
if [ -f /app/.venv/uv.lock.sha256 ]; then
  CURRENT_HASH=$(cat /app/.venv/uv.lock.sha256)
fi

if [ "$BASE_HASH" != "$CURRENT_HASH" ] || [ ! -x "/app/.venv/bin/python" ]; then
  copy_venv_base
fi

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
