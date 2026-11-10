# Tasks — Kiroween Invitation

Status 2026-11-08: everything below is done except P16 (cross-browser). Phase 1 was the ASCII renderer (superseded on 2026-11-05 by SVG; its tasks are kept as history of the pivot). Later phases follow the work order: SVG pivot, customization, costumes/scenes/sizes/calendar, presets and contrast, red team and Crew review fixes, link preview, custom domain.

One task at a time. Write the failing test first, make it pass, then stop.
Each task names how it's verified. `[ ]` todo, `[x]` done.

## Phase 1: ASCII build (history, folded 2026-11-09)

T1-T14 built the first version with an ASCII renderer: scaffold, steering, spec, validation and composition modules, share and scan, the app, save and PNG export, property tests, hooks, red team and the S3 + CloudFront deploy. On 2026-11-05 the renderer was replaced by SVG (see the next block). Kept from Phase 1 and still in use: `invite.js`, `compose.js`, `share.js`, `scan.js`, the hooks and the deploy pipeline. Removed: the ASCII renderer (`ascii.js`), its glyph grids and the old ASCII tests (T6, T7, T9-T11 were replaced in the pivot).

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
- [ ] P16 (open, from Crew) cross-browser check (Safari/Firefox/mobile) of SVG filters and PNG export. Done since: WCAG contrast is tested (R39), non-Latin nicknames work (R25). Still unverified: Safari, Firefox, mobile, PNG save on Safari, calendar import into real calendar apps.

## Customization depth (2026-11-05, 1-hour block)

- [x] Q1 Tests first: `tests/assets.test.js` (R22-R26). Expect red.
- [x] Q2 invite.js: asset allow-list (11), swatches, tints, event fields, Unicode sanitize (R23-R25).
- [x] Q3 svg.js: 7 new assets + tint on all, event line, independent seed streams (R22, R26).
- [x] Q4 share.js / scan.js: carry tints + event; scan each event field (R24).
- [x] Q5 app: asset list with per-asset swatch select, event inputs.
- [x] Q6 Visual check (all assets, default and tinted), xmllint well-formedness, full suite, audit, redeploy. Also found and fixed a real bug: the ghost hem ran off to the right (`test_ghost_hem_stays_under_body`).
- [x] Q7 Remix, background scenes, export sizes, .ics, costumes and presets were done in the WBS blocks below. Free placement of assets (drag) was deliberately not built.

## WBS P1 (done 2026-11-05)
- [x] W1.1 Costumes (R30, R32, R33): dracula, mummy, pirate, skeleton, clipped to the ghost body; 14 tests; rendered and checked by eye (found and fixed a dracula collar covering the mouth).
- [x] W1.2 Scenes (R31, R33): graveyard, haunted house, forest, behind the fog.
- [x] W1.4 Remix covers costume and scene.
- [x] W2.1 Export sizes (R34, R35): square, story 9:16, wide 16:9; artwork never cropped; edge feathered into the backdrop. Found by a real XML parser (not by the regex tests): `data-artwork` had no value, which would have broken PNG export; now guarded by `test_formats_are_valid_xml`.
- [x] W2.2 Calendar file (R36-R38): `engine/ics.js`, reads only unambiguous dates (never guesses), RFC 5545 output with CRLF, octet folding and escaping, injection-proof. Mutation-tested: disabling the injection defense, the date validation and the folding each make a test fail. A first version of the folding test passed even with folding off (inputs never got long enough), so folding is now tested directly.

## WBS block E (done 2026-11-05)
- [x] W3.1 Contrast (R39): measured first. Texts already passed; two button gradients failed (white on #b14bff 3.95, dark on #c2410c 3.74). Failing tests written, then gradients changed to #9a35e8 and #e0590e (5.19, 5.16 at the lighter stop).
- [x] W3.2 Presets (R40-R42): `engine/presets.js`, six looks, gallery with live thumbnails in the app; checked by eye in headless Chrome.

## WBS block F (done 2026-11-05)
- [x] W4.1 Red team round 2 (B1-B20, `docs/redteam_probe.mjs`): two real bugs fixed test-first (R43 prototype format key, R44 non-text values). — `tests/redteam_round2.test.js`
- [x] W4.2 Kiro Crew review round 2 (`docs/CREW_RESEARCH_BRIEF_R2.md` -> `docs/CREW_FINDINGS_R2.md`), verdict GO with fixes. Fixed test-first: R45 `Buffer` in the browser, R46 duplicate SVG ids, R47 scan gaps, R48 Korean dates and UTC stamp, R49 text fit, R50 first-screen layout. — `tests/crew_r2.test.js`

## Static checks and R52/R53 (2026-11-09)
- [x] W6.1 Static checks for R20, R46, R50 and the load order R53, plus the deploy template check R52. — `tests/static_checks.test.js`
- [ ] P16 stays open (see above). Not verified: Safari, Firefox, mobile.

## Link preview and domain (2026-11-08)
- [x] W5.1 `og:image` as a 1200x630 PNG (R51), built by `deploy/make_og.mjs`. — `tests/og.test.js`
- [x] W5.2 Custom domain through the same template (ACM certificate, CloudFront alias, Route 53 records), deployed from `deploy/deploy.sh` with `DOMAIN` and `ZONE_NAME`.
- [x] W5.3 Product renamed from ASCII Invite to Kiroween Invitation; agents `svg-engine`, `art-tuner`, `invite-logic` rewritten to match the code; spec folder renamed.

## Receiver experience (R60-R69)
Status 2026-11-09. Test first, then code. Verified by `tests/recv_view.test.js` and `tests/recv_static.test.js`.
- [x] RC1 Pure helpers in `engine/recv.js` (view decision, title, countdown, make-your-own URL, share support). (R60-R65, R69)
- [x] RC2 Receiver view in the app (card, calendar, share/copy, make your own, edit, title). (R60-R63, R65)
- [x] RC3 Countdown line and entrance animation, reduced-motion safe. (R64, R66)
- [x] RC4 Mobile order and "Save config" label. (R67, R68)

## Production week (2026-11-10 to 11-16), plan in `PLAN_PRODUCTION_WEEK.md`
Status 2026-11-10. Test first, then code.
- [x] PW1 Steering: `motion.md`, `audio-license.md`, `media-pipeline.md`; agent `media-lab`; hook `audio-license-guard`. (R82)
- [x] PW2 Audio assets: three CC0 tracks, normalized, listed in `assets/audio/LICENSES.md`. (R82)
- [x] PW3 `engine/pose.js` and renderer hook-up, ghost redraw. (R70-R72)
- [ ] PW4 App animation loop, reduced motion, spring on press. (R73, R74)
- [~] PW5 `engine/gif.js` and worker merged (R77-R79, tests green, Pillow decode checked); export button and size retry still open. (R80)
- [~] PW6 `app/audio.js` and `engine/sfx.js` merged with fakes; mute control, wiring and opening reveal still open. (R81-R84)
- [ ] PW7 Touch styling and expressions. (R75, R76)
- [ ] PW8 Share link v2. (R85)
