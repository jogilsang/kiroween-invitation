// engine/spring.js — a damped spring for the "press and wobble back" feel. (R74)
// Pure: stepSpring returns a new state and never reads a clock. Constants are
// fixed here, never taken from user input.
//   state: { x, v }  x = displacement (about -1..1), v = velocity
//   input: -1..1 press (target position); 0 = let go

export const SPRING_K = 190;      // stiffness
export const SPRING_C = 8.5;      // damping (underdamped: a few wobbles, then rest)
export const SPRING_DT_MAX = 1 / 30;
const SUBSTEP = 1 / 240;
const X_LIMIT = 1.5;
const REST_X = 1e-4;
const REST_V = 1e-3;

export function createSpring() {
  return { x: 0, v: 0 };
}

const fin = (n, fallback) => (typeof n === "number" && Number.isFinite(n) ? n : fallback);

/**
 * @param {{x:number,v:number}} state
 * @param {number} input -1..1 (clamped; non-numbers count as 0)
 * @param {number} dt seconds (clamped to 0..SPRING_DT_MAX; invalid counts as 0)
 * @returns {{x:number,v:number}} new state
 */
export function stepSpring(state, input, dt) {
  const target = Math.max(-1, Math.min(1, fin(input, 0)));
  const h = Math.max(0, Math.min(SPRING_DT_MAX, fin(dt, 0)));
  let x = fin(state && state.x, 0);
  let v = fin(state && state.v, 0);
  const n = Math.ceil(h / SUBSTEP);
  const d = n ? h / n : 0;
  for (let i = 0; i < n; i++) {
    v += (-SPRING_K * (x - target) - SPRING_C * v) * d; // semi-implicit Euler
    x += v * d;
    x = Math.max(-X_LIMIT, Math.min(X_LIMIT, x));
  }
  if (target === 0 && Math.abs(x) < REST_X && Math.abs(v) < REST_V) { x = 0; v = 0; }
  return { x, v };
}
