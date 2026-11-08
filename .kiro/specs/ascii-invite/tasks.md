# Tasks — Kiroween Invitation

One task at a time. Write the failing test first, make it pass, then stop.
Each task names how it's verified. `[ ]` todo, `[x]` done.

## ASCII build (done, then superseded by the SVG pivot)

- [x] T1 Scaffold (git, MIT LICENSE, README, .gitignore, package.json).
- [x] T2 Steering docs.
- [x] T3 Spec (requirements/design/tasks).
- [x] T4 engine/invite.js (validation + templates).
- [x] T5 engine/compose.js (layer order + mutual exclusion).
- [x] T6 assets grids (ASCII) — removed in pivot.
- [x] T7 engine/ascii.js — removed in pivot.
- [x] T8 engine/share.js + scan.js.
- [x] T9 app (ASCII) — replaced in pivot.
- [x] T10 save + PNG export (ASCII) — replaced in pivot.
- [x] T11 PBT (ASCII) — replaced in pivot.
- [x] T12 hooks (test-on-save, secret scan, spec-change).
- [x] T13 red team (ASCII) — re-run for SVG in P8.
- [x] T14 deploy pipeline (S3 + CloudFront OAC) — re-run in P9.

## SVG pivot (2026-11-05)

- [x] P1 Spec rewritten for SVG (this file + requirements + design, changelog). — docs present.
- [x] P2 steering/tech.md → deterministic SVG, no ASCII. — doc updated.
- [x] P3 engine/invite.js + compose.js extended: InviteConfig gains mood/palette/glow; validation + fallbacks (R5/R6/R7); escapeXml added. — tests: `test_reject_invalid_year`, `test_sanitize_nick`, `test_unknown_key_falls_back`, `test_escape_xml`.
- [x] P4 engine/svg.js new (ascii.js removed): `renderSvg`, `deriveSeed` (R1/R2/R10/R11/R12). — tests: `test_deterministic_bytes`, `test_same_config_same_output`, `test_mood_variants_differ`, `test_palette_variants_differ`, `test_svg_wellformed`, `test_dark_background_contract`, `test_svg_has_title`, `test_svg_escapes_nick`.
- [x] P5 engine/share.js + scan.js reused; tests adjusted to SVG. — `test_share_link_roundtrip`, `test_open_shared_link_restores`, `test_corrupt_share_param_safe`, `test_share_content_scan`, `test_config_roundtrip`.
- [x] P6 PBT rewritten: determinism, junk-safe, encode→decode identity, SVG well-formed for any config. — `tests/pbt.test.js`.
- [x] P7 agents re-defined: svg-engine (was ascii-engine), art-tuner → SVG parts.
- [x] P8 app rewritten to render SVG + PNG export + live combos; noscript/aria. Red team re-run on SVG path (nick escaping). — browser-verified + `docs/RED_TEAM.md`.
- [x] P9 redeploy to captain; verify live render (headless capture).
- [x] P10 KIRO_EVIDENCE / README / PRE_SUBMIT / video script / Kiro write-up updated for the pivot.
- [x] P11 Independent review by Kiro Crew (docs/CREW_RESEARCH_BRIEF.md -> docs/CREW_FINDINGS.md). Findings closed in P12-P15.
- [x] P12 hat/horns are really drawn; fog seed no longer depends on decoration parts. — `crew_hat_is_drawn`, `crew_horns_is_drawn`, `crew_hat_horns_exclusive_in_svg`, `crew_parts_do_not_reshuffle_fog`.
- [x] P13 nick input maxlength matches NICK_MAX (24) with a visible note. — `crew_nick_maxlength_matches_engine`.
- [x] P14 purpose radiogroup keyboard navigation (roving tabindex + arrows). — `crew_purpose_keyboard_nav` + headless-Chrome keyboard check.
- [x] P15 tasks.md checkboxes reconciled with reality (Crew finding).
- [ ] P16 (open, from Crew) cross-browser check (Safari/Firefox/mobile) of SVG filters and PNG export; WCAG contrast measurement; non-Latin nicknames (G1).

## Customization depth (2026-11-05, 1-hour block)

- [x] Q1 Tests first: `tests/assets.test.js` (R22-R26). Expect red.
- [x] Q2 invite.js: asset allow-list (11), swatches, tints, event fields, Unicode sanitize (R23-R25).
- [x] Q3 svg.js: 7 new assets + tint on all, event line, independent seed streams (R22, R26).
- [x] Q4 share.js / scan.js: carry tints + event; scan each event field (R24).
- [x] Q5 app: asset list with per-asset swatch select, event inputs.
- [x] Q6 Visual check (all assets, default and tinted), xmllint well-formedness, full suite, audit, redeploy. Also found and fixed a real bug: the ghost hem ran off to the right (`test_ghost_hem_stays_under_body`).
- [ ] Q7 (WBS, later) slots/placement, Remix button, background scenes, export sizes, .ics, costume assets (Dracula, mummy), presets.

## WBS P1 (done 2026-11-05)
- [x] W1.1 Costumes (R30, R32, R33): dracula, mummy, pirate, skeleton, clipped to the ghost body; 14 tests; rendered and checked by eye (found and fixed a dracula collar covering the mouth).
- [x] W1.2 Scenes (R31, R33): graveyard, haunted house, forest, behind the fog.
- [x] W1.4 Remix covers costume and scene.
- [x] W2.1 Export sizes (R34, R35): square, story 9:16, wide 16:9; artwork never cropped; edge feathered into the backdrop. Found by a real XML parser (not by the regex tests): `data-artwork` had no value, which would have broken PNG export; now guarded by `test_formats_are_valid_xml`.
- [x] W2.2 Calendar file (R36-R38): `engine/ics.js`, reads only unambiguous dates (never guesses), RFC 5545 output with CRLF, octet folding and escaping, injection-proof. Mutation-tested: disabling the injection defense, the date validation and the folding each make a test fail. A first version of the folding test passed even with folding off (inputs never got long enough), so folding is now tested directly.

## WBS block E (done 2026-11-05)
- [x] W3.1 Contrast (R39): measured first. Texts already passed; two button gradients failed (white on #b14bff 3.95, dark on #c2410c 3.74). Failing tests written, then gradients changed to #9a35e8 and #e0590e (5.19, 5.16 at the lighter stop).
- [x] W3.2 Presets (R40-R42): `engine/presets.js`, six looks, gallery with live thumbnails in the app; checked by eye in headless Chrome.
