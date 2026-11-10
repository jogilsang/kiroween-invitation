// R74 — damped spring: deterministic, settles, safe against bad input.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createSpring, stepSpring } from "../engine/spring.js";

const run = (inputs, dt = 1 / 60) => {
  let s = createSpring();
  const out = [];
  for (const i of inputs) { s = stepSpring(s, i, dt); out.push(s.x); }
  return { s, out };
};

test("test_spring_is_deterministic: same input sequence, same trajectory (R74)", () => {
  const seq = Array.from({ length: 120 }, (_, i) => (i < 20 ? 1 : i < 40 ? -0.5 : 0));
  assert.deepEqual(run(seq).out, run(seq).out);
});

test("test_spring_settles: after release it rests within 3 seconds (R74)", () => {
  const seq = [...Array(30).fill(1), ...Array(180).fill(0)];
  const { s, out } = run(seq);
  assert.ok(Math.max(...out.map(Math.abs)) > 0.3, "it moves when pressed");
  assert.ok(Math.abs(s.x) < 1e-3 && Math.abs(s.v) < 1e-2);
});

test("test_spring_clamps_dt_and_input: huge dt, NaN and out-of-range input stay finite (R74)", () => {
  let s = createSpring();
  for (const [i, dt] of [[99, 100], [NaN, 1], [-99, NaN], [Infinity, -1], ["a", 0.01]]) {
    s = stepSpring(s, i, dt);
    assert.ok(Number.isFinite(s.x) && Number.isFinite(s.v) && Math.abs(s.x) <= 2);
  }
  const a = stepSpring(createSpring(), 1, 5), b = stepSpring(createSpring(), 1, 1 / 30);
  assert.deepEqual(a, b);
});

test("test_spring_does_not_mutate_state (R74)", () => {
  const s0 = createSpring(); const copy = { ...s0 };
  stepSpring(s0, 1, 1 / 60);
  assert.deepEqual(s0, copy);
});
