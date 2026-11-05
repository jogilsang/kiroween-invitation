# Design — ASCII Invite

## Data model (single source of truth)

```
InviteConfig {
  purpose: "join" | "notice" | "recruit"   // R3; unknown -> "join" (R7)
  year:    integer 2000..2100              // R4 / R5
  nick:    string, sanitized, 0..24        // R6
  ghost:   { face: "mischief"|"spooky"|"cute",
             parts: string[],              // from a fixed allow-list
             theme: "dark" }               // R7 / R8 / R9
  density: "low" | "mid" | "high"          // R10
}
```

- Save (R13) and share (R15/R16) both serialize this object. There is no other state.
- `deriveSeed(config)` produces a stable integer from the config for any ordering
  decision, so output stays deterministic (R2) without `Math.random`.

## Engine modules (pure)

- `invite.js`
  - `normalizeConfig(raw) -> { ok, value, reasons[] }` — clamps/validates/sanitizes; unknown keys fall back (R5/R6/R7).
  - `buildInviteText(config) -> { title, lines[], meta }` — purpose templates, year text (R3/R4).
- `ascii.js`
  - `renderAscii(config, grids) -> string` — samples part grids into a monospace
    field, maps brightness → ramp glyph, inverts for dark theme, enforces equal
    row length (R10/R11/R12/R1/R2). `grids` are precomputed JSON from assets so
    the engine does no image decoding at runtime (keeps it pure & fast).
- `compose.js`
  - `resolveParts(config) -> { parts[], decisions[] }` — fixed layer order, mutual
    exclusion (R8/R9).
  - `compositeLayers(layers[]) -> grid` — overlays part grids; transparent cells
    keep the lower layer.
- `share.js`
  - `encodeConfig(config) -> string` (base64url of compact JSON).
  - `decodeConfig(param) -> { ok, value, reason }` — schema-validate before use;
    corrupt/forged input returns a safe default (R15/R16/R17).
- `scan.js`
  - `scanText(s) -> { ok, hits[] }` — banned phrases, `<script`/`javascript:`/tag
    patterns, email/phone-like PII (R18).

## ASCII quality approach

1. Hand-draw clean silhouette SVGs for parts (ghost body, 3 faces, pumpkin,
   frame/lettering). Crisp outlines matter most for readability.
2. A build-time helper samples each SVG to a fixed grayscale grid and writes
   `assets/grids.json`. The runtime engine only reads these grids (stays pure).
3. Brightness → glyph via a ramp (`" .:-=+*#%@"` for low density; a longer ramp
   for high). Dark theme inverts brightness so bright glyphs sit on a dark field.
4. Correct for monospace cell aspect (~0.5 wide:1 tall) so shapes aren't squashed.
5. Composite layers in fixed order; overlay a hand-made frame + `KIROWEEN <year>`
   lettering (fixed asset) around the generated art.

Determinism: no `Math.random`, no `Date.now` in the render path. Any tie is
broken by `deriveSeed(config)`.

## App (calls engine only)

- Left: controls (purpose segmented control, year, nickname, face, density, parts).
- Right: live preview (debounced).
- Bottom: Save as image (canvas → PNG), Copy share link, Save config (localStorage).
- Dark neon theme fixed. Mobile width handled. `<noscript>` fallback (R20).
  ASCII container has an `aria-label` text alternative (R21).
- On load: if the URL has a share param, decode it (R16); else restore localStorage (R13); else defaults.

## Error handling

- Expected bad input → result objects with reasons; the app shows them, state unchanged.
- Corrupt share param → safe default invitation, no throw (R17).
