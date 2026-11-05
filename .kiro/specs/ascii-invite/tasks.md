# Tasks — ASCII Invite

One task at a time. Write the failing test first, make it pass, then stop.
Each task names how it's verified. `[ ]` todo, `[x]` done.

- [x] **T1** Scaffold: folders, git, MIT LICENSE, README, `.gitignore` (.omc excluded, .kiro kept), package.json. — repo builds, `node --test` runs (no tests yet).
- [x] **T2** Steering docs (product, tech, principles). — present in `.kiro/steering/`.
- [x] **T3** Spec (requirements, design, tasks). — present in `.kiro/specs/ascii-invite/`.
- [x] **T4** `engine/invite.js`: `normalizeConfig` + `buildInviteText` (R3–R7). — tests: `test_purpose_templates`, `test_year_is_variable`, `test_reject_invalid_year`, `test_sanitize_nick`, `test_unknown_key_falls_back`.
- [x] **T5** `engine/compose.js`: `resolveParts` + `compositeLayers` (R8/R9). — tests: `test_layer_order_fixed`, `test_mutually_exclusive_parts`.
- [x] **T6** `assets/`: build-time SVG→grid sampler, write `assets/grids.json`; placeholder grids so engine tests run without a browser.
- [x] **T7** `engine/ascii.js`: `renderAscii` + `deriveSeed` (R1/R2/R10/R11/R12). — tests: `test_deterministic_bytes`, `test_same_config_same_output`, `test_density_levels`, `test_dark_theme_contrast`, `test_monospace_grid_consistent`.
- [x] **T8** `engine/share.js` + `engine/scan.js` (R15–R18). — tests: `test_share_link_roundtrip`, `test_open_shared_link_restores`, `test_corrupt_share_param_safe`, `test_share_content_scan`, `test_config_roundtrip`.
- [x] **T9** `app/`: index.html + main.js + style.css. Controls, live preview, dark theme, noscript, aria. Calls engine only (R20/R21).
- [x] **T10** Save + PNG export (R13/R14) in app; engine `serializeConfig`/`deserializeConfig` tested by `test_config_roundtrip`.
- [x] **T11** PBT (`tests/pbt.test.js`): ≥3 properties — (1) same config = same ASCII, (2) unknown/corrupt input never throws & state-safe, (3) encode→decode is identity for valid configs.
- [x] **T12** Hooks (`.kiro/hooks/`): test-on-save, pre-commit secret/.omc scan, spec-change reminder.
- [x] **T13** Red team (`docs/RED_TEAM.md`): 20 deceptive inputs, expected vs actual, honest gaps.
- [x] **T14** Deploy (captain / us-east-1, S3 + CloudFront OAC), tags, cost note. Prepared as IaC + script; actual deploy gated on CEO go.
- [x] **T15** Submission kit: video script (step 10), Kiro write-up (step 11), pre-submit audit (step 12).
