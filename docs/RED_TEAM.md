# Red team — 20 deceptive inputs (actual results)

- Date: 2026-11-05. Produced by the independent `red-team` agent role (does not
  edit engine/app code; reports GO / NO-GO).
- Method: `docs/redteam_probe.mjs` runs each input through the real engine and
  prints the actual outcome. The table below is copied from that run, not guessed.
- Two defenses exist and are independent:
  1. **sanitizeNick** — strips anything outside `[0-9A-Za-z space - _ . ! ?]`,
     collapses whitespace, clamps to 24 chars. Runs on every normalize.
  2. **scanText / scanConfig** — blocks script-like, PII-like, and banned content
     before a share link or PNG is produced.

## Results

| # | Input | Expected | Actual | Verdict |
|---|---|---|---|---|
| A1 | `<script>alert(1)</script>` nickname | stripped + scan blocks + not in art | nick=`scriptalert1script`, scan=blocked, in art=no | PASS |
| A2 | `<img src=x onerror=alert(1)>` nickname | stripped + scan blocks | nick=`img srcx onerroralert1`, scan=blocked | PASS |
| A3 | `javascript:alert(1)` | scan blocks | scan=blocked | PASS |
| A4 | year = string `"2026"` | rejected to default, reason recorded | year=2026(default), ok=false, reason listed | PASS |
| A5 | year = 9999 | clamped to default | 2026 | PASS |
| A6 | year = -1 | clamped to default | 2026 | PASS |
| A7 | year = 2026.9 (float) | rejected (not integer) | 2026 | PASS |
| A8 | purpose = `__proto__` | falls back, no pollution | `join` | PASS |
| A9 | face = `dragon` | falls back | `mischief` | PASS |
| A10 | parts = `["hat","<b>"]` | unknown dropped | `["hat"]` | PASS |
| A11 | 1000-char nickname | clamped to 24 | length 24 | PASS |
| A12 | `💀💀💀` nickname | stripped (non-Latin) | `""` | PASS (see gap G1) |
| A13 | `a\nb` nickname | newline removed | `"ab"` | PASS (see gap G2) |
| A14 | forged share param (garbage) | safe default, no throw | ok=false, purpose=`join` | PASS |
| A15 | valid base64 of broken JSON | safe default, no throw | ok=false, purpose=`join` | PASS |
| A16 | share param re-decoded | year re-normalized | year=2026 | PASS |
| A17 | `null` config | safe default | `join` | PASS |
| A18 | array as config | safe default | `join` | PASS |
| A19 | `a@b.com` in nickname | scan blocks (PII) | scan=blocked | PASS |
| A20 | `01012345678` in nickname | scan blocks (PII) | scan=blocked | PASS |

## Gaps and honest limitations

- **G1 (non-Latin names vanish):** `sanitizeNick` strips non-Latin scripts, so a
  Korean/Japanese/emoji nickname becomes empty rather than rendering. This is a
  safety/ratio choice (keeps the monospace grid intact) but it is a real UX
  limitation, not full coverage. Candidate follow-up: per-script width handling.
- **G2 (silent join):** `a\nb` becomes `ab` with no notice to the user. Safe, but
  silent. Acceptable for a nickname; worth a note if free-text grows.
- **Scan runs on sanitized text in the live app.** Because the nickname is already
  sanitized before `scanConfig`, some script payloads are already defanged when
  the scan sees them. The scan is therefore a second line, not the only line. The
  probe above calls `scanText` on the RAW string to prove the scan itself works.
- **Not covered:** the PNG export and clipboard are browser APIs not exercised by
  this probe; they are verified manually in the browser (step 9/10). The safety
  scan gates both before they run.

## Verdict

**GO.** Every deceptive input is rejected, clamped, sanitized, or safely
defaulted; none crashes the engine or reaches output as live markup. The two
limitations (G1, G2) are documented, not hidden.
