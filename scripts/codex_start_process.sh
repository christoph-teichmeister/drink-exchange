#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./scripts/codex_start_process.sh                       # defaults to docs/tickets/setup
#   ./scripts/codex_start_process.sh <tickets-dir>         # custom tickets dir
#   ./scripts/codex_start_process.sh <tickets-dir> <ticket> # resume starting at <ticket>
# 
# Expects tickets named: NN-description.md (e.g., 01-backend-project.md), numeric prefix determines order.
# Will:
# - iterate tickets in numeric order
# - for each ticket: create branch chore/<ticket basename without extension>
# - run codex with a strict prompt that enforces:
#   implement -> run checks -> commit -> push. Script will then use the GitHub MCP server to create the PR.
#
# Notes:
# - Requires a clean working tree at start and after each ticket.
# - Assumes default branch is "main". Change MAIN_BRANCH if needed.

TICKETS_DIR="${1:-docs/tickets/setup}"
START_TICKET_RAW="${2:-}"
MAIN_BRANCH="${MAIN_BRANCH:-develop}"
REMOTE_NAME="${REMOTE_NAME:-origin}"
GITHUB_MCP_URL="${GITHUB_MCP_URL:-https://api.githubcopilot.com/mcp/}"
GITHUB_MCP_TOKEN="${GITHUB_COPILOT_MCP_TOKEN:-}"

if [[ -n "$START_TICKET_RAW" ]]; then
  START_TICKET_ID="$(basename "${START_TICKET_RAW%.md}")"
else
  START_TICKET_ID=""
fi

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

compose_pr_body() {
  local ticket_file="$1"
  local ticket_id="$2"
  local branch="$3"
  local pr_title="$4"

  cat <<EOF
Summary of changes:
- Implemented ${ticket_id} as described in ${ticket_file}.
- Ensured the Codex workflow stayed focused on the AGENTS.md constraints for this ticket.

How to verify:
- cd backend && uv sync --frozen
- cd backend && uv run ruff check .
- cd backend && uv run ruff format --check .
- cd backend && uv run pytest
- cd backend && uv run python manage.py migrate
- cd frontend && pnpm install --frozen-lockfile
- cd frontend && pnpm build
- docker compose build
- docker compose up -d
- docker compose ps

Notes/assumptions:
- Automated Codex execution honored AGENTS.md for ${ticket_id}.
- Branch ${branch} already contains the final changes and is pushed.
- PR title: ${pr_title}
EOF
}

resolve_github_owner_repo() {
  local remote_url owner_repo owner repo
  remote_url="$(git remote get-url "$REMOTE_NAME")"
  owner_repo="$(printf '%s\n' "$remote_url" | sed -E 's#^.*github\\.com[:/]+([^/]+)/([^/]+).*#\\1/\\2#')"
  if [[ "$owner_repo" == "$remote_url" || "$owner_repo" != */* ]]; then
    die "Unable to parse GitHub owner/repo from remote URL: $remote_url"
  fi
  owner="${owner_repo%%/*}"
  repo="${owner_repo#*/}"
  repo="${repo%.git}"
  repo="${repo%%/*}"

  if [[ -z "$owner" || -z "$repo" ]]; then
    die "Unable to resolve GitHub owner/repo from remote URL: $remote_url"
  fi

  printf "%s %s" "$owner" "$repo"
}

extract_pr_url() {
  local response_file="$1"
  python - <<'PY' "$response_file"
import json
import sys
from pathlib import Path

path = Path(sys.argv[1])
text = path.read_text()
try:
    payload = json.loads(text)
except json.JSONDecodeError:
    sys.exit(2)

def find_url(obj):
    if isinstance(obj, dict):
        for key in ("html_url", "url", "web_url", "htmlUrl"):
            value = obj.get(key)
            if isinstance(value, str) and value.startswith("http"):
                return value
        for value in obj.values():
            candidate = find_url(value)
            if candidate:
                return candidate
    elif isinstance(obj, list):
        for item in obj:
            candidate = find_url(item)
            if candidate:
                return candidate
    elif isinstance(obj, str) and obj.startswith("http"):
        return obj.strip()
    return None

result = None
if isinstance(payload, dict) and "result" in payload:
    result = find_url(payload["result"])
if not result:
    result = find_url(payload)
print(result or "", end="")
PY
}

create_pr_via_github_mcp() {
  local pr_title="$1"
  local branch="$2"
  local ticket_path="$3"
  local ticket_id="$4"

  if [[ -z "$GITHUB_MCP_TOKEN" ]]; then
    echo "SKIP: GITHUB_COPILOT_MCP_TOKEN is not set; GitHub MCP PR creation skipped." >&2
    return
  fi

  local owner repo
  read -r owner repo <<<"$(resolve_github_owner_repo)"

  local pr_body
  pr_body="$(compose_pr_body "$ticket_path" "$ticket_id" "$branch" "$pr_title")"

  local body_file payload response_file http_status curl_exit pr_url
  body_file="$(mktemp)"
  printf '%s' "$pr_body" > "$body_file"

  payload=$(
    GITHUB_MCP_OWNER="$owner" \
    GITHUB_MCP_REPO="$repo" \
    GITHUB_MCP_TITLE="$pr_title" \
    GITHUB_MCP_HEAD="$branch" \
    GITHUB_MCP_BASE="$MAIN_BRANCH" \
    PR_BODY_FILE="$body_file" \
    python - <<'PY'
import json
import os
from pathlib import Path

args = os.environ
body = Path(args["PR_BODY_FILE"]).read_text(encoding="utf-8")
payload = {
    "tool": "github.pull_request_create",
    "arguments": {
        "owner": args["GITHUB_MCP_OWNER"],
        "repo": args["GITHUB_MCP_REPO"],
        "title": args["GITHUB_MCP_TITLE"],
        "head": args["GITHUB_MCP_HEAD"],
        "base": args["GITHUB_MCP_BASE"],
        "body": body,
        "maintainer_can_modify": False,
        "draft": False,
    },
}
print(json.dumps(payload))
PY
  )
  rm -f "$body_file"

  response_file="$(mktemp)"
  set +e
  http_status="$(curl -sS -o "$response_file" -w "%{http_code}" \
    -H "Authorization: Bearer $GITHUB_MCP_TOKEN" \
    -H "Content-Type: application/json" \
    -X POST \
    -d "$payload" \
    "$GITHUB_MCP_URL")"
  curl_exit=$?
  set -e

  if [[ $curl_exit -ne 0 ]]; then
    cat "$response_file"
    rm -f "$response_file"
    die "GitHub MCP request failed (curl exit $curl_exit)"
  fi

  if [[ "$http_status" -lt 200 || "$http_status" -ge 300 ]]; then
    cat "$response_file"
    rm -f "$response_file"
    die "GitHub MCP returned HTTP $http_status"
  fi

  if ! pr_url="$(extract_pr_url "$response_file")"; then
    cat "$response_file"
    rm -f "$response_file"
    die "Failed to parse GitHub MCP response."
  fi

  rm -f "$response_file"

  if [[ -z "$pr_url" ]]; then
    die "GitHub MCP response did not include a PR URL."
  fi

  echo "GitHub MCP created PR: $pr_url"
}

# ---------- preflight ----------
require_cmd git
require_cmd codex
require_cmd awk
require_cmd sed
require_cmd find
require_cmd sort
require_cmd curl
require_cmd python

[[ -d "$TICKETS_DIR" ]] || die "Tickets dir not found: $TICKETS_DIR"
[[ -f "AGENTS.md" ]] || die "AGENTS.md not found in repo root. Create it first."

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || die "Not inside a git repository."

git show-ref --verify --quiet "refs/heads/${MAIN_BRANCH}" || die "Local branch '${MAIN_BRANCH}' not found."
git remote get-url "$REMOTE_NAME" >/dev/null 2>&1 || die "Remote '${REMOTE_NAME}' not found."

ensure_clean_tree || die "Commit/stash changes before running."

update_main_branch_tip() {
  git checkout "$MAIN_BRANCH" >/dev/null
  git fetch "$REMOTE_NAME" "$MAIN_BRANCH" >/dev/null
  git pull --ff-only "$REMOTE_NAME" "$MAIN_BRANCH"
}

update_main_branch_tip

# Collect tickets named NN-description.md, numeric order via prefix
mapfile -t TICKETS < <(
  find "$TICKETS_DIR" -maxdepth 1 -type f \
    -regextype posix-extended \
    -regex '.*/[0-9]{2}-[^/]+\.md' \
  | sort -V
)

[[ ${#TICKETS[@]} -gt 0 ]] || die "No tickets found in $TICKETS_DIR (expected NN-description.md)."

if [[ -n "$START_TICKET_ID" ]]; then
  start_found=false
  for ticket_path in "${TICKETS[@]}"; do
    candidate="$(basename "$ticket_path" .md)"
    if [[ "$candidate" == "$START_TICKET_ID"* ]]; then
      start_found=true
      break
    fi
  done
  [[ "$start_found" == true ]] || die "Start ticket not found: $START_TICKET_ID"
  echo "Will skip to ticket matching prefix: $START_TICKET_ID"
  echo
fi

echo "Found ${#TICKETS[@]} tickets in $TICKETS_DIR:"
for t in "${TICKETS[@]}"; do echo " - $(basename "$t")"; done
echo

START_REACHED="true"
# if a starting ticket prefix is set, skip until we reach it
if [[ -n "$START_TICKET_ID" ]]; then
  START_REACHED="false"
fi

# ---------- main loop ----------
EXTRA_GUIDANCE="No additional guidance."
for ticket_path in "${TICKETS[@]}"; do
  ticket_file="$(basename "$ticket_path")"
  ticket_id="${ticket_file%.md}"           # e.g. "01-backend-project"
  branch="chore/${ticket_id}"

  title_hint="$(extract_title_hint "$ticket_path" "$ticket_id")"
  pr_title="chore(${ticket_id}): ${title_hint}"
  extra_guidance="$EXTRA_GUIDANCE"

  echo "=== Processing $ticket_id ==="
  echo "Ticket:  $ticket_path"
  echo "Branch:  $branch"
  echo "Title:   $title_hint"
  echo

  if [[ "$START_REACHED" == "false" ]]; then
    if [[ "$ticket_id" == "$START_TICKET_ID"* ]]; then
      START_REACHED="true"
      echo "Resuming from ticket $ticket_id"
    else
      echo "Skipping $ticket_id (waiting for prefix $START_TICKET_ID)"
      echo
      continue
    fi
  fi

  # Always start from latest main to avoid drift
  update_main_branch_tip

  # Create branch (fail if exists to avoid accidental reuse)
  if git show-ref --verify --quiet "refs/heads/${branch}"; then
    die "Branch already exists locally: $branch (delete it or choose another name)."
  fi
  git checkout -b "$branch"

  # Compose strict prompt
  # NOTE: Codex only needs to push; PR creation is handled by this script via GitHub MCP afterwards.
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
  printf "%s\n" "$prompt" | codex exec -

  echo
  echo "Codex finished for $ticket_id."

  # Post-checks: ensure clean tree and branch pushed
  ensure_clean_tree || die "Working tree not clean after Codex. Aborting."

  git push --set-upstream "$REMOTE_NAME" "$branch"

  create_pr_via_github_mcp "$pr_title" "$branch" "$ticket_path" "$ticket_id"

  echo "OK: $ticket_id completed, branch pushed: $branch"
  echo "Next: merge the PR created via GitHub MCP before continuing, if tickets depend on each other."
  echo

  # Go back to main (script continues; if you want to force merge-between-tickets, stop here manually)
  git checkout "$MAIN_BRANCH" >/dev/null
done

echo "All tickets processed."
