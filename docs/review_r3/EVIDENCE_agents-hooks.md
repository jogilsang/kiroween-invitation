# Evidence: agents-hooks (2026-11-09)

All entries are dated 2026-11-09 and come from commands run in the `wt/agents-hooks` worktree (or a throwaway temp folder, named as such) on Kiro CLI 2.37.1, Node 26.3.1. No account ids, keys or tokens appear below.

## 0. Official docs checked first

Fetched as Markdown from kiro.dev (the HTML pages render empty to a fetcher; the `.md` form is linked from https://kiro.dev/llms.txt).

| Question | Source | Result |
|---|---|---|
| (a) agent fields | https://kiro.dev/docs/custom-agents/configuration-reference.md | Fields: `name`, `description`, `prompt`, `mcpServers`, `tools`, `toolAliases`, `allowedTools`, `permissions`, `toolsSettings`, `resources`, `hooks`, `includeMcpJson`, `model`, `keyboardShortcut`, `welcomeMessage` (+ V3 `excludedTools`, `includePowers`). **`scope` is not a documented field.** |
| (a) write path limits | same page + https://kiro.dev/docs/cli/2x-reference.md + https://kiro.dev/docs/permissions.md | CLI V3 / IDE 1.0: `permissions.rules` with `capability: fs_write`, glob `match`, `effect` allow/ask/deny, deny wins. CLI 2.x: `toolsSettings.fs_write.allowedPaths/deniedPaths` (V3 ignores `toolsSettings`). `kiro-cli agent upgrade` writes both, which is the "universal" format both engines load. |
| (a) resources | configuration reference | `file://` paths relative to the agent file's folder or absolute; globs allowed; at most 32 files / 100,000 characters. |
| (a) model | configuration reference | must be an id from the model service; an unavailable id makes the first prompt fail. `kiro-cli chat --list-models` lists `claude-sonnet-4.6` on this account. |
| (b) CLI hook format | https://kiro.dev/docs/hooks.md, https://kiro.dev/docs/hooks/types.md, https://kiro.dev/docs/hooks/actions.md | `.kiro/hooks/*.json` with `version: "v1"`, `hooks[]` of `{name, trigger, matcher?, action{type: command|agent}}`. Triggers include `PreToolUse`, `PostToolUse`, `Stop`, `UserPromptSubmit`, `SessionStart`, `PostFileSave`, `PostFileCreate`, `PostFileDelete`, `PreTaskExec`, `PostTaskExec`. PreToolUse exit 0 = allow, 2 = block (stderr to the model), other = warning. File triggers fire only on agent changes. |
| (c) IDE `preCommit` | https://kiro.dev/docs/ide/whats-new-v1/hooks.md (0.x to 1.0 mapping table) and hook types page | `preCommit` is **not listed** (mapped 0.x types: agentSpawn, agentStop, promptSubmit, preToolUse, postToolUse, fileCreated, fileEdited, fileDeleted, preTaskExecution, postTaskExecution, userTriggered). Treated as **unconfirmed**; the file was left as is and a documented CLI pair was added instead. |
| "ask" JSON decision | not on the pages above | **Not documented there.** Implemented with a block-mode fallback, then observed working in a V3 session (section 3). |

## 1. Agent configuration (B-01, B-02, B-04, B-05, B-06, B-07, B-11)

- All five files now carry `tools`, `allowedTools` (read tools only), `permissions.rules` (fs_read allow with `.env`/`.omc` deny, fs_write allow list and deny list, shell allow and deny), the equivalent `toolsSettings` for the 2.x engine, `resources` (three steering files + requirements), and `includeMcpJson`. The non-standard `scope` field was removed; the prompt now states the enforced paths.
- Ownership: svg-engine, invite-logic and art-tuner may write only their engine files plus their own tests and a new-test glob; kiroween writes app/, deploy/, docs/ (except the two red-team files), .kiro/specs, .kiro/steering, engine/index.js, root files and the cross-cutting tests, and gets an **ask** for .kiro/agents, .kiro/hooks, .kiro/settings; red-team writes only `docs/RED_TEAM.md` and `docs/redteam_probe.mjs`.
- `kiro-cli agent validate --path` on all five files: exit 0 each.
- `kiro-cli agent upgrade --dry-run` on a copy: all five "skipped, out of sync (not rebuilt)", 0 errors (they already carry both blocks).
- red-team model: `claude-sonnet-4.6` (listed by `--list-models`; the red-team runs in section 4 completed with it). The other four keep `auto`.
- Found while testing (temp agents in a temp folder): on the 2.x engine a `toolsSettings.execute_bash.allowedCommands` regex must match the **whole** command (`^node ` was refused for `node --version`; `node [^&;|<>]*` and `node .*` ran). The patterns now end with a class that excludes `& ; | < > ` and `$`, so chained or redirected commands fall through to a prompt.
- Enforcement check with a neutral temp agent carrying the red-team rules (deleted afterwards): default engine and `--v3` both refused `engine/x.txt` at the tool, both wrote `docs/RED_TEAM.md`.

## 2. Hook scripts run by hand (B-09, A-02, A-12, A-13, A-14, A-16)

`bash .kiro/hooks/selftest.sh` (temp files and a throwaway git repo, removed by the script):

```
PASS spec-trace: real spec is consistent (exit 0)
PASS spec-trace: missing test + unknown R -> exit 2 (exit 2)
PASS spec-trace: names the missing test
PASS spec-trace: names the unknown R7
PASS guard asks: git push origin main / git -C x push / gh repo edit o/r --visibility public / aws s3 sync dist s3://b --delete / bash deploy/deploy.sh
PASS guard silent: git commit -m 'feat: push notifications' / git status / node --test / git log --oneline / aws s3 ls
PASS guard block mode -> exit 2 (exit 2)
PASS guard bad stdin -> exit 0 (fail open) (exit 0)
PASS secret-scan: clean staged file (exit 0)
PASS secret-scan: key-shaped string blocked (exit 2)
PASS secret-scan: real-looking account id blocked (exit 2)
PASS secret-scan: AWS placeholder id allowed (exit 0)
PASS secret-scan: key in formerly-excluded RED_TEAM.md now blocked (exit 2)
PASS secret-scan: staged .omc/ blocked (exit 2)
PASS commit-adapter: git commit with staged .omc -> exit 2 (exit 2)
PASS commit-adapter: non-commit command ignored (exit 0)
PASS commit-adapter: clean commit passes (exit 0)
selftest: 23 passed, 0 failed
```

(The first guard draft asked on `git commit -m 'feat: push notifications'` because "push" appeared after `git`; the pattern was narrowed so only a `push` subcommand matches.)

On the real repo: `bash .kiro/hooks/spec_trace_check.sh` -> `spec trace check: clean (51 requirements, 80 named tests)`, exit 0. `bash .kiro/hooks/secret_scan.sh` -> clean after removing the file excludes (the evidence doc's `123456789012` example is the documentation placeholder). `node --test tests/contrast.test.js` -> 7 pass. `test-on-save.json` now keeps `tail -30`.

## 3. Do hooks fire inside Kiro? (A-01)

- Temp folder, default engine (`kiro-cli chat`): a standalone `.kiro/hooks/probe.json` logging PreToolUse / PostFileSave / Stop wrote **nothing** while the agent ran a shell command and wrote a file. The same events defined inside the agent file in the legacy object form did log (`agent-preToolUse`, `agent-stop`).
- Same folder, `kiro-cli --v3 chat`: the standalone file logged `PreToolUse 16:26:02`, `PostFileSave 16:26:02`, `Stop 16:26:06`.
- This repo, `kiro-cli --v3 chat --no-interactive` with a temporary logger hook and a temporary agent (both deleted, as was the test file it wrote): log lines `16:26:44 PreToolUse shell`, `16:26:44 PostFileSave`, `16:26:45 test-on-save-equivalent rc=0`. The PostFileSave event's `file_path` is absolute, so the repo matchers (which use `(^|/)` or a path suffix) match it.
- Same session, `git push --dry-run`: Kiro printed `[tool] public-action-guard: git push sends commits off this machine. Confirm with the user before running.` and did not run it (non-interactive cannot answer the prompt). This is the real `public-action-guard.json`, not the logger.
- Throwaway repo with a staged `.omc/` file, `--v3`, the real `secret-scan-on-commit.json`: `git commit -m test` was refused and the agent repeated the `.omc` message. Control without the hook also failed, but with "permission request was not answered", so attribution is likely, not proven.
- Not observed: spec-trace-check and contrast-on-style-save firing in a session; any `.kiro.hook` file (no IDE session).

## 4. red-team invoked with the new settings (B-03)

- Run 1: `kiro-cli chat --agent red-team --no-interactive --trust-workspace "<task>"`. Shell was refused (allow regex did not match the whole command), so the agent fell back to reading code. Writes to `engine/`, `app/`, `tests/` were refused. Its Round 3 text was discarded (based on code reading, not runs).
- Run 2, after fixing the shell patterns, same command: the transcript shows `Running: node docs/redteam_probe.mjs` twice with `status: Completed`, edits to `redteam_probe.mjs` (cases C1-C4 appended) and `RED_TEAM.md`, and three `status: Failed` write attempts. `git status` afterwards: only those two docs changed; no `zz_scope_probe.txt` anywhere. Re-running the probe by hand prints the same C1-C4 lines the agent recorded.
- Probe 3 (`git push --dry-run` asked of red-team directly): the model declined to try; its shell deny is shown working with a temp agent in section 1 instead.

## 5. MCP (A-17)

`.kiro/settings/mcp.json` adds the chrome-devtools server (`--autoConnect`) because `docs/KIRO_EVIDENCE.md` records real use ("Verified via chrome-devtools MCP in real Chrome", 2026-11-05). Only kiroween loads it (`includeMcpJson: true`, tool `@chrome-devtools`, each call `ask`). Not started in this session.

## 6. Test suite

`node --test` after the changes: 131 tests, 131 pass, 0 fail.
