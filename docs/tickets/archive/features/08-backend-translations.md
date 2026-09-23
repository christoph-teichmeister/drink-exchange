# 08 – German translations for backend messages

> Scope: implement ONLY what is required here. No refactors, no extra tooling.

## User Story

As a German-speaking bar manager I want every message the backend returns (validation errors, API errors, admin
labels) in German, so the admin editor and the desk never mix German UI text with English error messages.

## Background

All backend strings are already wrapped in `gettext_lazy` (about 60 in our own code), and `LocaleMiddleware` plus
`LANGUAGES = [("en", …), ("de", …)]` are configured. There are no `.po`/`.mo` files, so our own messages, e.g.
"Base price must sit between min and max price." from `Drink.clean()`, are always English. Django's built-in messages
are already translated. The frontend sends the `django_language` cookie via `/api/locale/` and the browser's
`Accept-Language`, so the active language already reaches the backend.

## Acceptance Criteria

- `LOCALE_PATHS` points at `backend/locale/`; `backend/locale/de/LC_MESSAGES/django.po` contains German translations
  for **every** `gettext`/`gettext_lazy` string in `api`, `bars`, `market`, `events` and `config` (no empty
  `msgstr`, no `fuzzy` entries). Terminology matches the frontend catalog (`frontend/src/lib/i18n.ts`), e.g.
  "Basispreis", "Getränk", "Marktereignis", "Buchung".
- The compiled `django.mo` is produced during the Docker build (`compilemessages`; install `gettext` in the build
  stage) rather than committed, and `.gitignore` ignores `*.mo`.
- API responses honor the active language: with the `django_language=de` cookie or `Accept-Language: de`, the
  `detail` and field `errors` of the trade, settings, drinks, events and auth endpoints are German; with `en` they stay
  English.
- The Django admin shows our model and field names in German for German users.
- CI fails when a new translatable string has no German translation: a check job runs `makemessages -l de` and fails
  if the `.po` file changes or contains untranslated or fuzzy entries.
- `AGENTS.md` documents the workflow (`makemessages -l de`, translate, `compilemessages`) and makes "new backend
  strings need a German translation" part of the Definition of Done.

## Tech Notes

- `makemessages`/`compilemessages` need GNU gettext. Install it in CI (`apt-get install gettext`) and in the backend
  Docker build stage; document it for local development (`brew install gettext` / `apt install gettext`).
- Run `makemessages` from `backend/` with `--ignore=.venv --ignore=tests`.
- Tests:
  - a trade with an invalid quantity returns the German message with `HTTP_ACCEPT_LANGUAGE="de"` and the English
    one with `en`;
  - a drink bounds violation on `PATCH /api/bars/<slug>/drinks/<id>/` returns the German field error;
  - the tests compile the catalog first (session fixture calling `compilemessages`) or skip with a clear message when
    gettext is missing locally; CI must run them.
- After this ticket the frontend can show the backend `detail` again instead of its own generic summary where that
  is more specific (`frontend/src/lib/components/admin/form-state.ts`); keep that change small.

## Dependencies

- Ticket 07 (admin editor, field errors from the configuration API).

## Out of scope

- Languages other than German and English.
- Translating user data (drink names, event descriptions, bar descriptions).
