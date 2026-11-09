#!/usr/bin/env bash
# Pre-submission mechanical audit. Checks the things that silently disqualify.
# Run from the kiroween-invitation project root. Prints PASS/FAIL per check.
set -u
root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root" || exit 1
pass=0; fail=0
ok(){ echo "PASS  $1"; pass=$((pass+1)); }
no(){ echo "FAIL  $1"; fail=$((fail+1)); }

[ -f LICENSE ] && grep -q "MIT License" LICENSE && ok "MIT LICENSE present at root" || no "MIT LICENSE missing"
[ -d .kiro ] && ok ".kiro/ exists at repo root" || no ".kiro/ missing"
grep -qE '(^|/)\.kiro(/|$)' .gitignore 2>/dev/null && no ".kiro is in .gitignore (DISQUALIFY risk)" || ok ".kiro NOT in .gitignore"
grep -qE '\.omc/' .gitignore 2>/dev/null && ok ".omc/ excluded in .gitignore" || no ".omc/ not excluded"

[ -f .kiro/specs/kiroween-invitation/requirements.md ] && ok "spec: requirements.md" || no "spec: requirements.md missing"
[ -f .kiro/specs/kiroween-invitation/design.md ] && ok "spec: design.md" || no "spec: design.md missing"
[ -f .kiro/specs/kiroween-invitation/tasks.md ] && ok "spec: tasks.md" || no "spec: tasks.md missing"
[ "$(ls .kiro/steering/*.md 2>/dev/null | wc -l | tr -d ' ')" -ge 1 ] && ok "steering docs present" || no "no steering docs"
[ "$(ls .kiro/hooks/*.kiro.hook 2>/dev/null | wc -l | tr -d ' ')" -ge 1 ] && ok "hooks present" || no "no hooks"
[ "$(ls .kiro/agents/*.json 2>/dev/null | wc -l | tr -d ' ')" -ge 1 ] && ok "agents present" || no "no agents"

[ -f README.md ] && grep -qi "1-minute try" README.md && ok "README has judge 1-minute try" || no "README missing judge try"
[ -f docs/KIRO_WRITEUP.md ] && ok "Kiro write-up present" || no "Kiro write-up missing"
[ -f docs/video/SHOTLIST.md ] && ok "video script present" || no "video script missing"
[ -f docs/RED_TEAM.md ] && ok "red team doc present" || no "red team doc missing"

# tests green
if node --test >/tmp/audit_tests.log 2>&1; then ok "node --test passes ($(grep -E 'ℹ tests' /tmp/audit_tests.log | awk '{print $3}') tests)"; else no "node --test FAILED"; fi

# no secrets / account ids in tracked project files (reuse the hook)
if ASCII_INVITE_PREFIX="kiroween_2026/kiroween-invitation/" bash .kiro/hooks/secret_scan.sh >/tmp/audit_scan.log 2>&1; then ok "secret/.omc scan clean"; else no "secret/.omc scan flagged something"; cat /tmp/audit_scan.log; fi

# .omc must not be tracked anywhere in this project
if git ls-files | grep -qE '(^|/)\.omc/'; then no ".omc/ is tracked by git"; else ok ".omc/ not tracked"; fi

echo ""
echo "SUMMARY: $pass passed, $fail failed"
[ "$fail" -eq 0 ] || exit 1
