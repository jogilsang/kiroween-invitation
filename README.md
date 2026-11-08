# ASCII Invite — a haunted SVG Halloween invitation generator

> Kiroween 2026 · Category: **Costume Contest** · Built with **Kiro**

**One line:** Decorate a white Kiro ghost and a pumpkin in a dark, glowing Halloween theme, and the app turns your settings into a polished SVG invitation you can save as an image or share by link — no server, no account.

**Model says, code decides.** No AI or randomness is in the render path. The same settings always produce the same SVG, byte for byte. Input validation, layer rules, and the pre-share safety scan are all enforced by code constants, not by a model.

> Note: the project keeps the name `ascii-invite` for continuity; it began as an ASCII-art generator and pivoted to vector SVG for a grotesque, glowing look. See `docs/KIRO_EVIDENCE.md`.

---

## Judge's 1-minute try

**Live:** https://d3hl6g932302kb.cloudfront.net (no login needed)

1. Open the live URL (or run locally, below).
2. Click one of the six **looks** (try *Pirate Crypt*), or press **Remix the look**.
3. Type a name (Korean works), and fill in a date such as `Oct 31`, a time such as `7 PM`, and a place.
4. Change the **export size** (square, story 9:16, wide 16:9), then **Save as image**.
5. Click **Add to calendar (.ics)** to download a calendar entry, or **Copy share link**. Open the link in a new tab and the exact same invitation comes back.

What you can combine: 3 purposes, 3 moods, 3 palettes, 2 glow levels, 11 Halloween assets with 6 colors each, 4 costumes, 4 backdrop scenes, 3 export sizes. Everything runs in your browser; nothing is sent to a server.

## Run locally

```bash
# Engine tests (pure functions, no browser) — Node 22.12+
node --test

# Property-based tests
npm install          # installs fast-check (dev only)
node --test tests/pbt.test.js

# Serve the app
# serve the repository ROOT (app/ imports ../engine/), then open /app/
python3 -m http.server 8137
# then open http://localhost:8137/app/index.html
```

## How it works (engine / app split)

- `engine/` — pure functions, no DOM, no network. Deterministic SVG rendering (`svg.js`), layer composition, invite text, share encode/decode, safety scan. Runs under Node for tests and PBT.
- `app/` — the screen. Calls the engine only; holds UI state, inline SVG preview, SVG→canvas PNG export, clipboard.
- `.kiro/` — Kiro specs, hooks, steering, and custom agents used to build this (required by Kiroween; see `docs/KIRO_EVIDENCE.md`).

## Kiro usage

Built with Kiro (spec, steering, hooks, custom agents, property-based tests) and independently reviewed by Kiro Crew; its findings and how they were closed are in `docs/KIRO_AND_CREW_STORY.md`.

See `docs/KIRO_EVIDENCE.md` for dated evidence of specs, hooks, steering, custom agents, and property-based testing.

## License

MIT — see `LICENSE`.
