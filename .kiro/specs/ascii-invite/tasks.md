# Tasks — ASCII Invite

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

- [ ] P1 Spec rewritten for SVG (this file + requirements + design, changelog). — docs present.
- [ ] P2 steering/tech.md → deterministic SVG, no ASCII. — doc updated.
- [ ] P3 engine/invite.js + compose.js extended: InviteConfig gains mood/palette/glow; validation + fallbacks (R5/R6/R7); escapeXml added. — tests: `test_reject_invalid_year`, `test_sanitize_nick`, `test_unknown_key_falls_back`, `test_escape_xml`.
- [ ] P4 engine/svg.js new (ascii.js removed): `renderSvg`, `deriveSeed` (R1/R2/R10/R11/R12). — tests: `test_deterministic_bytes`, `test_same_config_same_output`, `test_mood_variants_differ`, `test_palette_variants_differ`, `test_svg_wellformed`, `test_dark_background_contract`, `test_svg_has_title`, `test_svg_escapes_nick`.
- [ ] P5 engine/share.js + scan.js reused; tests adjusted to SVG. — `test_share_link_roundtrip`, `test_open_shared_link_restores`, `test_corrupt_share_param_safe`, `test_share_content_scan`, `test_config_roundtrip`.
- [ ] P6 PBT rewritten: determinism, junk-safe, encode→decode identity, SVG well-formed for any config. — `tests/pbt.test.js`.
- [ ] P7 agents re-defined: svg-engine (was ascii-engine), art-tuner → SVG parts.
- [ ] P8 app rewritten to render SVG + PNG export + live combos; noscript/aria. Red team re-run on SVG path (nick escaping). — browser-verified + `docs/RED_TEAM.md`.
- [ ] P9 redeploy to captain; verify live render (headless capture).
- [ ] P10 KIRO_EVIDENCE / README / PRE_SUBMIT / video script / Kiro write-up updated for the pivot.
- [ ] P11 (follow-up) Kiro Crew re-implementation for a CLI-vs-Crew comparison writeup. Not a prize entry.
