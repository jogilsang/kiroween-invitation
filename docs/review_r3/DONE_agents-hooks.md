# DONE: agents-hooks (2026-11-09, branch wt/agents-hooks)

Details and raw results: `docs/review_r3/EVIDENCE_agents-hooks.md`. Final check: `node --test` 131/131 pass, `kiro-cli agent validate` 5/5 exit 0, `bash .kiro/hooks/selftest.sh` 23/23 pass, `spec_trace_check.sh` clean, `secret_scan.sh` clean. Nothing pushed, nothing deployed.

## 1. Done

| ID | Commit | What | Verification |
|---|---|---|---|
| docs check (a)(b)(c) | (evidence) | Read the kiro.dev agent reference, hooks, hook types, actions, permissions, 2.x reference, IDE 1.0 hook mapping | `scope` not a field; `toolsSettings` 2.x / `permissions` V3; PreToolUse exit 2 = block; `preCommit` not listed (left untouched) |
| A-17 | 82d250e | `.kiro/settings/mcp.json` with chrome-devtools; kiroween loads it, each call asks | KIRO_EVIDENCE records real chrome-devtools use (11-05); not started this session |
| B-01 B-02 B-04 B-05 B-06 B-07 B-11 | 900a694 | Five agents: `tools`, read-only `allowedTools`, `permissions.rules` + matching `toolsSettings` (both engines), `resources` (steering x3 + requirements), `scope` removed. Role agents write only their engine files and own tests; kiroween app/deploy/docs/specs/steering/index.js/root files, asks for .kiro/agents, hooks, settings, cannot touch red-team files; red-team writes only RED_TEAM.md and redteam_probe.mjs; red-team model `claude-sonnet-4.6` | validate 5/5; neutral temp agent refused `engine/x.txt` and wrote `docs/RED_TEAM.md` on both engines |
| A-16 | 3d9c3be | Secret scan: no more file excludes; allows only the AWS doc placeholder ids and a `scan-allow` line marker | self-test: key in RED_TEAM.md now blocked; placeholder allowed; real tree clean |
| A-14 | 33d601c | CLI test-on-save keeps 30 lines | file diff |
| A-13 A-12 | 670b536 | `spec_trace_check.sh` + PostFileSave CLI hook + IDE pair | real spec clean (51 R, 80 named tests); planted mismatch exit 2 with names listed |
| B-09 A-12 | 5eee447 | `public-action-guard` PreToolUse: asks on git push, visibility change, `aws s3 sync --delete`, deploy/publish/teardown scripts; commits pass | self-test 12 cases; **observed in a V3 session**: push held with the guard's reason |
| A-02 | 5fb58b4 | `secret-scan-on-commit` PreToolUse CLI pair (only on `git commit`) | self-test 3 cases; V3 session in a throwaway repo refused a commit with staged `.omc/` (attribution likely, see evidence) |
| (brief 2-4) | 1699b71 | `contrast-on-style-save` CLI + IDE pair | `node --test tests/contrast.test.js` 7 pass by hand; not observed firing |
| (verification) | bd17d34 | `.kiro/hooks/selftest.sh` | 23/23 |
| A-15 A-01 | 79bbbe9 | `.kiro/hooks/README.md`: formats, triggers, what was and was not seen firing | A-01 result: standalone hooks do **not** fire on the default 2.x CLI engine; they **do** on `kiro-cli --v3` (PreToolUse, PostFileSave, Stop logged) |
| B-03 | 46edda0 | red-team really invoked (`kiro-cli chat --agent red-team --no-interactive`), ran the probe, added C1-C4, Round 3 in RED_TEAM.md, permission self-check (3/3 refused), conductor's check note | `git status` after: only its two files changed; probe re-run by hand prints the same C1-C4 |

## 2. Not done, and why

- `spec-trace-check` and `contrast-on-style-save` were not seen firing inside a Kiro session (only the shared PostFileSave path was observed, with a logger). Scripts were run by hand.
- Legacy `.kiro.hook` files were not exercised: no Kiro IDE session here. `pre-commit-secret-scan.kiro.hook` (`preCommit`, undocumented) left as is.
- The `permissionDecision: "ask"` JSON is not described on the docs pages read. It worked in V3 (observed); behaviour on other surfaces is unknown. `PUBLIC_GUARD_MODE=block` is the fallback.
- The secret-scan-on-commit run is "likely" attribution: the control run failed for another reason.
- red-team was asked to try `git push --dry-run` and declined on its own, so its shell deny was shown with a temp agent instead.
- No new spec R numbers (per the rule).

## 3. Requests for the conductor

1. **kiro-docs**: merge `EVIDENCE_agents-hooks.md` into `docs/KIRO_EVIDENCE.md`, and fix the text that implies hooks fire in any CLI session: they fire under `kiro-cli --v3` (or IDE 1.0), not the default 2.x engine on this machine. KIRO_WRITEUP / README hook and agent sections should say "permissions enforced at the tool level (checked)" and mention `kiro-cli --v3`.
2. **kiro-docs**: remove any remaining mention of the agents' `scope` field from submission docs; it was not a Kiro field and is gone.
3. **app-recv / invite-logic owner**: red-team Gap C3: a forged share param with a nested array in `e[0]` decodes with `ok:true` and an empty date. Proposed test `test_forged_nested_event_array_reports_invalid`. Decide whether `ok:false` is wanted.
4. **app-recv**: new test files should follow the per-agent globs (`tests/svg_*`, `tests/logic_*`, `tests/art_*`; kiroween `tests/static_*`, `tests/recv_*`), or agent permissions need updating. `tests/static_checks.test.js` (kiro-docs) fits kiroween's glob.
5. Conductor: the agents ask before editing `.kiro/agents|hooks|settings` (kiroween), so future permission changes need a human yes. The generator script used for the agent files is not committed (one-off); edit the JSON directly or ask agents-hooks.
