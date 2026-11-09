# EVIDENCE app-recv (R60-R69), 2026-11-09

## Design notes (written before code)
1. Entry: the receiver view shows only when the URL has `?i=` that decodes OK (`receiverView` in `engine/recv.js`) and the user has not pressed Edit. A corrupt `?i=` keeps today's behavior: editor with a default invitation and the "link was corrupt" hint.
2. To switch: the [Edit this invitation] button in the receiver view reveals the normal editor with the same config (same page, no reload, no link change). [Make your own] opens the app URL without `?i=`.
3. Shown: the invitation card, a countdown line (only if the date reads and is today or later), [Add to calendar] (only if `buildIcs` is not null), [Share] (only if `navigator.share` exists, else [Copy link]), [Make your own], [Edit]. Hidden: all controls, presets, asset list.
4. Title: `document.title` becomes "<nick>'s invitation" using only the normalized (sanitized) nick. The link-preview image/OG stay static (static hosting; no edge code).
5. Fallbacks: decode failure -> editor; no `navigator.share` -> copy link; no date -> no calendar button, no countdown; reduced motion -> no entrance animation. Share-link format (`?i=`) and the engine SVG output are untouched.

## Verification run (2026-11-09)
- `node --test` after all changes: see DONE_app-recv.md (150 tests, 0 fail; baseline 131 + 19 new).
- Local server: `python3 -m http.server 8138` from the worktree root (same routing as `npm run serve`; app at `/app/index.html`). curl: 200, title "Kiroween Invitation: haunted Halloween invitations". Server stopped afterwards.
- chrome-devtools, own tab only (page 10), URL `/app/index.html?i=<Mina, Dec 24, 7 PM, Hapjeong>`:
  | Did | Expected | Actual |
  |---|---|---|
  | open link | receiver view, editor hidden | `recv` shown, `app` hidden, focus on `recvTitle`, SVG rendered |
  | read title | "<nick>'s invitation" | tab title "Mina's invitation | Kiroween Invitation" (list_pages); later read as Korean because Chrome auto-translated the page (document.lang became ko) |
  | countdown | days to Dec 24 | "45일 남았습니다" (translated "45 days to go"; matches 2026-11-09 to 12-24) |
  | buttons | calendar (date reads), share (navigator.share exists), copy, make your own, edit | all present; make-your-own href = app URL without `?i=` |
  | click Edit | editor appears with same config | recv hidden, app shown, nick = "Mina", focus on `#nick`, title restored |
  | 390x800 mobile emulation | preview above controls, sticky | `order:-1`, `position:sticky`, preview top 18 px, controls below; no horizontal scroll |
  | reduced-motion: reduce | no entrance animation | `animation-name: none` on `#recvArt`; default shows `recv-rise, recv-glow` |
- Screenshots were taken inline in the session only: the chrome-devtools tool refused to write files outside its workspace roots, so no PNG is stored in `docs/review_r3/screens/`. Not verified: real `navigator.share` sheet (button visibility only), `.ics` import, Safari/Firefox, a real phone.
