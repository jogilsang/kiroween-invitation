# Design — ASCII Invite (SVG renderer)

> 2026-11-05: pivoted from ASCII glyph rendering to deterministic SVG. See
> requirements changelog. Engine/app split, determinism, and "model says, code
> decides" are unchanged.

## Data model (single source of truth)

```
InviteConfig {
  purpose: "join" | "notice" | "recruit"       // R3; unknown -> "join" (R7)
  year:    integer 2000..2100                   // R4 / R5
  nick:    string, sanitized, 0..24             // R6
  ghost:   { parts: string[] }                  // allow-listed decoration parts (R8/R9)
  mood:    "uneasy" | "screaming" | "hollow"    // R10 ghost face; default "screaming"
  palette: "deeppurple" | "magenta" | "indigo"  // R10 colors; default "magenta"
  glow:    "soft" | "strong"                    // R10 glow strength; default "strong"
}
```

- Save (R13) and share (R15/R16) serialize this object. No other state.
- `deriveSeed(config)` → stable integer (FNV-1a) used only for small deterministic
  layout jitter (fog, bat positions). Never `Math.random`, never the clock (R2).

## Engine modules (pure, no DOM/network)

- `invite.js`
  - `normalizeConfig(raw) -> { ok, value, reasons[] }` — clamp/validate/sanitize;
    unknown enum keys (purpose/mood/palette/glow/face) fall back (R5/R6/R7).
  - `buildInviteText(config) -> { title, lines[], meta }` — purpose templates,
    year banner (R3/R4).
  - `sanitizeNick`, `escapeXml` — nick is sanitized to an allow-list AND
    XML-escaped before entering SVG text (defense in depth for R6).
- `compose.js`
  - `resolveParts(config) -> { parts[], decisions[] }` — fixed order + mutual
    exclusion (R8/R9). Reused unchanged from the ASCII version.
  - `LAYER_ORDER` = background, fog, moon, bats, ghost, pumpkin, frame, text.
- `svg.js` (replaces ascii.js)
  - `renderSvg(config) -> string` — deterministic SVG document (R1/R2/R11/R12).
  - internal helpers: `ghost(mood)`, `pumpkin(palette)`, `moon()`, `bats(seed)`,
    `fog(seed, glow)`, `palettes`, `glyph defs` (gradients + glow filters).
  - A `<defs>` block holds radial gradients (bg, ghost, pumpkin, carve) and
    Gaussian-blur glow filters; parts reference them by id.
  - Every dynamic text value passes through `escapeXml`.
- `share.js` — `encodeConfig` / `decodeConfig` (base64url of compact JSON),
  schema-validated on decode; corrupt input → safe default (R15/R16/R17). Reused.
- `scan.js` — `scanText` / `scanConfig`: script-like, PII, banned phrases (R18).
  Reused; still runs on the RAW nick before sanitize so it detects intent.

## SVG render approach (how the grotesque A1 look is produced)

1. Dark radial background (palette-specific) + a `feTurbulence` fog band low in
   the frame; fog seed from `deriveSeed` so it is deterministic but varied.
2. White Kiro ghost: an elongated body path (tall head, gaunt pulled-in
   shoulders, a closed melting hem whose dips sum exactly to the body width so it
   never overflows), with a Gaussian-blur glow filter tinted to the palette glow.
   `mood` selects the face: gaunt angular eye voids always; the maw is a vertical
   scream (screaming), a small hollow (hollow), or an asymmetric grimace (uneasy).
3. Twisted jack-o'-pumpkin: asymmetric rotated lobes, jagged grin, inner
   `carveGlow` radial so it looks lit from within.
4. Optional parts: crescent `moon`, scattered `bats` (positions from seed).
5. Ornate frame + `KIROWEEN <year>` banner + purpose title/subtitle (escaped).
6. Vignette + faint grain on top for a printed-poster feel.

Determinism: no `Math.random`, no `Date.now`. Any jitter is seeded from config.
Canvas size fixed at 1080×1080 (square, SNS-friendly) via `viewBox` (R11).

## App (calls engine only)

- Controls: purpose segmented control, year, nickname, mood, palette, glow, parts.
- Preview: the SVG string injected into the DOM (as an inline `<svg>` container),
  updated live (debounced).
- Actions: Save as image (SVG → `Image` → canvas → PNG), Copy share link,
  Save config (localStorage).
- `<noscript>` fallback (R20). The preview container has `role="img"` +
  `aria-label` from `buildInviteText` meta; the SVG itself carries a `<title>` (R21).
- On load: URL `?i=` share param → decode (R16); else localStorage; else defaults.

## Error handling

- Expected bad input → result objects with reasons; app shows them, state unchanged.
- Corrupt share param → safe default invitation, no throw (R17).
- `renderSvg` never throws on a normalized config; normalization guarantees valid enums.
