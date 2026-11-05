#!/usr/bin/env bash
# Pre-commit guard: block secrets, AWS account ids, and .omc/ from being committed.
# Why: Kiroween repo is public; a leaked key or agent-state dir is unrecoverable.
# Usage: run from anywhere inside the repo. Exit 2 = block, 0 = clean.
set -u

gitroot="$(git rev-parse --show-toplevel 2>/dev/null)"
if [ -z "$gitroot" ]; then
  echo "secret scan: not a git repo, skipping" >&2
  exit 0
fi
# Capture the project prefix (path from git root to CWD) BEFORE changing dir.
proj_prefix="$(git rev-parse --show-prefix 2>/dev/null)"
# Allow override so a git hook running at the repo root can still scope correctly.
proj_prefix="${ASCII_INVITE_PREFIX:-$proj_prefix}"
cd "$gitroot" || exit 1

staged="$(git diff --cached --name-only 2>/dev/null)"
if [ -z "$staged" ]; then
  # No staged files: scan only this project's tracked files, not the whole monorepo.
  if [ -n "$proj_prefix" ]; then
    staged="$(git ls-files -- "$proj_prefix")"
  else
    staged="$(git ls-files)"
  fi
else
  # Staged: only this project's staged paths.
  if [ -n "$proj_prefix" ]; then
    staged="$(printf '%s\n' "$staged" | grep -E "^${proj_prefix}" || true)"
  fi
fi

fail=0

# 1) .omc must never be tracked
if printf '%s\n' "$staged" | grep -qE '(^|/)\.omc/'; then
  echo "BLOCK: a .omc/ path is staged. Agent state must never be committed." >&2
  fail=1
fi

# 2) scan text files for secret-like patterns
#    High-signal patterns block outright. The bare 12-digit (AWS account id)
#    pattern only blocks when an account/aws/acct word is on the same line.
high='AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|xox[baprs]-[0-9A-Za-z-]+|ghp_[0-9A-Za-z]{30,}|aws_secret_access_key'
acct='(account|acct|aws)[^0-9]{0,20}[0-9]{12}'

while IFS= read -r f; do
  [ -z "$f" ] && continue
  case "$f" in
    *.png|*.jpg|*.jpeg|*.gif|*.pdf|*.ico|*.woff*|*/node_modules/*|node_modules/*) continue;;
    # The scanner defines the patterns, and the evidence doc documents a planted
    # example; both would self-trip. They carry no real secret.
    */.kiro/hooks/secret_scan.sh|*/docs/KIRO_EVIDENCE.md|*/docs/RED_TEAM.md) continue;;
  esac
  [ -f "$f" ] || continue
  if grep -EnI "$high" "$f" >/dev/null 2>&1; then
    echo "BLOCK: possible secret in $f" >&2
    grep -EnI "$high" "$f" 2>/dev/null | head -3 >&2
    fail=1
  fi
  if grep -EniI "$acct" "$f" >/dev/null 2>&1; then
    echo "BLOCK: possible AWS account id in $f" >&2
    fail=1
  fi
done <<< "$staged"

if [ "$fail" -ne 0 ]; then
  echo "pre-commit secret/.omc scan FAILED (exit 2)" >&2
  exit 2
fi
echo "pre-commit secret/.omc scan: clean"
exit 0
