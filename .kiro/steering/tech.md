# Steering: Tech stack & structure

> Why: a single, boring, dependency-light stack keeps the engine testable and the app deployable as static files.
> Effect: the agent won't reach for a framework, bundler, or server when plain ESM + node --test will do.

## Stack

- Language: JavaScript (ES modules), single stack. No TypeScript build step.
- Runtime for tests: Node built-in test runner (`node --test`). Node 22.12+.
- Property-based testing: `fast-check` (dev dependency only).
- App: static HTML + ESM + CSS. No framework, no bundler. Served as static files.
- Deploy target: static site (S3 + CloudFront OAC). Nothing server-side.

## Structure

```
ascii-invite/
  engine/     pure functions — NO DOM, NO network, NO globals like Math.random/Date.now in the render path
    ascii.js      image grid -> ASCII string (deterministic, density ramp, dark invert)
    compose.js    layer composition rules (order + mutual exclusion)
    invite.js     purpose/year/nick -> invitation text + input validation
    share.js      config <-> URL param encode/decode/validate
    scan.js       pre-share safety scan
    index.js      re-exports
  app/        index.html, main.js, style.css — calls engine only
  assets/     ghost/pumpkin/decoration silhouettes (SVG) + sampled grids as JSON
  tests/      unit + pbt
  .kiro/      specs, steering, hooks, agents
```

## Hard rules

- `engine/` must import nothing from `app/` and must not touch `window`, `document`, `fetch`, `localStorage`.
- Determinism: given the same config object, every engine function returns the same output, byte for byte. If randomness is ever needed, derive a seed from the config; never call `Math.random()` or read the clock.
- Node is already installed; the app is static, so "build" means "copy files".
