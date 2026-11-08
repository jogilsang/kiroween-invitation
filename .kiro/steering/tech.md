# Steering: Tech stack & structure

> Why: a single, boring, dependency-light stack keeps the engine testable and the app deployable as static files.
> Effect: the agent won't reach for a framework, bundler, or server when plain ESM + node --test will do.
> 2026-11-05: render target is deterministic SVG (pivoted from ASCII). 2026-11-08: structure updated to the built modules. The stack rules below are unchanged.

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
kiroween-invitation/
  engine/     pure functions — NO DOM, NO network, NO Math.random/Date.now, NO Node-only globals (Buffer, process)
    invite.js     config validation, purpose text, sanitizers, escapeXml, enum/limit constants
    compose.js    layer order + mutual-exclusion rules
    svg.js        config (+ export size) -> deterministic SVG string
    fit.js        squeeze lines that would leave the frame
    assets.js     11 drawn props          costumes.js  4 costumes          scenes.js  3 backdrops
    share.js      config <-> URL param encode/decode/validate
    scan.js       pre-share safety scan (raw text)
    remix.js      new look from a caller-supplied seed
    presets.js    six named looks
    ics.js        calendar file from an unambiguous date and time
    index.js      re-exports
  app/        index.html, main.js, style.css — calls engine only
  tests/      unit + property-based
  deploy/     CloudFormation (S3 + CloudFront + optional custom domain), stage/deploy scripts, og image builder
  docs/       evidence, reviews, submission texts
  .kiro/      specs, steering, hooks, agents
```

## Hard rules

- `engine/` must import nothing from `app/` and must not touch `window`, `document`, `fetch`, `localStorage`, nor Node-only globals such as `Buffer` or `process` (it runs in the browser; a `Buffer` call once left the calendar button dead).
- Determinism: given the same config object, every engine function returns the same output, byte for byte. If jitter is needed (fog/bats), derive a seed from the config; never call `Math.random()` or read the clock.
- Every dynamic value placed into the SVG (nickname, year, purpose text) must be XML-escaped. The engine never emits unescaped user input.
- Node is already installed; the app is static, so "build" means "copy files".
