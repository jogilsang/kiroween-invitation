# DONE: kiro-docs (worktree branch wt/kiro-docs), 2026-11-09

## 1. Done

| ID | Commit | Check |
|---|---|---|
| A-04, B-03 | fd79211 | EVIDENCE: 11-06 to 11-08 table filled from `git log` (12 rows); Custom agents section rewritten (single conductor session, 4 role lenses, only red-team has output); placeholder for agents-hooks evidence. |
| A-07 | 0ab0f4c, 6b041a9 | package.json name/description; lockfile name matched. |
| A-08 | 22ba386 | R7 (face removed), R8 (real render order), R11 (square), R31 + design + tech.md "3 drawn scenes + sky", tasks Phase 1 folded, changelog 2026-11-09. |
| A-10 | 268bd5d | design.md "Correctness properties" (10 rows, Validates R..); R comments above the 6 properties in `tests/pbt.test.js` (logic untouched). |
| A-05, A-06 | a2e3e3c, 99fdc3f | Steering: always = product, principles, tech; fileMatch = engine-purity, app-rules, testing, docs-honesty; manual = release-check. EVIDENCE entry with source URLs and limits. |
| A-09, A-11 | e125c79, 9ec8e8e | `tests/static_checks.test.js` (8 tests; mutation-checked: removing `<noscript>` fails 2, moving Save after a fieldset fails 1). R52, R53, P16 shown; design "test or browser check". |
| C2 | 58bbca2 | numRuns sum 3,050 (10 properties) in EVIDENCE; DEVPOST, SOCIAL, SHOTLIST, PRE_SUBMIT, WRITEUP aligned (WRITEUP/BLOG already had 3,050). |
| C4, C5, B-08 | 9ef90b5 | DEVPOST user-value sentence; BLOG "2-minute" to "under 3 minutes"; Crew scope line in WRITEUP and STORY; `docs/video/YT_DESCRIPTION_NOTE.md`. |

Final runs in this worktree: `node --test` 139 tests / 139 pass / 0 fail (131 before + 8 new); `bash docs/audit_submission.sh` 17 passed, 0 failed; every backtick test name in requirements.md exists in `tests/`.

## 2. Not done, and why

- Steering front matter was NOT confirmed on the official page: https://kiro.dev/docs/steering/ is JavaScript-rendered and returned no text. The format comes from two secondary write-ups (URLs in EVIDENCE). Re-check in a browser.
- Those write-ups say Kiro CLI does not support steering inclusion modes (everything loads) and that custom agents do not load steering without `resources`. Not verified by us. No claim in the repo says the new files were loaded by Kiro.
- Test-first order cannot be proven from history (spec, code and tests land in the same commits); EVIDENCE says so.
- Steps 1 and 2 share one commit (fd79211); the package rename was split in two commits.
- Task 3 asked to unify "3 backdrops vs 4"; `.kiro/agents/art-tuner.json` still says "4 backdrops" (not my file).
- The already-published Builder Center blog still shows "2-minute" if it was published before this fix; the draft file is corrected only.
- The R numbers R54-R59 were not needed.

## 3. Requests to the conductor

1. [agents-hooks] add `resources` such as `file://.kiro/steering/**/*.md` to every agent in `.kiro/agents/*.json`; without it, custom agents may not load steering. Change art-tuner's "4 backdrops" to "3 drawn scenes + sky". Write real invocation evidence to `docs/review_r3/EVIDENCE_agents-hooks.md`; merge it into the placeholder in KIRO_EVIDENCE "Custom agents".
2. [app-recv] `LAYER_ORDER` in `engine/compose.js` omits scene, costume and headwear (R8 now says so). Keep the ids `savePng`, `copyLink`, `saveIcs`, `icsNote`, `presets`, the `<noscript>` block, and the preset `<img>` creation in `main.js`, or update `tests/static_checks.test.js`.
3. After merging all branches: run `node --test`, then fix the test count in `docs/DEVPOST_SUBMISSION.md` (3 places), `docs/PRE_SUBMIT.md`, `docs/video/SHOTLIST.md`, `docs/video/YT_DESCRIPTION_NOTE.md` and EVIDENCE (currently 139).
4. Check the published blog for "2-minute" and whether the Devpost form uses the new first sentence.
