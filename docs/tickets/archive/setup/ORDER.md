## Recommended Order

1. **`01-backend-project.md`** – The Django project, pyproject + uv.lock form the foundation; nothing else works without this structure.
2. **`02-frontend-setup.md`** – The frontend skeleton must exist so Docker Compose and CI scripts later have realistic targets.
3. **`03-backend-docker-image.md`** – The backend Dockerfile builds directly on the Django source code; it can only be defined correctly after step 1.
4. **`04-docker-compose.md`** – Docker Compose can only work once the backend image (step 3) and, potentially, the frontend (step 2) are buildable.
5. **`05-commands.md`** – The unified commands (= Makefile/quickstart) orchestrate Compose, so the services must be in place beforehand.
6. **`06-pre-commit-hooks.md`** – Pre-commit hooks target the existing backend/frontend sources and use the commands from step 5.
7. **`07-ci-backend.md`** – Backend CI checks the previously defined hooks and services; should run after the local hook and command layer.
8. **`08-ci-frontend.md`** – Analogous frontend CI, based on the Svelte project and its scripts.
9. **`09-pre-commit-workflow.md`** – The pre-commit workflow can only be sensibly orchestrated once the hooks and CI streams exist.
