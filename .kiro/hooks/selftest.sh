#!/usr/bin/env bash
# Self-test for the hook scripts: clean case and violation cases, using throwaway temp files/repos.
# Why: a guard nobody has seen fail is not evidence. Run: bash .kiro/hooks/selftest.sh
# Exit 0 = every case behaved as expected. Prints one PASS/FAIL line per case.
set -u
here="$(cd "$(dirname "$0")" && pwd)"
proj="$(cd "$here/../.." && pwd)"
pass=0; failn=0
check(){ # name expected_rc actual_rc
  if [ "$2" = "$3" ]; then echo "PASS $1 (exit $3)"; pass=$((pass+1)); else echo "FAIL $1 (expected $2, got $3)"; failn=$((failn+1)); fi
}
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT

# --- spec_trace_check.sh ---
bash "$here/spec_trace_check.sh" >/dev/null 2>&1; check "spec-trace: real spec is consistent" 0 $?
mkdir -p "$tmp/spec" "$tmp/tests"
printf '%s\n' '- **R1** THE SYSTEM SHALL x. — `test_exists_one`, `test_missing_two`' > "$tmp/spec/requirements.md"
printf '%s\n' '- [x] T1 does R1 and R7 and R2-R3' > "$tmp/spec/tasks.md"
printf '%s\n' 'test("test_exists_one", () => {});' > "$tmp/tests/a.test.js"
out="$(SPEC_DIR="$tmp/spec" TESTS_DIR="$tmp/tests" bash "$here/spec_trace_check.sh" 2>&1)"; rc=$?
check "spec-trace: missing test + unknown R -> exit 2" 2 $rc
echo "$out" | grep -q "test_missing_two" && echo "PASS spec-trace: names the missing test" || { echo "FAIL spec-trace: missing test not named"; failn=$((failn+1)); }
echo "$out" | grep -q "R7" && echo "PASS spec-trace: names the unknown R7" || { echo "FAIL spec-trace: R7 not named"; failn=$((failn+1)); }

# --- public_action_guard.sh ---
guard(){ printf '{"tool_input":{"command":%s}}' "$(node -e 'process.stdout.write(JSON.stringify(process.argv[1]))' "$1")" | bash "$here/public_action_guard.sh" 2>/dev/null; }
for c in "git push origin main" "git -C x push" "gh repo edit o/r --visibility public" "aws s3 sync dist s3://b --delete" "bash deploy/deploy.sh"; do
  out="$(guard "$c")"; echo "$out" | grep -q '"permissionDecision":"ask"' && check "guard asks: $c" 0 0 || check "guard asks: $c" 0 1
done
for c in "git commit -m 'feat: push notifications'" "git status" "node --test" "git log --oneline" "aws s3 ls"; do
  out="$(guard "$c")"; [ -z "$out" ] && check "guard silent: $c" 0 0 || check "guard silent: $c" 0 1
done
printf '{"tool_input":{"command":"git push"}}' | PUBLIC_GUARD_MODE=block bash "$here/public_action_guard.sh" >/dev/null 2>&1; check "guard block mode -> exit 2" 2 $?
printf 'not json' | bash "$here/public_action_guard.sh" >/dev/null 2>&1; check "guard bad stdin -> exit 0 (fail open)" 0 $?

# --- secret_scan.sh (throwaway git repo; secrets assembled at runtime so this file stays clean) ---
repo="$tmp/repo"; mkdir -p "$repo/engine" "$repo/.kiro/hooks"; cp "$here/secret_scan.sh" "$repo/.kiro/hooks/"
( cd "$repo" && git init -q && git config user.email t@t && git config user.name t
  echo 'const a = 1;' > engine/ok.js && git add engine/ok.js )
( cd "$repo" && bash .kiro/hooks/secret_scan.sh >/dev/null 2>&1 ); check "secret-scan: clean staged file" 0 $?
key="AKI""A""ABCDEFGHIJKLMNOP"
( cd "$repo" && echo "const k='$key';" > engine/bad.js && git add engine/bad.js && bash .kiro/hooks/secret_scan.sh >/dev/null 2>&1 ); check "secret-scan: key-shaped string blocked" 2 $?
( cd "$repo" && git rm -q --cached engine/bad.js && rm engine/bad.js )
( cd "$repo" && echo "aws account 5550""01234567" > engine/id.js && git add engine/id.js && bash .kiro/hooks/secret_scan.sh >/dev/null 2>&1 ); check "secret-scan: real-looking account id blocked" 2 $?
( cd "$repo" && git rm -q --cached engine/id.js && rm engine/id.js )
( cd "$repo" && mkdir -p docs && echo "aws account 123456789012" > docs/KIRO_EVIDENCE.md && git add docs/KIRO_EVIDENCE.md && bash .kiro/hooks/secret_scan.sh >/dev/null 2>&1 ); check "secret-scan: AWS placeholder id allowed" 0 $?
( cd "$repo" && echo "const k='$key';" > docs/RED_TEAM.md && git add docs/RED_TEAM.md && bash .kiro/hooks/secret_scan.sh >/dev/null 2>&1 ); check "secret-scan: key in formerly-excluded RED_TEAM.md now blocked" 2 $?
( cd "$repo" && git rm -q --cached docs/RED_TEAM.md && rm docs/RED_TEAM.md && mkdir -p .omc && echo x > .omc/s.json && git add -f .omc/s.json && bash .kiro/hooks/secret_scan.sh >/dev/null 2>&1 ); check "secret-scan: staged .omc/ blocked" 2 $?

# --- secret_scan_on_commit.sh (adapter): only reacts to git commit ---
cp "$here/secret_scan_on_commit.sh" "$repo/.kiro/hooks/"
on(){ ( cd "$repo" && printf '{"tool_input":{"command":%s}}' "$(node -e 'process.stdout.write(JSON.stringify(process.argv[1]))' "$1")" | bash .kiro/hooks/secret_scan_on_commit.sh >/dev/null 2>&1 ); }
on "git commit -m x"; check "commit-adapter: git commit with staged .omc -> exit 2" 2 $?
on "git status"; check "commit-adapter: non-commit command ignored" 0 $?
( cd "$repo" && git rm -q --cached -f .omc/s.json )
on "git commit -m x"; check "commit-adapter: clean commit passes" 0 $?

# --- PostFileSave matchers (2026-11-09): the event's file_path is ABSOLUTE (observed in a kiro-cli --v3 session) ---
m(){ # hook_json absolute_path expected(1 match / 0 no match)
  r="$(node -e 'const j=require(process.argv[1]);process.stdout.write(new RegExp(j.hooks[0].matcher).test(process.argv[2])?"1":"0")' "$here/$1" "$2")"
  check "matcher $1 on ${2#$proj/}" "$3" "$r"
}
m spec-trace-check.json "$proj/.kiro/specs/kiroween-invitation/requirements.md" 1
m spec-trace-check.json "$proj/.kiro/specs/kiroween-invitation/tasks.md" 1
m spec-trace-check.json "$proj/.kiro/specs/kiroween-invitation/design.md" 0
m contrast-on-style-save.json "$proj/app/style.css" 1
m contrast-on-style-save.json "$proj/engine/svg.js" 1
m contrast-on-style-save.json "$proj/app/main.js" 0
m contrast-on-style-save.json "$proj/app/style.css.bak" 0

echo "selftest: $pass passed, $failn failed"
[ "$failn" -eq 0 ]
