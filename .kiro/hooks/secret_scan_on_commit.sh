#!/usr/bin/env bash
# PreToolUse adapter: run secret_scan.sh when the agent is about to run `git commit`.
# Why: the IDE-only `pre-commit-secret-scan.kiro.hook` uses a trigger (`preCommit`) that the Kiro hooks
#      docs do not list, so the CLI needs a documented trigger (PreToolUse) for the same guard.
# Effect: a commit with a secret-like string, an AWS account id or a staged .omc/ path is blocked (exit 2);
#         every other command, and a clean commit, passes silently.
# Limit: it runs BEFORE the command, so in `git add x && git commit` the file x is not staged yet; the scan then
#        covers all tracked project files instead. A real git pre-commit hook (outside this repo) is the backstop.
set -u
here="$(cd "$(dirname "$0")" && pwd)"
input="$(cat)"
cmd="$(printf '%s' "$input" | node -e '
  let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
    try{const j=JSON.parse(s);process.stdout.write(String((j.tool_input&&(j.tool_input.command||j.tool_input.cmd))||""));}
    catch(e){process.stdout.write("");}
  });' 2>/dev/null)"
printf '%s' "$cmd" | grep -Eq '(^|[;&|[:space:]])git([[:space:]]+(-C|-c)[[:space:]]+[^[:space:]]+|[[:space:]]+--[a-z-]+(=[^[:space:]]+)?)*[[:space:]]+commit([[:space:]]|$)' || exit 0
bash "$here/secret_scan.sh" >/dev/null
rc=$?
if [ "$rc" -eq 2 ]; then
  # re-run to put the findings on stderr (the agent sees stderr on exit 2)
  bash "$here/secret_scan.sh" >&2
  exit 2
fi
exit 0
