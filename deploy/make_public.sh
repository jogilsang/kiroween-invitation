#!/usr/bin/env bash
# Build a clean copy of this project for the PUBLIC Kiroween repo.
# It only COPIES to a staging folder and scans it. It never pushes, never
# creates a remote, never touches the private monorepo. Publishing is a
# separate, human-approved step.
#
# Usage: bash deploy/make_public.sh [output_dir]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-$HOME/kiroween_public_staging/ascii-invite}"

rm -rf "$OUT"
mkdir -p "$OUT"

# Copy everything except local state, deps, build output, and git metadata.
# NOTE: .kiro/ MUST be included (Kiroween requires it at the repo root).
rsync -a \
  --exclude '.omc/' \
  --exclude 'node_modules/' \
  --exclude 'dist/' \
  --exclude '.git/' \
  --exclude '.DS_Store' \
  --exclude '.env' --exclude '.env.*' \
  "$ROOT/" "$OUT/"

fail=0
chk() { if eval "$2"; then echo "PASS  $1"; else echo "FAIL  $1"; fail=1; fi; }

chk ".kiro/ present at root"            "[ -d '$OUT/.kiro' ]"
chk "LICENSE present (MIT)"             "grep -q 'MIT License' '$OUT/LICENSE'"
chk ".kiro not ignored by .gitignore"   "! grep -qE '(^|/)\\.kiro(/|\$)' '$OUT/.gitignore'"
chk "no .omc directory"                 "[ ! -e '$OUT/.omc' ]"
chk "no node_modules"                   "[ ! -e '$OUT/node_modules' ]"

# Secret / account-id scan over the staged copy (patterns kept in the hook script).
SCAN_HITS=$(grep -rEIl 'AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|ghp_[0-9A-Za-z]{30,}|xox[baprs]-[0-9A-Za-z-]+' "$OUT" 2>/dev/null \
  | grep -vE '/\.kiro/hooks/secret_scan\.sh$|/docs/(KIRO_EVIDENCE|RED_TEAM)\.md$' || true)
chk "no secret-like strings"            "[ -z '$SCAN_HITS' ]"

# 12-digit AWS account ids next to an aws/account word (same rule as the hook).
ACCT_HITS=$(grep -rEiIl '(account|acct|aws)[^0-9]{0,20}[0-9]{12}' "$OUT" 2>/dev/null \
  | grep -vE '/\.kiro/hooks/secret_scan\.sh$|/docs/(KIRO_EVIDENCE|RED_TEAM)\.md$' || true)
chk "no AWS account ids"                "[ -z '$ACCT_HITS' ]"

# Tests must pass on the staged copy, not just in the monorepo.
if (cd "$OUT" && npm install --silent >/dev/null 2>&1 && node --test >/tmp/public_tests.log 2>&1); then
  echo "PASS  tests pass on the staged copy ($(grep -E '^ℹ tests' /tmp/public_tests.log | awk '{print $3}') tests)"
else
  echo "FAIL  tests failed on the staged copy"; fail=1
fi
rm -rf "$OUT/node_modules"

echo ""
echo "Staged at: $OUT"
if [ "$fail" -ne 0 ]; then echo "RESULT: NOT READY (fix the FAIL lines above)"; exit 1; fi
echo "RESULT: READY. Nothing was pushed. Next (human-approved): create the public repo and push this folder."
