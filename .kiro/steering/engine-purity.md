---
inclusion: fileMatch
fileMatchPattern: "engine/**/*.js"
---
# Steering: Engine purity

> Why: the engine runs in the browser and in Node tests, and the headline claim is "same config, same bytes". One impure call breaks both.
> Effect: when engine files are in context, the agent keeps functions pure, deterministic and escaped.
> Moved here on 2026-11-09 from `tech.md` ("Hard rules") and `principles.md` ("Coding conventions"); nothing new was added.

## Hard rules

- `engine/` must import nothing from `app/` and must not touch `window`, `document`, `fetch`, `localStorage`, nor Node-only globals such as `Buffer` or `process` (it runs in the browser; a `Buffer` call once left the calendar button dead, R45).
- Determinism: given the same config object, every engine function returns the same output, byte for byte. If jitter is needed (fog/bats), derive a seed from the config; never call `Math.random()` or read the clock.
- Every dynamic value placed into the SVG (nickname, year, purpose text) must be XML-escaped. The engine never emits unescaped user input.

## Coding conventions

- Small pure functions. One responsibility each.
- Validation returns a result (`{ ok, value, reason }` style), never throws for expected bad input. Throwing is for programmer error only.
- Unknown or invalid input is rejected or safely defaulted; never branch on it to do something arbitrary.
