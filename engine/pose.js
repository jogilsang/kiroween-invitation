// engine/pose.js — the ghost's idle motion as a pure function of time. (R70, R71)
// No clock, no randomness: the app passes t (seconds) in. Every field repeats
// exactly every LOOP_SECONDS, so a GIF of one loop has no jump.
//
// Fields of the returned pose (all finite numbers):
//   bobY      vertical float in px (+ = down)
//   scaleX    horizontal scale   } scaleX * scaleY === 1 (volume kept:
//   scaleY    vertical scale     } wider means shorter)
//   tailWave  [p0, p1, p2] hem sway in px, each phase a little later than the last
//             (delayed follow-through)
//   blink     0 open .. 1 shut; 0 for most of the loop, two blinks per loop
//   glow      glow pulse multiplier around 1
//   eyeShiftX small horizontal eye drift in px

export const LOOP_SECONDS = 4;
const TAU = Math.PI * 2;
const T_LIMIT = 1e6; // beyond this, float error in the wrap could break the loop guarantee

/** Smooth 0..1..0 bump of half-width `w` around `c` (all in loop fractions). */
function bump(u, c, w) {
  const d = Math.abs(u - c);
  return d >= w ? 0 : 0.5 * (1 + Math.cos((Math.PI * d) / w));
}

/**
 * @param {number} t seconds (any number; NaN/Infinity/non-numbers count as 0)
 * @param {object} [_cfg] reserved: the config is accepted so the look can bias the motion later
 * @returns {{bobY:number,scaleX:number,scaleY:number,tailWave:number[],blink:number,glow:number,eyeShiftX:number}}
 */
export function pose(t, _cfg) {
  let x = typeof t === "number" && Number.isFinite(t) ? t : 0;
  x = Math.max(-T_LIMIT, Math.min(T_LIMIT, x));
  const u = (((x % LOOP_SECONDS) + LOOP_SECONDS) % LOOP_SECONDS) / LOOP_SECONDS; // 0..1
  const a = TAU * u;

  const bobY = 15 * Math.sin(a);
  // Squash is strongest when the ghost is lowest/highest of the bob, a little out of phase.
  const sy = 1 + 0.065 * Math.sin(2 * a + 0.6);
  const tailWave = [0, 1, 2].map((i) => (6 + 4 * i) * Math.sin(2 * a - 0.9 * (i + 1)));
  const blink = Math.max(bump(u, 0.3, 0.03), bump(u, 0.74, 0.03));
  const glow = 1 + 0.14 * Math.sin(a - 0.8);
  const eyeShiftX = 2.5 * Math.sin(a + 1.2);
  return { bobY, scaleX: 1 / sy, scaleY: sy, tailWave, blink, glow, eyeShiftX };
}
