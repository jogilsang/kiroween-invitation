#!/usr/bin/env bash
# Spec trace check: requirements -> tests, tasks -> requirements.
# Why: the EARS <-> task <-> test chain only holds if names and R numbers really exist.
# Effect: a requirement that names a missing test, or a task that cites an unknown R number, fails loudly.
# Exit 0 = consistent, 2 = mismatch (list on stderr). Override paths with SPEC_DIR / TESTS_DIR for tests.
set -u
root="$(cd "$(dirname "$0")/../.." && pwd)"
spec_dir="${SPEC_DIR:-$root/.kiro/specs/kiroween-invitation}"
tests_dir="${TESTS_DIR:-$root/tests}"
req="$spec_dir/requirements.md"
tasks="$spec_dir/tasks.md"
for f in "$req" "$tasks"; do
  [ -f "$f" ] || { echo "spec trace: missing $f" >&2; exit 2; }
done
[ -d "$tests_dir" ] || { echo "spec trace: missing tests dir $tests_dir" >&2; exit 2; }
fail=0

# 1) every backticked test_* name in requirements must exist as a test title.
all_tests="$(cat "$tests_dir"/*.js 2>/dev/null)"
missing_tests=""
for t in $(grep -oE '`test_[A-Za-z0-9_]+`' "$req" | tr -d '`' | sort -u); do
  if ! printf '%s' "$all_tests" | grep -qF "$t"; then
    missing_tests="$missing_tests $t"
  fi
done
if [ -n "$missing_tests" ]; then
  echo "TRACE: requirements name tests that do not exist in tests/:" >&2
  for t in $missing_tests; do echo "  - $t" >&2; done
  fail=1
fi

# 2) every R number cited in tasks.md must be defined as "- **R<n>**" in requirements.md.
defined="$(grep -oE '^- \*\*R[0-9]+\*\*' "$req" | grep -oE '[0-9]+' | sort -un)"
cited="$(
  {
    # ranges like R22-R26 expand to every number in between
    grep -oE 'R[0-9]+ ?- ?R[0-9]+' "$tasks" | while read -r r; do
      a="$(printf '%s' "$r" | sed -E 's/R([0-9]+) ?- ?R([0-9]+)/\1/')"
      b="$(printf '%s' "$r" | sed -E 's/R([0-9]+) ?- ?R([0-9]+)/\2/')"
      seq "$a" "$b" 2>/dev/null
    done
    grep -oE 'R[0-9]+' "$tasks" | grep -oE '[0-9]+'
  } | sort -un
)"
unknown=""
for n in $cited; do
  if ! printf '%s\n' "$defined" | grep -qx "$n"; then unknown="$unknown R$n"; fi
done
if [ -n "$unknown" ]; then
  echo "TRACE: tasks.md cites R numbers that requirements.md does not define:" >&2
  for r in $unknown; do echo "  - $r" >&2; done
  fail=1
fi

if [ "$fail" -ne 0 ]; then
  echo "spec trace check FAILED (exit 2)" >&2
  exit 2
fi
echo "spec trace check: clean ($(printf '%s\n' "$defined" | grep -c .) requirements, $(grep -oE '`test_[A-Za-z0-9_]+`' "$req" | sort -u | wc -l | tr -d ' ') named tests)"
exit 0
