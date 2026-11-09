---
inclusion: fileMatch
fileMatchPattern: "app/**"
---
# Steering: App rules

> Why: the app is the only place a visitor touches; the requirements it must keep (R14-R21, R39, R46, R50) are easy to break with a small markup change.
> Effect: when app files are in context, the agent keeps the app a thin caller of the engine and keeps the listed requirements true.
> Collected on 2026-11-09 from the existing requirements; no new rule.

- The app calls the engine only. No rendering or validation logic of its own.
- Scan the raw text (`scanRaw`) before any save, share or calendar output (R18).
- `<noscript>` explanation stays (R20). The preview has `role="img"` and an `aria-label`, and the SVG has a `<title>` (R21).
- Never put several inline SVGs with the same element ids in one page; preset thumbnails are `<img>` (R46).
- The save and share buttons and their one-line explanation come before the long list of controls; say in words why the calendar button is off (R50).
- Text and button labels keep WCAG contrast 4.5:1 (R39); `tests/contrast.test.js` reads `style.css`.
