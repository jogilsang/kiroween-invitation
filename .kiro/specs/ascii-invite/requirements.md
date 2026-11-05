# Requirements — ASCII Invite (SVG renderer)

Format: EARS. Each requirement names the test that verifies it. Negative paths
are first-class. "THE SYSTEM" = the engine (pure code), unless it names the app.

> Changelog 2026-11-05 — PIVOT ASCII → SVG. ASCII glyph rendering could not
> express the grotesque, glowing purple look the project needs. The render
> target changed to deterministic SVG. R1-R9 and R13-R21 kept (wording: "ASCII
> invitation" → "SVG invitation"). The render-quality block R10-R12 (density /
> dark-invert / monospace) was replaced by SVG equivalents R10-R12 below. The
> combination-generator intent is unchanged and strengthened (mood/palette/glow
> are new combination axes). Determinism, validation, share and safety are
> unchanged. The project name/slug stays `ascii-invite` for continuity.

## Generation

- **R1** WHEN a user supplies a config (purpose, year, nickname, ghost options, mood, palette, glow), THE SYSTEM SHALL produce an SVG invitation determined solely by that config. — `test_same_config_same_output`
- **R2** WHEN the same config is passed twice, THE SYSTEM SHALL return a byte-identical SVG string (no randomness beyond a config-derived seed, no clock). — `test_deterministic_bytes`
- **R3** THE SYSTEM SHALL apply a distinct heading/body template for each purpose (join / notice / recruit). — `test_purpose_templates`
- **R4** WHEN the year changes, THE SYSTEM SHALL reflect it in the invitation's year text and meta banner (`KIROWEEN <year>`). — `test_year_is_variable`

## Input validation (negative paths)

- **R5** IF the year is not an integer in 2000..2100, THE SYSTEM SHALL reject it to a safe default with a reason and change no state. — `test_reject_invalid_year`
- **R6** IF the nickname exceeds length (24) or contains disallowed characters, THE SYSTEM SHALL sanitize it, and SHALL NOT place raw input into the SVG or a share link (no markup injection). — `test_sanitize_nick`, `test_svg_escapes_nick`
- **R7** IF an unknown purpose / face / mood / palette / glow key is given, THE SYSTEM SHALL fall back to a safe default and SHALL NOT branch on the unknown key. — `test_unknown_key_falls_back`

## Composition rules (code decides)

- **R8** THE SYSTEM SHALL compose layers (background, fog, moon, bats, ghost, pumpkin, frame, text) only in a fixed order. — `test_layer_order_fixed`
- **R9** IF mutually exclusive parts are selected (e.g. hat and horns), THE SYSTEM SHALL apply exactly one per the rule and record that decision in the result meta. — `test_mutually_exclusive_parts`

## SVG render (replaces ASCII density/invert/monospace)

- **R10** THE SYSTEM SHALL support a selectable `mood` (uneasy / screaming / hollow) that changes the ghost face, and `palette` (deeppurple / magenta / indigo) and `glow` (soft / strong) that change color and glow strength — each producing a visibly different invitation. — `test_mood_variants_differ`, `test_palette_variants_differ`
- **R11** THE SYSTEM SHALL output a well-formed SVG document: a single root `<svg>` with a fixed `viewBox` of `0 0 1080 1080`, balanced tags, and no unresolved template placeholders. — `test_svg_wellformed`
- **R12** THE SYSTEM SHALL keep the dark-fantasy contract: a dark radial background with lighter foreground subjects (white ghost, glowing pumpkin), so the subject always reads against the field. — `test_dark_background_contract`

## Save

- **R13** WHEN the user saves, THE APP SHALL persist the current config to localStorage and restore it after reload. — `test_config_roundtrip` (engine serialize/deserialize); app-level restore verified in demo.
- **R14** WHEN the user exports an image, THE APP SHALL rasterize the SVG to a PNG via canvas. — verified in demo; engine provides the exact SVG.

## Share (no backend)

- **R15** WHEN the user copies a share link, THE SYSTEM SHALL encode the config into a URL parameter (no server storage). — `test_share_link_roundtrip`
- **R16** WHEN a share link is opened, THE SYSTEM SHALL decode the config and reconstruct the identical invitation (with R2). — `test_open_shared_link_restores`
- **R17** IF a share parameter is corrupt or forged, THE SYSTEM SHALL fall back safely to a default invitation and SHALL NOT crash or execute arbitrary input. — `test_corrupt_share_param_safe`

## Safety

- **R18** BEFORE producing any share/export output, THE SYSTEM SHALL scan the nickname / free text for banned phrases, script-like content, and obvious PII patterns, and block output if found. — `test_share_content_scan`
- **R19** THE SYSTEM SHALL never include any secret, account id, key, or token in code, config, or output. — enforced by hook `pre-commit-secret-scan`.

## Accessibility / fallback

- **R20** IF JavaScript is disabled, THE APP SHALL show a `<noscript>` explanation and a static fallback (no blank page). — verified in demo.
- **R21** THE APP SHALL provide a text alternative (title / purpose / year) for the SVG invitation so a screen reader can read it (SVG `<title>` / `aria-label`). — `test_svg_has_title`, app verified in demo.
