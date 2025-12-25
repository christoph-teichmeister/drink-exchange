## Empfohlene Reihenfolge

1. **`01-backend-project.md`** – Das Django-Projekt, pyproject + uv.lock stellen das Fundament dar; nichts anderes funktioniert ohne diese Struktur.
2. **`02-frontend-setup.md`** – Das Frontend-Skelett muss existieren, damit später Docker Compose und CI Scripts realistische Ziele haben.
3. **`03-backend-docker-image.md`** – Der Backend-Dockerfile baut direkt auf dem Django-Quellcode auf; erst nach Schritt 1 kann er fehlerfrei definiert werden.
4. **`04-docker-compose.md`** – Docker Compose kann nur funktionieren, wenn Backend-Image (Schritt 3) und eventuell Frontend (Schritt 2) gebaut werden.
5. **`05-commands.md`** – Die einheitlichen Commands (= Makefile/Quickstart) orchestrieren Compose, also müssen die Services vorher stehen.
6. **`06-pre-commit-hooks.md`** – Pre-commit-Hooks zielen auf bestehende Backend-/Frontend-Quellen und nutzen die Befehle aus Schritt 5.
7. **`07-ci-backend.md`** – Backend-CI prüft die zuvor definierten Hooks und Services; sollte nach der lokalen Hook- und Command-Schicht laufen.
8. **`08-ci-frontend.md`** – Analoges Frontend-CI, das auf dem Svelte-Projekt und dessen Scripts basiert.
9. **`09-pre-commit-workflow.md`** – Workflow für pre-commit kann erst sinnvoll orchestriert werden, wenn die Hooks und CI-Ströme existieren.
