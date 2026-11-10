---
inclusion: fileMatch
fileMatchPattern: "{engine/gif.js,app/gif_worker.js,app/main.js,tests/gif*.test.js}"
---
# Steering: GIF pipeline

> Why: a GIF is the thing people will actually post. It has to be small, loop cleanly and look like the live ghost.
> Effect: when GIF files are in context, the agent keeps encoding pure and checks the result with an independent decoder.

## Hard rules
- `engine/gif.js` is pure: RGBA frames in, `Uint8Array` out. No DOM, no clock, no randomness. Same frames, same bytes.
- Validate before allocating: frame count, width, height and total pixels have constant caps in code. Reject, do not truncate.
- One global palette from all frames (median cut), ordered dithering for the glow gradients. Loop count 0 (forever).
- Encoding runs in a Web Worker so the page does not freeze. The page shows progress.
- Size budget is a constant (target 2.5 MB). Over budget: smaller frame size, one retry, then tell the user.
- Frames come from `pose(t)` at evenly spaced times over exactly one loop, so the last frame flows into the first.

## Verify
- Decode the output with an independent decoder (Pillow in a throwaway uv environment) and compare frame count, size and loop flag.
- Property test: any valid frame set gives a structurally valid GIF.
