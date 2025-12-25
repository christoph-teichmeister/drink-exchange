#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./scripts/codex_start_process.sh            # defaults to docs/tickets/setup
#   ./scripts/codex_start_process.sh <dir>      # custom tickets dir
#
# Expects tickets named: s<number>.md (e.g., s1.md, s2.md, ...)
# Will:
# - iterate tickets in numeric order
# - for each ticket: create branch chore/s<number>
# - run codex with a strict prompt that enforces:
#   implement -> run checks -> commit -> push -> create PR via GitHub MCP
#
# Notes:
# - Requires a clean working tree at start and after each ticket.
# - Assumes default branch is "main". Change MAIN_BRANCH if needed.

TICKETS_DIR="${1:-docs/tickets/setup}"
MAIN_BRANCH="${MAIN_BRANCH:-main}"
REMOTE_NAME="${REMOTE_NAME:-origin}"

# ---------- helpers ----------
die() { echo "ERROR: $*" >&2; exit 1; }

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Command not found: $1"
}

ensure_clean_tree() {
  if [[ -n "$(git status --porcelain)" ]]; then
    echo "Working tree not clean:"
    git status --porcelain
    return 1
  fi
  return 0
}

extract_title_hint() {
  # Heuristic:
  # - Prefer first non-empty line after "## User-Story"
  # - Else prefer first "# " heading
  # - Else fallback to ticket_id
  local ticket_path="$1"
  local fallback="$2"
  local title=""

  title="$(
    awk '
      BEGIN{found=0}
      /^## User-Story/{found=1; next}
      found==1 && $0 ~ /[A-Za-zÄÖÜäöüß0-9]/ { print; exit }
    ' "$ticket_path" \
    | sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//'
  )"

  if [[ -z "$title" ]]; then
    title="$(
      awk '
        /^# / { sub(/^# /,""); print; exit }
      ' "$ticket_path" \
      | sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//'
    )"
  fi

  if [[ -z "$title" ]]; then
    title="$fallback"
  fi

  echo "$title"
}

build_extra_guidance() {
  local ticket_id="$1"
  if [[ "$ticket_id" == "s1" ]]; then
    cat <<'EXTRA'
S1 specific guidance:
- Do NOT scaffold a full Django project here (that is S3).
- If the ticket requires "ASGI reachable on :8000" before Django exists, a tiny ASGI stub is acceptable (non-Django),
  e.g. backend/asgi_stub.py run with uvicorn. Keep it minimal and ensure it won't conflict with S3.
- worker/beat should reuse the same build context/image. If Celery is not wired yet, use a minimal long-running command
  so services are up; keep implementation minimal and document assumptions in PR.
- Provide Makefile target `up` so "make up" works (and keep it minimal).
EXTRA
  else
    echo "No additional guidance."
  fi
}

# ---------- preflight ----------
require_cmd git
require_cmd codex
require_cmd awk
require_cmd sed
require_cmd find
require_cmd sort
require_cmd cut

[[ -d "$TICKETS_DIR" ]] || die "Tickets dir not found: $TICKETS_DIR"
[[ -f "AGENTS.md" ]] || die "AGENTS.md not found in repo root. Create it first."

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || die "Not inside a git repository."

git show-ref --verify --quiet "refs/heads/${MAIN_BRANCH}" || die "Local branch '${MAIN_BRANCH}' not found."
git remote get-url "$REMOTE_NAME" >/dev/null 2>&1 || die "Remote '${REMOTE_NAME}' not found."

ensure_clean_tree || die "Commit/stash changes before running."

# Collect tickets named s<number>.md, numeric sort (so s10 doesn't come before s2)
mapfile -t TICKETS < <(
  find "$TICKETS_DIR" -maxdepth 1 -type f -name 's*.md' \
  | sed -E 's#^.*/s([0-9]+)\.md$#\1\t&#' \
  | sort -n \
  | cut -f2-
)

[[ ${#TICKETS[@]} -gt 0 ]] || die "No tickets found in $TICKETS_DIR (expected s<number>.md)."

echo "Found ${#TICKETS[@]} tickets in $TICKETS_DIR:"
for t in "${TICKETS[@]}"; do echo " - $(basename "$t")"; done
echo

# ---------- main loop ----------
for ticket_path in "${TICKETS[@]}"; do
  ticket_file="$(basename "$ticket_path")"
  ticket_id="${ticket_file%.md}"           # e.g. "s1"
  branch="chore/${ticket_id}"

  title_hint="$(extract_title_hint "$ticket_path" "$ticket_id")"
  extra_guidance="$(build_extra_guidance "$ticket_id")"

  echo "=== Processing $ticket_id ==="
  echo "Ticket:  $ticket_path"
  echo "Branch:  $branch"
  echo "Title:   $title_hint"
  echo

  # Always start from latest main to avoid drift
  git checkout "$MAIN_BRANCH" >/dev/null
  git pull --ff-only "$REMOTE_NAME" "$MAIN_BRANCH"

  # Create branch (fail if exists to avoid accidental reuse)
  if git show-ref --verify --quiet "refs/heads/${branch}"; then
    die "Branch already exists locally: $branch (delete it or choose another name)."
  fi
  git checkout -b "$branch"

  # Compose strict prompt
  # NOTE: We explicitly require PR creation via GitHub MCP and require Codex to output PR URL.
  prompt="$(cat <<'PROMPT'
You are Codex CLI running locally in a git repository. You MUST follow AGENTS.md and the ticket Scope line.

Title to use (verbatim):
<TITLE_HINT>

Mandatory process:
1) Read the ticket content below. Implement ONLY what is required by its acceptance criteria.
2) Keep diffs minimal. No refactors, no tool swaps, no extra features.
3) Run the relevant checks from AGENTS.md for this ticket and fix all failures.
4) Commit everything (including lockfiles) with message:
   "chore(<TICKET_ID>): <TITLE_HINT>"
5) Push the branch to origin.
6) Using your connected GitHub MCP, create a Pull Request for this branch:
   - PR title: "chore(<TICKET_ID>): <TITLE_HINT>"
   - Target branch: main
   - PR body must include:
     - Summary of changes (bullet list)
     - How to verify (commands)
     - Notes/assumptions
   - Ensure the PR is created successfully and output the PR URL.

Additional guidance:
<EXTRA_GUIDANCE>

Ticket content:
PROMPT
)"
  prompt="${prompt//$'<TICKET_ID>'/$ticket_id}"
  prompt="${prompt//$'<TITLE_HINT>'/$title_hint}"
  prompt="${prompt//$'<EXTRA_GUIDANCE>'/$extra_guidance}"
  prompt="${prompt}
$(cat "$ticket_path")"

  # Run Codex with prompt via stdin
  printf "%s\n" "$prompt" | codex

  echo
  echo "Codex finished for $ticket_id."

  # Post-checks: ensure clean tree and branch pushed
  ensure_clean_tree || die "Working tree not clean after Codex. Aborting."

  if ! git ls-remote --exit-code --heads "$REMOTE_NAME" "$branch" >/dev/null 2>&1; then
    die "Remote branch not found on ${REMOTE_NAME}: $branch (Codex did not push?)"
  fi

  echo "OK: $ticket_id completed, branch pushed: $branch"
  echo "Next: merge PR (created by Codex via GitHub MCP) before continuing, if tickets depend on each other."
  echo

  # Go back to main (script continues; if you want to force merge-between-tickets, stop here manually)
  git checkout "$MAIN_BRANCH" >/dev/null
done

echo "All tickets processed."
