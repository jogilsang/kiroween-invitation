# Steering: Tech stack & structure

> Why: a single, boring, dependency-light stack keeps the engine testable and the app deployable as static files.
> Effect: the agent won't reach for a framework, bundler, or server when plain ESM + node --test will do.
> Inclusion: always (no front matter).
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
    assets.js     11 drawn props          costumes.js  4 costumes          scenes.js  3 drawn scenes (+ plain sky)
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

Moved on 2026-11-09 to `engine-purity.md` (loaded when engine files are in context). The rule that matters everywhere: the engine imports nothing from `app/`, and the app calls the engine only.
