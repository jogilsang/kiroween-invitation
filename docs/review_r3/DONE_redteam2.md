# DONE: redteam2 (2026-11-09, branch wt/redteam2)

Raw results: `docs/review_r3/EVIDENCE_redteam2.md`. Final check: `node --test` 158/158 pass, `selftest.sh` 30/30, `spec_trace_check.sh` clean (63 R, 104 named tests). Nothing pushed, nothing deployed, no engine/app change.

## 1. Done

| ID | Commit | What | Verification |
|---|---|---|---|
| brief 1 | 3f4d478 | red-team (real `kiro-cli chat --agent red-team --no-interactive`) added D1-D30 receiver-view probes: nickname title/HTML injection, entities, RTL/zero-width, long/emoji nick, forged/huge/duplicate `?i=`, hash mixed in, no `?`, `+`/`%20`, past/future/impossible dates, bad `today`, hostile navigator, `makeYourOwnUrl` with `javascript:`/CRLF/non-string, `shareText` | `node docs/redteam_probe.mjs` re-run by hand: same output |
| brief 1 | 1d94911 | RED_TEAM.md Round 4 table (input, expected, actual, blocked) + gaps + GO, plus my "Conductor's check" with 4 corrections (D13, D12, D17, D21) | checked each by hand with node |
| brief 2 | (evidence) | Permission limits held this time too: shell heredoc / `node -e` refused, extra file refused, `engine/recv_probe.txt` refused | `git status` after the run: only the two red-team files |
| brief 3 | e274082 | spec-trace-check and contrast-on-style-save **seen firing** in `kiro-cli --v3` (log `16:45:17 ... rc=0`); hooks README updated | temp wrapper + probe lines restored, `git status` clean |
| brief 4 | ef89120 | selftest +7 cases: PostFileSave matchers against absolute paths (match / no match) | 30/30 |

## 2. Not done, and why

- Gaps are not fixed (engine is not mine this round). The app's DOM sinks were classified by red-team from code reading, not run in a browser.
- The firing proof needed a temporary logging wrapper around the two hook commands, because PostFileSave command stdout is not given to the agent. The real matcher, trigger and script were used; the wrapper was removed.
- Legacy `.kiro.hook` (IDE) pair not exercised: no IDE session.
- The contrast hook's exit code comes from `| tail -30`; I did not change it (PostFileSave cannot block anyway). Fix is `set -o pipefail` or dropping the pipe if wanted.

## 3. Requests for the conductor

1. **app-fix (engine/recv.js)**, reproduce with `node docs/redteam_probe.mjs`:
   - D-G1 `makeYourOwnUrl("javascript:alert(1)", "/app/index.html")` → `"javascript:alert(1)/app/index.html"`. Proposed test `test_make_your_own_url_rejects_javascript_scheme` (accept only `http:`/`https:` origins, else `"./"`).
   - D-G4 `makeYourOwnUrl("https://evil.com\r\nX-Injected: yes", "/app/")` keeps the CRLF. Proposed test `test_make_your_own_url_strips_crlf`.
   - D-G3 `canNativeShare({ get share(){ throw new Error() } })` throws. Proposed test `test_can_native_share_hostile_getter_does_not_throw`.
   All three are unreachable from the app today (real `location.origin`, real `navigator`); low priority.
2. **kiro-docs**: merge EVIDENCE_redteam2 into KIRO_EVIDENCE. Wording: "PostFileSave command hooks run under `kiro-cli --v3`; their output is not shown to the agent, the agent-type reminder is."
3. **red-team probe tidy (optional, red-team or agents-hooks)**: D13 should return `corrupt`; D17's name should say "today 9999-01-01" instead of "year 1".
