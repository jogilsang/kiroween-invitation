#!/usr/bin/env bash
# PreToolUse guard: ask the user before an action that leaves this machine or goes public.
# Why: the repo policy is "publishing, pushing and deploying need a human yes"; this makes it code.
# Effect: git push, repo visibility changes, aws s3 sync --delete and deploy.sh stop and ask.
#         git commit and every other command pass silently (exit 0, no output).
# Input: hook event JSON on stdin (tool_input.command). Output: a JSON "ask" decision on stdout.
# PUBLIC_GUARD_MODE=block turns "ask" into exit 2 (hard block, reason on stderr) for unattended runs.
# NOTE: the "ask" JSON shape is not described on the public hooks pages (only exit 0 / 2 are); if a
# Kiro version ignores it the command simply proceeds. Use PUBLIC_GUARD_MODE=block when that matters.
set -u
input="$(cat)"
cmd="$(printf '%s' "$input" | node -e '
  let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
    try{const j=JSON.parse(s);const c=(j.tool_input&&(j.tool_input.command||j.tool_input.cmd))||"";process.stdout.write(String(c));}
    catch(e){process.stdout.write("");}
  });' 2>/dev/null)"
[ -z "$cmd" ] && exit 0

reason=""
# Patterns are matched against the command text; commit/status/diff/log/test never match.
if printf '%s' "$cmd" | grep -Eq '(^|[;&|[:space:]])git([[:space:]]+(-C|-c)[[:space:]]+[^[:space:]]+|[[:space:]]+--[a-z-]+(=[^[:space:]]+)?)*[[:space:]]+push([[:space:]]|$)'; then
  reason="git push sends commits off this machine"
elif printf '%s' "$cmd" | grep -Eq 'gh[[:space:]]+repo[[:space:]]+(edit|create)[^;&|]*--visibility|gh[[:space:]]+repo[[:space:]]+edit[^;&|]*--accept-visibility-change-consequences|--visibility[[:space:]=]+public'; then
  reason="this changes or sets repository visibility"
elif printf '%s' "$cmd" | grep -Eq 'aws[[:space:]]+s3[[:space:]]+sync[^;&|]*--delete'; then
  reason="aws s3 sync --delete can remove deployed objects"
elif printf '%s' "$cmd" | grep -Eq '(^|[;&|[:space:]/])(deploy\.sh|make_public\.sh|teardown\.sh)([[:space:]]|$)'; then
  reason="deploy/publish/teardown scripts change live resources"
fi

[ -z "$reason" ] && exit 0

if [ "${PUBLIC_GUARD_MODE:-ask}" = "block" ]; then
  echo "public-action-guard: blocked - $reason. Ask the user, then rerun with PUBLIC_GUARD_MODE=ask." >&2
  exit 2
fi
node -e '
  const reason=process.argv[1];
  process.stdout.write(JSON.stringify({hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"ask",permissionDecisionReason:"public-action-guard: "+reason+". Confirm with the user before running."}}));
' "$reason"
exit 0
