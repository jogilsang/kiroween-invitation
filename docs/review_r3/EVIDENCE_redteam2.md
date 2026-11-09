# EVIDENCE: redteam2 (2026-11-09, branch wt/redteam2)

Only real command results. Kiro CLI 2.37.1. No account ids, keys or tokens.

## 1. red-team agent invoked (Round 4, receiver view)

- Command: `kiro-cli chat --agent red-team --no-interactive --trust-workspace "<Round 4 task>"` (default engine, model pinned `claude-sonnet-4.6`).
- The agent appended D1-D30 to `docs/redteam_probe.mjs`, ran `node docs/redteam_probe.mjs`, and wrote `## Round 4 (2026-11-09) receiver view` in `docs/RED_TEAM.md`.
- Shell limits held: `node -e "..."` and `node --input-type=module << 'EOF'` were refused with `[denied] tool permission approval is not supported in non-interactive mode`. Creating `docs/debug_d13.mjs` was refused the same way (not in its write allow-list). `ls docs/debug_d13.mjs` afterwards: no such file.
- Write limit held: the agent's attempt to write `engine/recv_probe.txt` was refused; `ls engine/recv_probe.txt`: no such file.
- `git status --short` right after the run: only `M docs/RED_TEAM.md` and `M docs/redteam_probe.mjs`.
- Result: 30 probes; 3 not blocked (D24, D26, D29 → gaps D-G1, D-G3, D-G4), all in pure engine functions that the app calls only with `location.origin` and the real `navigator`. Agent verdict: GO.
- Conductor re-check by hand (same day): probe output identical. Corrections, written under "Conductor's check of Round 4" in RED_TEAM.md: D13 prints no `corrupt` field (real value `true`; with a browser-style `new URL(...).search` the hash is dropped and the mode is `receiver`); D12 first `i` wins (checked with two valid params); D17's name does not match its code; year 9999 in a share config is clamped to 2026 by `normalizeConfig`.

## 2. PostFileSave hooks seen firing (spec-trace-check, contrast-on-style-save)

- Run 1: `kiro-cli --v3 chat --agent kiroween --no-interactive --trust-workspace` appended one line each to `.kiro/specs/kiroween-invitation/requirements.md` and `app/style.css` with the file write tool. The agent saw only the `spec-change-reminder` agent-type instruction (`hook_event_name: PostFileSave`, absolute `file_path`). No output of the two command hooks reached it.
- Run 2: same task, with the two hook commands temporarily wrapped to append one line to `/tmp/rt2_hooklog.txt`. Log:
  ```
  16:45:17 contrast-on-style-save rc=0 ℹ duration_ms 85.857
  16:45:17 spec-trace-check rc=0 spec trace check: clean (63 requirements, 104 named tests)
  ```
- Reading: both command hooks fire under `--v3` on a write-tool save; their stdout is not shown to the agent (docs list stdout forwarding for SessionStart, UserPromptSubmit, PreToolUse only). The contrast command's `rc` is `tail`'s (pipe), not the test's.
- Clean-up: `git restore` on the two hook JSON files, `requirements.md`, `app/style.css`; `git status --short` empty afterwards. Temp files `/tmp/rt2_hook_run*.txt`, `/tmp/rt2_hooklog.txt` deleted.
- Not tried: default 2.x engine for these two hooks (round 3 already showed standalone hooks do not fire there), IDE `.kiro.hook` pair.

## 3. Checks at the end

- `node --test`: 158 pass, 0 fail.
- `bash .kiro/hooks/selftest.sh`: 30 passed, 0 failed (23 + 7 new matcher cases).
- `bash .kiro/hooks/spec_trace_check.sh`: `clean (63 requirements, 104 named tests)`.
