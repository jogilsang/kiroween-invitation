# Steering: Tech stack & structure

> Why: a single, boring, dependency-light stack keeps the engine testable and the app deployable as static files.
> Effect: the agent won't reach for a framework, bundler, or server when plain ESM + node --test will do.
> 2026-11-05: render target is deterministic SVG (pivoted from ASCII). The stack rules below are unchanged.

## Stack

- Language: JavaScript (ES modules), single stack. No TypeScript build step.
- Runtime for tests: Node built-in test runner (`node --test`). Node 22.12+.
- Property-based testing: `fast-check` (dev dependency only).
- App: static HTML + ESM + CSS. No framework, no bundler. Served as static files.
- Deploy target: static site (S3 + CloudFront OAC). Nothing server-side.
- Rendering: the engine emits an SVG **string** (pure, no DOM). The app injects
  it for preview and rasterizes it to PNG via canvas. No SVG library — the SVG
  is assembled from plain template strings with every dynamic value XML-escaped.

## Structure

```
ascii-invite/
  engine/     pure functions — NO DOM, NO network, NO Math.random/Date.now in the render path
    svg.js        config -> deterministic SVG string (ghost/pumpkin/fog/glow)
    compose.js    layer order + mutual-exclusion rules
    invite.js     purpose/year/nick + mood/palette/glow -> text + validation + escapeXml
    share.js      config <-> URL param encode/decode/validate
    scan.js       pre-share safety scan
    index.js      re-exports
  app/        index.html, main.js, style.css — calls engine only
  tests/      unit + pbt
  .kiro/      specs, steering, hooks, agents
```

## Hard rules

- `engine/` must import nothing from `app/` and must not touch `window`, `document`, `fetch`, `localStorage`.
- Determinism: given the same config object, every engine function returns the same output, byte for byte. If jitter is needed (fog/bats), derive a seed from the config; never call `Math.random()` or read the clock.
- Every dynamic value placed into the SVG (nickname, year, purpose text) must be XML-escaped. The engine never emits unescaped user input.
- Node is already installed; the app is static, so "build" means "copy files".
