---
inclusion: fileMatch
fileMatchPattern: "{engine/pose.js,engine/spring.js,engine/svg.js,app/main.js,tests/pose*.test.js,tests/spring*.test.js}"
---
# Steering: Motion

> Why: the ghost has to feel soft and alive on the page and still be the same ghost in a GIF. That only works if motion is data, not a side effect of the browser.
> Effect: when motion files are in context, the agent writes motion as pure functions of time and keeps the loop seamless.

## Hard rules
- Motion is `pose(t, cfg)`: a pure function. No `Date.now`, no `Math.random`, no `performance.now` inside the engine. The app passes the time in.
- Every field of `pose` is periodic over `LOOP_SECONDS`. `pose(0)` equals `pose(LOOP_SECONDS)`. Use sine of whole multiples of the base angle, never free-running counters.
- "Jelly" comes from squash and stretch that keeps volume (when it gets wider it gets shorter) plus a delayed, damped follow-through on the tail. Springs use fixed constants in code, never values from user input.
- The live preview and the GIF frames call the same `pose`. If you change the look of the motion, change it in one place.
- `prefers-reduced-motion` means the rest pose, not a slower animation.
- Keep per-frame work small: move groups with transforms; do not rebuild the whole SVG string every frame in the live preview.

## Verify
- Property test: `pose` is deterministic and periodic for random `t` and configs.
- Look at a contact sheet of eight frames from one loop before calling a motion change done.
