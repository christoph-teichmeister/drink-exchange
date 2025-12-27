FROM python:3.13-slim AS deps

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install the uv CLI so we can bootstrap the locked dependency tree.
RUN python -m pip install --upgrade pip uv

# Copy the lock metadata first so uv sync can leverage layer caching.
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen
RUN sha256sum uv.lock | cut -d ' ' -f1 > uv.lock.sha256

FROM python:3.13-slim AS runtime-base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/app/.venv/bin:${PATH}"

WORKDIR /app

# Reuse the dependency snapshot from the deps stage to keep installs cached.
COPY --from=deps /app/.venv ./.venv
COPY --from=deps /app/uv.lock.sha256 ./uv.lock.sha256
RUN cp -a .venv /.venv-base
RUN cp uv.lock.sha256 /.venv-base/uv.lock.sha256
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh

FROM runtime-base AS dev

# Dev target surfaces reload + optional debug hooks without altering the dependency lock.
COPY . .
RUN chmod +x entrypoint.sh

# Mount /app as a volume when running locally so reload can pick up host edits or attached debuggers.
# Entrypoint documentation: dev runs uvicorn with --reload for fast local feedback loops.
ENV DEFAULT_CMD="uvicorn config.asgi:application --host 0.0.0.0 --port 8000 --reload"
ENTRYPOINT ["/app/entrypoint.sh"]

FROM runtime-base AS prod

# Copy the application sources separately so prod can own files with a non-root user.
COPY . .
RUN chmod +x entrypoint.sh

# Create a non-root user so containers run securely under prod mode.
RUN useradd --create-home --home-dir /app --shell /bin/sh app \
    && chown -R app:app /app

USER app

# Mounting additional volumes in prod (e.g., config/secret) is still possible thanks to the non-root user above.
# Entrypoint documentation: prod runs uvicorn without reload via the locked dependencies above.
ENV DEFAULT_CMD="uvicorn config.asgi:application --host 0.0.0.0 --port 8000"
ENTRYPOINT ["/app/entrypoint.sh"]
