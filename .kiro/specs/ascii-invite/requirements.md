# Requirements — ASCII Invite

Format: EARS. Each requirement names the test that verifies it. Negative paths
are first-class. "THE SYSTEM" = the engine (pure code), unless it names the app.

## Generation

- **R1** WHEN a user supplies a config (purpose, year, nickname, ghost options, density), THE SYSTEM SHALL produce an ASCII invitation determined solely by that config. — `test_same_config_same_output`
- **R2** WHEN the same config is passed twice, THE SYSTEM SHALL return a byte-identical ASCII string (no randomness, no clock). — `test_deterministic_bytes`
- **R3** THE SYSTEM SHALL apply a distinct heading/body template for each purpose (join / notice / recruit). — `test_purpose_templates`
- **R4** WHEN the year changes, THE SYSTEM SHALL reflect it in the invitation's year text and meta (`KIROWEEN <year>`). — `test_year_is_variable`

## Input validation (negative paths)

- **R5** IF the year is not an integer in 2000..2100, THE SYSTEM SHALL reject generation with a reason and change no state. — `test_reject_invalid_year`
- **R6** IF the nickname exceeds length (24) or contains disallowed characters, THE SYSTEM SHALL sanitize it to a safe value and never place the raw input into the invitation or a share link. — `test_sanitize_nick`
- **R7** IF an unknown purpose / face / theme key is given, THE SYSTEM SHALL fall back to a safe default and SHALL NOT branch on the unknown key. — `test_unknown_key_falls_back`

## Composition rules (code decides)

- **R8** THE SYSTEM SHALL compose parts (background, pumpkin, ghost body, face, decoration) only in a fixed layer order. — `test_layer_order_fixed`
- **R9** IF mutually exclusive parts are selected (e.g. hat and horns), THE SYSTEM SHALL apply exactly one per the rule and record that decision in the result meta. — `test_mutually_exclusive_parts`

## ASCII render quality

- **R10** THE SYSTEM SHALL support selectable density levels (low / mid / high) that change grid resolution / ramp length. — `test_density_levels`
- **R11** WHILE the dark theme is active, THE SYSTEM SHALL render light glyphs on a dark field (brightness inverted) and keep contrast. — `test_dark_theme_contrast`
- **R12** THE SYSTEM SHALL output a monospace grid whose every row has identical length. — `test_monospace_grid_consistent`

## Save

- **R13** WHEN the user saves, THE APP SHALL persist the current config to localStorage and restore it after reload. — `test_save_restore_local` (app-level; engine provides serialize/deserialize tested by `test_config_roundtrip`)
- **R14** WHEN the user exports an image, THE APP SHALL render the invitation to a PNG via canvas. — verified in demo; engine provides the exact text + palette.

## Share (no backend)

- **R15** WHEN the user copies a share link, THE SYSTEM SHALL encode the config into a URL parameter (no server storage). — `test_share_link_roundtrip`
- **R16** WHEN a share link is opened, THE SYSTEM SHALL decode the config and reconstruct the identical invitation (with R2). — `test_open_shared_link_restores`
- **R17** IF a share parameter is corrupt or forged, THE SYSTEM SHALL fall back safely to a default invitation and SHALL NOT crash or execute arbitrary input. — `test_corrupt_share_param_safe`

## Safety

- **R18** BEFORE producing any share/export output, THE SYSTEM SHALL scan the nickname / free text for banned phrases, script-like content, and obvious PII patterns, and block output if found. — `test_share_content_scan`
- **R19** THE SYSTEM SHALL never include any secret, account id, key, or token in code, config, or output. — enforced by hook `pre-commit-secret-scan` (step 5).

## Accessibility / fallback

- **R20** IF JavaScript is disabled, THE APP SHALL show a `<noscript>` explanation and a static fallback (no blank page). — verified in demo.
- **R21** THE APP SHALL provide a text alternative (title / purpose / year) for the ASCII invitation so a screen reader can read it. — verified in demo.
