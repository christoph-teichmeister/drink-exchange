#!/usr/bin/env bash
set -euo pipefail

TICKETS_DIR="${1:-docs/tickets/setup}"

if [[ ! -d "$TICKETS_DIR" ]]; then
  echo "Tickets dir not found: $TICKETS_DIR"
  exit 1
fi

if [[ ! -f "AGENTS.md" ]]; then
  echo "AGENTS.md not found in repo root. Create it first."
  exit 1
fi

# Require clean working tree before starting
if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree not clean. Commit/stash changes first:"
  git status --porcelain
  exit 1
fi

# Ensure main exists locally
if ! git show-ref --verify --quiet refs/heads/main; then
  echo "Local branch 'main' not found. Adjust script if you use 'master'."
  exit 1
fi

# Collect tickets: s<number>.md, numeric sort
mapfile -t TICKETS < <(
  find "$TICKETS_DIR" -maxdepth 1 -type f -name 's*.md' \
  | sed -E 's#^.*/s([0-9]+)\.md$#\1\t&#' \
  | sort -n \
  | cut -f2-
)

if [[ ${#TICKETS[@]} -eq 0 ]]; then
  echo "No tickets found in $TICKETS_DIR (expected s<number>.md)."
  exit 0
fi

echo "Found ${#TICKETS[@]} setup tickets."
echo

for ticket_path in "${TICKETS[@]}"; do
  ticket_file="$(basename "$ticket_path")"
  ticket_id="${ticket_file%.md}"   # "s1", "s2", ...
  branch="chore/${ticket_id}"

  echo "=== Processing ticket: $ticket_id ($ticket_path) ==="

  # Start from up-to-date main to avoid weird drift
  git checkout main
  git pull --ff-only

  # Create branch
  git checkout -b "$branch"

  # Build prompt for Codex
  prompt="$(cat <<'PROMPT'
You are Codex CLI running locally in a git repo. You MUST follow AGENTS.md.

Mandatory process:
1) Read the ticket content below. Implement ONLY what is required by its acceptance criteria.
2) Keep diffs minimal. No refactors, no tool swaps, no extra features.
3) Run the relevant checks from AGENTS.md for this ticket. Fix all failures.
4) Commit everything (including lockfiles) with message:
   "chore(<TICKET_ID>): <short title>"
5) Push the branch to origin.
6) Using your connected GitHub MCP, create a Pull Request for this branch:
   - PR title: "chore(<TICKET_ID>): <short title>"
   - PR body must include:
     - Summary of changes (bullet list)
     - How to verify (commands + expected result)
     - Notes/assumptions (if any)
   - The PR should target main.
   - Ensure the PR is created successfully (confirm by outputting the PR URL).

If you are blocked by missing info, choose a reasonable default and document it in the PR body under "Assumptions".

Ticket content:
PROMPT
)"
  prompt="${prompt//$'<TICKET_ID>'/$ticket_id}"
  prompt="${prompt}
$(cat "$ticket_path")"

  # Run codex with the prompt via stdin
  printf "%s\n" "$prompt" | codex

  echo "Codex finished for $ticket_id."

  # Safety: require clean tree after Codex
  if [[ -n "$(git status --porcelain)" ]]; then
    echo "ERROR: Working tree not clean after Codex. Aborting."
    git status --porcelain
    exit 1
  fi

  # Safety: ensure branch exists remotely (Codex should have pushed)
  if ! git ls-remote --exit-code --heads origin "$branch" >/dev/null 2>&1; then
    echo "ERROR: Branch not found on origin: $branch (Codex did not push?)"
    exit 1
  fi

  echo "Done: $ticket_id processed on branch $branch (PR should be created by Codex via GitHub MCP)."
  echo
done

echo "All setup tickets processed."
