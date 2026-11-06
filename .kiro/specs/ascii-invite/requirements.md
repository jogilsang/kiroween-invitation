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

## Customization depth (added 2026-11-05 after market research)

> Changelog: market research (Canva, Evite, Paperless Post) showed our options
> were too thin and that an invitation without date/time/place is incomplete.
> R22-R26 add a Halloween asset library, per-asset color, event details and
> Unicode names. Determinism, validation, share and safety rules still apply.

- **R22** THE SYSTEM SHALL offer these selectable assets, each drawn only when selected: hat, horns, moon, bats, cobweb, crow, cat, tombstone, skull, candle, pumpkins. Unselected assets SHALL NOT appear in the SVG. — `test_every_asset_is_drawn`, `test_no_assets_by_default`
- **R23** WHEN a swatch (orange, purple, green, bone, blood, ice) is chosen for an asset, THE SYSTEM SHALL draw that asset in that color. IF the swatch or asset key is unknown, THE SYSTEM SHALL drop it. A tint for an unselected asset SHALL NOT change the output. — `test_tint_changes_asset`, `test_unknown_tint_dropped`, `test_tint_of_unselected_asset_is_inert`
- **R24** THE SYSTEM SHALL accept event details (date, time, place; max 16/12/32 characters), sanitize them, and print them on the invitation; WHEN all are empty, no details line SHALL be printed. Each field SHALL be scanned for PII/script content before share or export. — `test_event_details_rendered`, `test_event_details_sanitized`, `test_event_scan_blocks_pii`
- **R25** THE SYSTEM SHALL accept letters, numbers and combining marks from any script in the nickname and event text (so Korean and Japanese names work), SHALL still strip markup, symbols and emoji, SHALL normalize to NFC, and SHALL truncate by code point so no lone surrogate is ever produced. — `test_unicode_nick_allowed`, `test_truncation_never_splits_surrogate`
- **R26** WHEN an asset or tint is toggled, THE SYSTEM SHALL NOT change the ghost body shape or the fog (independent seeded streams). — `test_toggle_does_not_change_ghost_body`, `crew_parts_do_not_reshuffle_fog`

## Remix (added 2026-11-05)

> Changelog: Canva, Evite and Paperless Post are template pickers. A Remix button
> that invents a new look from a seed, and whose result is reproduced exactly by
> the share link, is our differentiator. The engine stays pure: it takes a seed
> as an input; only the app chooses a random seed.

- **R27** WHEN given a config and an integer seed, THE SYSTEM SHALL return a new valid config whose look (mood, palette, glow, assets, asset colors) is determined solely by the seed, SHALL keep the user's own content (purpose, year, nickname, event details) unchanged, and SHALL return the identical result for the same inputs. — `test_remix_deterministic`, `test_remix_keeps_user_content`
- **R28** THE SYSTEM SHALL ensure a remixed config is always valid (enums in range, hat and horns never both selected) and renders a well-formed SVG, for ANY integer seed including negative, huge or non-integer values (which fall back to a safe seed). — `test_remix_always_valid`, `pbt: remix`
- **R29** DIFFERENT seeds SHALL produce visibly different looks: across 60 seeds at least 40 distinct SVGs. — `test_remix_variety`
