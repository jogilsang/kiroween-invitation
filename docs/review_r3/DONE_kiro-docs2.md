# DONE: kiro-docs2 (2026-11-09, branch wt/kiro-docs2)

Checks at the end: `node --test` 158 tests, 158 pass, 0 fail; `bash docs/audit_submission.sh` 17 passed, 0 failed; `spec_trace_check.sh` clean (63 requirements, 104 named tests); `secret_scan.sh` clean. Nothing pushed or deployed. Only docs, README and KIRO_EVIDENCE were edited.

## 1. Done
| Item | Commit | What | Verification |
|---|---|---|---|
| 1 evidence merge | 2f2ff4e | agents-hooks and app-recv evidence merged into KIRO_EVIDENCE (agents section with the `scope` correction, hooks section, receiver section), placeholder removed; originals kept | text copied from the two EVIDENCE files, "not observed" lines kept |
| 4 steering recheck | 2f2ff4e | the official page IS readable as https://kiro.dev/docs/steering.md; front matter format confirmed; the secondary claim "CLI has no inclusion modes" corrected (V3 supports all four, V1/V2 exclude fileMatch/manual) | fetched 2026-11-09 |
| 2 hook/agent wording | (docs commit 1) | WRITEUP, STORY, BLOG, DEVPOST, README: hooks fire under `kiro-cli --v3`, not the default 2.x engine; observed PreToolUse/PostFileSave/Stop, push guard hold, commit refusal (attribution likely); spec-trace-check and contrast hooks NOT seen firing; agent permissions enforced at the tool (temp agent refusal, red-team 3/3 refused); `scope` removed everywhere; secret-scan "three files skipped" replaced by the removed-excludes fact | grep for `scope` shows no agent-field mention left |
| 3 new features | (docs commit 2) | README feature list and try steps, DEVPOST story/features/tour (receiver step), WRITEUP spec count 63, SHOTLIST receiver scene | counts from `requirements.md` (63 distinct R ids: R1-R53, R60-R69) |
| 5 PRE_SUBMIT | (docs commit 3) | new "Changing things after submitting" section (confirmed vs not confirmed vs suggested) | text only |

## 2. Not done, and why
- The Rules text on editing a live app during judging was not looked up; the new section says "not confirmed".
- No screenshot of the receiver view is stored (app-recv could not write one).
- Steering loading in a Kiro session is still not observed.
- Counts are for this worktree before the app-fix and redteam2 tabs merge.

## 3. Requests for the conductor
1. After the final merge run `node --test` and replace 158 where it is written:
   - `docs/DEVPOST_SUBMISSION.md` line 5 (history sentence), "Accomplishments" bullet, image list item 6
   - `docs/PRE_SUBMIT.md` (mechanical audit paragraph)
   - `docs/video/SHOTLIST.md` (1:55 row)
   - `docs/video/YT_DESCRIPTION_NOTE.md` (line 3 note and line 5 text)
   - `docs/KIRO_EVIDENCE.md` last section "Test count"
   The "117 tests" (Crew era) stays.
2. The red-team doc/probe changes by redteam2: if the "42 deceptive inputs / two rounds" figure changes, update `DEVPOST_SUBMISSION.md`, `KIRO_WRITEUP.md`, `SHOTLIST.md`.
3. Add the 2026-11-09 hook facts if redteam2 observes hooks firing in a session (e.g. spec-trace-check).
