# ASCII Invite — a haunted SVG Halloween invitation generator

> Kiroween 2026 · Category: **Costume Contest** · Built with **Kiro**

**One line:** Decorate a white Kiro ghost and a pumpkin in a dark, glowing Halloween theme, and the app turns your settings into a polished SVG invitation you can save as an image or share by link — no server, no account.

**Model says, code decides.** No AI or randomness is in the render path. The same settings always produce the same SVG, byte for byte. Input validation, layer rules, and the pre-share safety scan are all enforced by code constants, not by a model.

> Note: the project keeps the name `ascii-invite` for continuity; it began as an ASCII-art generator and pivoted to vector SVG for a grotesque, glowing look. See `docs/KIRO_EVIDENCE.md`.

---

## Judge's 1-minute try

**Live:** https://d3hl6g932302kb.cloudfront.net (no login needed)

1. Open the live URL — or run locally (below).
2. Pick a purpose (**Join / Notice / Recruit**), a year, and a nickname. Decorate the ghost.
3. Watch the SVG invitation render live in the dark neon theme.
4. Click **Save as image** (PNG) or **Copy share link** — open the link and the exact same invitation comes back.

## Run locally

```bash
# Engine tests (pure functions, no browser) — Node 22.12+
node --test

# Property-based tests
npm install          # installs fast-check (dev only)
node --test tests/pbt.test.js

# Serve the app
python3 -m http.server 8137 --directory app
# then open http://localhost:8137
```

## How it works (engine / app split)

- `engine/` — pure functions, no DOM, no network. Deterministic SVG rendering (`svg.js`), layer composition, invite text, share encode/decode, safety scan. Runs under Node for tests and PBT.
- `app/` — the screen. Calls the engine only; holds UI state, inline SVG preview, SVG→canvas PNG export, clipboard.
- `.kiro/` — Kiro specs, hooks, steering, and custom agents used to build this (required by Kiroween; see `docs/KIRO_EVIDENCE.md`).

## Kiro usage

See `docs/KIRO_EVIDENCE.md` for dated evidence of specs, hooks, steering, custom agents, and property-based testing.

## License

MIT — see `LICENSE`.
