# Red team — deceptive inputs (actual results, SVG engine)

- Date: 2026-11-05 (re-run after the ASCII → SVG pivot). Produced by the
  independent `red-team` role (does not edit engine/app code; reports GO/NO-GO).
- Method: `docs/redteam_probe.mjs` runs each input through the real SVG engine
  and prints the actual outcome. The table is copied from that run, not guessed.
- Three independent defenses:
  1. **sanitizeNick** — strips anything outside `[0-9A-Za-z space - _ . ! ?]`,
     collapses whitespace, clamps to 24. Removes `< > & " '` and tag syntax.
  2. **escapeXml** — every dynamic value placed in the SVG is XML-escaped
     (defense in depth even after sanitize).
  3. **scanText / scanConfig** — blocks script-like, PII, banned content before
     a share link or PNG is produced.

## Results

| # | Input | Expected | Actual | Verdict |
|---|---|---|---|---|
| A1 | `<script>` nickname | stripped, scan blocks, not in SVG | nick=`scriptalert1script`, scan=blocked, svgHasScript=no | PASS |
| A2 | SVG tag injection `"/><rect.../>` via nick | sanitized, no rect injected | nick=`rect width9999...`, injectedRect=no | PASS |
| A3 | `javascript:` URI | scan blocks | blocked | PASS |
| A4 | year string `"2026"` | rejected to default | year=2026, ok=false | PASS |
| A5 | year 9999 | clamped | 2026 | PASS |
| A6 | year -1 | clamped | 2026 | PASS |
| A7 | year 2026.9 | rejected (not int) | 2026 | PASS |
| A8 | purpose `__proto__` | fallback, no pollution | join | PASS |
| A9 | mood `demonic` | fallback | screaming | PASS |
| A10 | palette `rgb(0,0,0)` | fallback (no raw color injected) | magenta | PASS |
| A11 | glow `blinding` | fallback | strong | PASS |
| A12 | parts `["moon","<b>"]` | unknown dropped | `["moon"]` | PASS |
| A13 | 1000-char nick | clamped to 24 | 24 | PASS |
| A14 | emoji nick | stripped (non-Latin) | `""` | PASS (gap G1) |
| A15 | `a\nb` nick | newline removed | `"ab"` | PASS (gap G2) |
| A16 | forged share param | safe default, still renders | ok=false, renders=yes | PASS |
| A17 | valid b64 of bad JSON | safe default, still renders | ok=false, renders=yes | PASS |
| A18 | null config | safe default, renders | join, renders=yes | PASS |
| A19 | array config | safe default | join | PASS |
| A20 | email in nick (PII) | scan blocks | blocked | PASS |
| A21 | phone digits (PII) | scan blocks | blocked | PASS |
| A22 | `A & B` nick | escaped, SVG well-formed | nick=`A B`, wellFormed=yes | PASS |

## Gaps and honest limitations

- **G1 (updated 2026-11-05):** letters, numbers and combining marks from any
  script are now allowed (Korean and Japanese names render); emoji and symbols
  are still stripped. NOT verified: how the glyphs look on devices without a
  CJK font (they may show as empty boxes). Truncation is by code point, so a
  surrogate pair is never split (`test_truncation_never_splits_surrogate`).
- **G3 (PII is scanned on the RAW text):** sanitizing turns `a@b.com` into
  `ab.com`, which would hide the intent. The app therefore runs `scanRaw` on
  the text as typed, before sanitizing, and blocks save/share if it finds an
  email, phone number or markup (`test_event_scan_blocks_pii`).
- **G2 (silent join):** `a\nb` → `ab` with no notice. Safe but silent.
- **Palette/color is never free-form.** `palette` is an enum; a raw color string
  falls back. There is no path for user input to set an SVG color/attribute, so
  attribute-injection via color is not possible.
- **PNG export + clipboard** are browser APIs not exercised by this probe; they
  are verified manually in the browser (S7/S9). The safety scan gates both.

## Verdict

**GO.** Every deceptive input is rejected, clamped, sanitized, or safely
defaulted; none injects markup into the SVG, and every forged/garbage input
still renders a safe default. SVG-specific tag injection (A2) is blocked by
sanitize, with escapeXml as a second line (A22). Limitations G1/G2 documented.

## Added 2026-11-05 (customization depth)

New inputs (event date/time/place, per-asset color, 11 assets) were added to the
attack surface. Covered by `tests/assets.test.js`: markup and over-long text in
every event field cannot reach the SVG (`test_event_details_sanitized`), unknown
swatches or asset keys are dropped (`test_unknown_tint_dropped`), colors can only
be chosen from six fixed swatches (never free-form, so no color/attribute
injection), and the SVG stays well-formed with every asset on and Korean text
(checked with `xmllint`).
