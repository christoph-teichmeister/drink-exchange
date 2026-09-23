#!/usr/bin/env bash
# Fails when backend/locale/de/LC_MESSAGES/django.po is out of date, incomplete or has fuzzy entries.
# Requires GNU gettext (msgfmt, msgattrib). Run from anywhere; CI runs it in the backend job.
set -euo pipefail

cd "$(dirname "$0")/../backend"
PO=locale/de/LC_MESSAGES/django.po

before=$(mktemp)
trap 'rm -f "$before"' EXIT
cp "$PO" "$before"

uv run python manage.py makemessages -l de --add-location=file --ignore=.venv --ignore=tests --ignore=staticfiles

# makemessages bumps POT-Creation-Date whenever it rewrites the file; only real catalog changes count. The updated
# file stays in place, so the new entries only need translating.
if ! diff -u -I '^"POT-Creation-Date:' "$before" "$PO"; then
  echo "::error::$PO is out of date. Run 'make messages', translate the new entries and commit the file."
  exit 1
fi

untranslated=$(msgattrib --untranslated --no-obsolete "$PO" | grep -c '^msgid ' || true)
fuzzy=$(msgattrib --only-fuzzy --no-obsolete "$PO" | grep -c '^msgid ' || true)
# msgattrib prints the header entry along with any match, so subtract it when something was found.
[ "$untranslated" -gt 0 ] && untranslated=$((untranslated - 1))
[ "$fuzzy" -gt 0 ] && fuzzy=$((fuzzy - 1))
if [ "$untranslated" -ne 0 ] || [ "$fuzzy" -ne 0 ]; then
  msgattrib --untranslated --no-obsolete "$PO" || true
  msgattrib --only-fuzzy --no-obsolete "$PO" || true
  echo "::error::$PO has $untranslated untranslated and $fuzzy fuzzy entries."
  exit 1
fi

msgfmt --check --statistics -o /dev/null "$PO"
