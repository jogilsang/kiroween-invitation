# Hooks in this repo

Why this page exists: the folder holds two hook formats side by side, and a reader should be able to tell which hook does what, which surface runs it, and what has actually been seen to fire. Everything below was checked on 2026-11-09 (Kiro CLI 2.37.1); what was not observed says so.

## Two formats

| Format | Files | Read by | Notes |
|---|---|---|---|
| Standalone hook files, `version: "v1"` | `*.json` | Kiro IDE 1.0 and Kiro CLI V3 (`kiro-cli --v3 chat`) | Current format ([kiro.dev/docs/hooks](https://kiro.dev/docs/hooks.md)). PascalCase triggers. |
| Legacy IDE 0.x hook files | `*.kiro.hook` | Kiro IDE 0.x (the IDE can upgrade them) | `when.type` / `then.type` shape. Kept so the repo also works in an older IDE. |

Observed on this machine: under the default CLI engine (2.x) the standalone `*.json` files did **not** fire; under `kiro-cli --v3 chat` they did (PreToolUse, PostFileSave and Stop all logged). Use the V3 engine to get these hooks in the CLI.

## Hooks

| Hook | Trigger (CLI `.json`) | IDE `.kiro.hook` pair | Action | Blocks? |
|---|---|---|---|---|
| test-on-save | `PostFileSave` on `engine/**.js`, `tests/**.js` | `test-on-save.kiro.hook` (fileEdited) | `run_tests.sh` (CLI keeps the last 30 lines) | no |
| spec-change-reminder | `PostFileSave` on `requirements.md` / `design.md` | `spec-change-reminder.kiro.hook` (askAgent) | agent prompt: re-sync tasks.md and the evidence | no |
| spec-trace-check | `PostFileSave` on `requirements.md` / `tasks.md` | `spec-trace-check.kiro.hook` (fileEdited) | `spec_trace_check.sh`: named `test_*` exist in `tests/`, every R number in tasks is defined | reports (exit 2 on mismatch; PostFileSave cannot block, so the mismatch list goes to the agent) |
| contrast-on-style-save | `PostFileSave` on `app/style.css`, `engine/svg.js` | `contrast-on-style-save.kiro.hook` | `node --test tests/contrast.test.js` | no |
| public-action-guard | `PreToolUse`, matcher `shell` | none (CLI/IDE 1.0 only) | `public_action_guard.sh`: asks the user before `git push`, repo visibility changes, `aws s3 sync --delete`, `deploy.sh` / `make_public.sh` / `teardown.sh`. `git commit` and everything else pass silently | asks (JSON `permissionDecision: "ask"`); `PUBLIC_GUARD_MODE=block` makes it exit 2 |
| secret-scan-on-commit | `PreToolUse`, matcher `shell` | `pre-commit-secret-scan.kiro.hook` | `secret_scan_on_commit.sh` runs `secret_scan.sh` only when the command contains `git commit` | yes (exit 2) |
| audio-license-guard | `PostFileCreate` and `PostFileSave` on `assets/audio/` | none | `audio_license_check.sh`: every audio file needs a row in `assets/audio/LICENSES.md` with an https source and CC0 | reports (exit 2); the same rule is a test (`tests/audio_license.test.js`) because PostFile hooks cannot block. Added 2026-11-10; not yet observed firing in a Kiro session |

About `pre-commit-secret-scan.kiro.hook`: its `when.type` is `preCommit`, which is not in the trigger list of the Kiro docs we checked (IDE 1.0 hook mapping and hook types pages). We left the file untouched and added the documented CLI pair (`secret-scan-on-commit.json`, PreToolUse). The real git `pre-commit` hook in the parent repo is the backstop for commits made outside Kiro.

## What was actually seen to fire (2026-11-09)

- In a throwaway agent session in this repo (`kiro-cli --v3 chat --no-interactive`), a temporary logger hook recorded `PreToolUse shell` and `PostFileSave`, and a test-on-save-equivalent command ran and exited 0. The logger and the test file were deleted afterwards.
- The same session asked to run `git push --dry-run`. Kiro printed `public-action-guard: git push sends commits off this machine. Confirm with the user before running.` and, being non-interactive, did not run it. This is the guard's "ask" decision honored by Kiro.
- In a throwaway git repo with a staged `.omc/` file, `git commit` run through Kiro was refused and the agent quoted the scan's `.omc` message. A control run without the hook failed for a different reason (permission prompt not answered), so the attribution is likely but not airtight.
- `spec-trace-check` and `contrast-on-style-save` (round 2, same day): a `kiro-cli --v3 chat --agent kiroween --no-interactive` session appended one line to `requirements.md` and one to `app/style.css` with the file write tool. With each hook command temporarily wrapped to also log to `/tmp`, the log showed `16:45:17 contrast-on-style-save rc=0` and `16:45:17 spec-trace-check rc=0 spec trace check: clean (63 requirements, 104 named tests)`. A first run without the wrapper showed only the agent-type `spec-change-reminder` text to the model: the stdout of a PostFileSave **command** hook is not passed to the agent (the docs list stdout forwarding only for SessionStart, UserPromptSubmit and PreToolUse). The wrapper, the two probe lines and both hook files were restored afterwards (`git status` clean).
- Caveat: the contrast command ends in `| tail -30`, so its exit code is tail's, not the test run's. A failing contrast test is still printed but would log `rc=0`.
- Not observed: legacy `.kiro.hook` files (no IDE session).

## Testing the scripts

```
bash .kiro/hooks/selftest.sh
```

Runs every script against a clean case and violation cases using temporary files and a throwaway git repo (30 cases on 2026-11-09 including PostFileSave matcher checks on absolute paths, all passing). Secrets used in the test are assembled at runtime so the test file itself stays clean.

## secret_scan.sh allowances

The scanner no longer skips whole files. Instead it allows two narrow things: the AWS documentation placeholder ids `123456789012` and `000000000000`, and a line marked `scan-allow` for a deliberate example. A real-looking key or account id in `docs/RED_TEAM.md` or `docs/KIRO_EVIDENCE.md` is now caught (covered by the self-test).
