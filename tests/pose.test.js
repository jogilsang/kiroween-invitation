// R70, R71 — pose is a pure, periodic, finite, volume-preserving function of time.
import { test } from "node:test";
import assert from "node:assert/strict";
import fc from "fast-check";
import { pose, LOOP_SECONDS } from "../engine/pose.js";
import { normalizeConfig } from "../engine/index.js";

const cfg = normalizeConfig({ nick: "Mina" }).value;
const flat = (p) => Object.entries(p).flatMap(([k, v]) => (Array.isArray(v) ? v.map((x, i) => [`${k}${i}`, x]) : [[k, v]]));
const near = (a, b, eps = 1e-9) => {
  const A = flat(a), B = flat(b);
  assert.equal(A.length, B.length);
  A.forEach(([k, v], i) => assert.ok(Math.abs(v - B[i][1]) <= eps, `${k}: ${v} vs ${B[i][1]}`));
};

test("test_pose_is_deterministic: same t and config give the same numbers (R70)", () => {
  assert.deepEqual(pose(1.234, cfg), pose(1.234, cfg));
  assert.deepEqual(pose(1.234), pose(1.234, cfg));
});

test("test_pose_loops_seamlessly: pose(t) equals pose(t + LOOP_SECONDS) (R71)", () => {
  near(pose(0, cfg), pose(LOOP_SECONDS, cfg));
  fc.assert(fc.property(fc.double({ min: -1000, max: 1000, noNaN: true }), (t) => {
    near(pose(t, cfg), pose(t + LOOP_SECONDS, cfg));
  }), { numRuns: 300 });
});

test("test_pose_is_always_finite: any t, even NaN or Infinity, gives finite numbers (R70)", () => {
  for (const t of [NaN, Infinity, -Infinity, -5, 1e12, "x", null, undefined]) {
    for (const [k, v] of flat(pose(t, cfg))) assert.ok(Number.isFinite(v), `${k} for t=${t}`);
  }
  fc.assert(fc.property(fc.double(), (t) => flat(pose(t, cfg)).every(([, v]) => Number.isFinite(v))));
  assert.deepEqual(pose(NaN, cfg), pose(0, cfg));
});

test("test_pose_preserves_volume: scaleX * scaleY stays 1 and the blink is mostly open (R70)", () => {
  let open = 0, n = 400, maxBlink = 0, minSx = 9, maxSx = 0;
  for (let i = 0; i < n; i++) {
    const p = pose((i / n) * LOOP_SECONDS, cfg);
    assert.ok(Math.abs(p.scaleX * p.scaleY - 1) < 1e-9);
    assert.ok(p.blink >= 0 && p.blink <= 1);
    if (p.blink === 0) open++;
    maxBlink = Math.max(maxBlink, p.blink);
    minSx = Math.min(minSx, p.scaleX); maxSx = Math.max(maxSx, p.scaleX);
  }
  assert.ok(open / n > 0.85, "eyes open most of the loop");
  assert.ok(maxBlink > 0.9, "it does blink");
  assert.ok(maxSx - minSx > 0.02, "it does squash and stretch");
});
