# Design — Kiroween Invitation

> Status 2026-11-08: describes the product as built. History: the first version
> rendered ASCII glyphs; on 2026-11-05 the renderer was replaced by deterministic
> SVG (see the requirements changelog). Engine/app split, determinism and
> "model says, code decides" never changed. The project was renamed from
> "ASCII Invite" on 2026-11-08 because the art is vector, not glyphs.

## Data model (single source of truth)

```
InviteConfig {
  purpose: "join" | "notice" | "recruit"        // R3; unknown -> "join" (R7)
  year:    integer 2000..2100                    // R4 / R5
  nick:    string, sanitized, 0..24, any script  // R6, R25
  event:   { date, time, place }                 // optional free text, each sanitized (R24)
  ghost:   { parts: string[] }                   // allow-listed props, hat/horns exclusive (R8/R9, R22)
  tints:   { <asset|costume>: swatch }           // six fixed swatches only (R23)
  costume: "none" | dracula | mummy | pirate | skeleton   // R30
  scene:   "sky" | graveyard | house | forest              // R31
  mood:    "uneasy" | "screaming" | "hollow"     // R10
  palette: "deeppurple" | "magenta" | "indigo"   // R10
  glow:    "soft" | "strong"                     // R10
}
```

- Save (R13) and share (R15/R16) serialize this object, nothing else. Every field
  is validated or defaulted by `normalizeConfig`, so every later stage can trust it.
- Export size is NOT part of the config: it is an option of `renderSvg` (R34).

## Engine modules (pure, no DOM, no network, no Node-only globals: R45)

| Module | Job |
|---|---|
| `invite.js` | `normalizeConfig`, `buildInviteText`, `sanitizeNick`, `sanitizeEventText`, `escapeXml`, enum and limit constants |
| `compose.js` | `resolveParts`: fixed layer order and mutual exclusion (R8/R9) |
| `svg.js` | `renderSvg(cfg, {format})`, `deriveSeed`, `PALETTE_COLORS`, `formatSize`, `FORMATS` |
| `fit.js` | `fitLength` / `fitAttrs`: squeeze a line that is estimated wider than 940 px (R49) |
| `assets.js` | 11 drawn props (moon, bats, cobweb, crow, cat, tombstone, skull, candle, pumpkins, hat, horns) |
| `costumes.js` | 4 costumes, clipped to the ghost body (R30, R32) |
| `scenes.js` | 3 backdrops behind the fog (R31) |
| `share.js` | `encodeConfig` / `decodeConfig`: base64url of compact JSON, schema-validated (R15-R17) |
| `scan.js` | `scanText`, `scanConfig`, `scanRaw`: script-like content, PII of any script's digits, links, banned phrases (R18, R47) |
| `remix.js` | `remixConfig(cfg, seed)`: a new look from a seed; the caller supplies the seed (R27-R29) |
| `presets.js` | `PRESETS`, `applyPreset`: six named looks that never touch the user's text (R40-R42) |
| `ics.js` | `buildIcs`, `parseEventDate`: a calendar entry from an unambiguous date and time (R36-R38, R48) |

Rules that hold for all of them: no `Math.random`, no clock; unknown keys fall back
(including prototype keys such as `__proto__`: R43); a non-text value in a text
field counts as empty (R44).

## SVG render approach

1. Dark radial background (palette-specific), then the chosen scene, then a
   `feTurbulence` fog band whose seed comes from `deriveSeed` of the *look* fields
   only, so toggling an asset or a color never reshapes the ghost or the fog (R26).
2. White Kiro ghost: elongated body path with a closed melting hem and a glow
   filter tinted to the palette; `mood` picks the face.
3. Costume (clipped to the ghost body), then hat or horns.
4. Jack-o'-lantern lit from within; props in fixed slots that cannot overlap the
   ghost, the pumpkin or the text (R22).
5. Frame, `KIROWEEN <year>` banner, purpose title, subtitle, event line or style
   footer. Long lines get `textLength` (R49).
6. Vignette and grain for a printed-poster feel.

Export sizes (R34/R35): `square` is the 1080x1080 artwork. `story` (1080x1920) and
`wide` (1920x1080) nest that whole artwork, never cropped, in a palette-matched
backdrop with a feathered edge. The nested SVG keeps its own ids; the backdrop ids
use a `bk-` prefix so they never collide.

Determinism: any jitter is seeded from the config. Same config, same format: same
bytes (R1/R2).

## App (calls the engine only)

- Controls: look gallery (6 presets with live thumbnails as `<img>` so ids never
  collide: R46), purpose, year, nickname, mood, palette, glow, costume, scene,
  event date/time/place, per-asset checkbox and color, export size.
- Actions: Remix, Save as image (SVG to `Image` to canvas to PNG, in the chosen
  size), Copy share link, Add to calendar (.ics, enabled only when the date can be
  read, with the reason written on the page: R50), Save config (localStorage).
- The save and share buttons sit at the top with a one-line explanation (R50).
  `<noscript>` fallback (R20). `role="img"` plus `aria-label` on the preview and a
  `<title>` in the SVG (R21). `og:image` is a 1200x630 PNG built by `deploy/make_og.mjs` (R51).
- The app scans the RAW text before sanitizing (`scanRaw`) and blocks save, share
  and calendar output when it finds PII or markup (R18).
- On load: URL `?i=` share parameter, else localStorage, else defaults.

## Deployment

One CloudFormation template (`deploy/template.yaml`): private S3 bucket, CloudFront
with origin access control, and optionally an ACM certificate (DNS validated) plus
Route 53 alias records for a custom domain. `deploy/deploy.sh` stages `dist/`,
deploys the stack and invalidates the cache.

## Error handling

- Expected bad input returns result objects with reasons; the app shows them and
  state does not change.
- A corrupt share parameter yields the default invitation and never throws (R17).
- `renderSvg` never throws on a normalized config.

## Testing strategy

- Every requirement names its test. Failing test first, then code, then a look at a
  real render (headless Chrome). Node tests prove the engine; browser-only defects
  (R45, R46) were found by an independent Kiro Crew review and by looking at the
  real page, so those are checked in a browser.
- Property-based tests (fast-check) guard determinism, safe defaults, share-link
  identity, well-formed SVG, remix validity and calendar-file safety.
