// R84: sound effects are pure data + a pure planner; no sample files.
import test from "node:test";
import assert from "node:assert/strict";
import { SFX, SFX_GAIN_CAP, sfxPlan } from "../engine/sfx.js";

test("test_sfx_plan_is_deterministic: same name and time give the same plan", () => {
  for (const name of Object.keys(SFX)) {
    assert.deepEqual(sfxPlan(name, 1.25), sfxPlan(name, 1.25));
    assert.ok(sfxPlan(name, 1.25).length >= 1, name);
  }
  assert.deepEqual(Object.keys(SFX).sort(), ["creak", "pop", "squish"]);
  const p = sfxPlan("pop", 2)[0];
  assert.deepEqual(Object.keys(p).sort(), ["dur", "freq0", "freq1", "gain", "t0", "type"]);
  assert.ok(p.t0 >= 2);
});

test("test_sfx_unknown_name_is_empty: unknown, prototype and non-string names give []", () => {
  for (const n of ["nope", "", "__proto__", "constructor", "toString", null, undefined, 5, {}, []]) {
    assert.deepEqual(sfxPlan(n, 0), []);
  }
});

test("test_sfx_gain_is_capped: summed gain never exceeds the cap; bad time is safe", () => {
  assert.equal(SFX_GAIN_CAP, 0.35);
  for (const name of Object.keys(SFX)) {
    const plan = sfxPlan(name, 0);
    const sum = plan.reduce((a, s) => a + s.gain, 0);
    assert.ok(sum <= SFX_GAIN_CAP + 1e-9, `${name} sum ${sum}`);
    for (const s of plan) {
      assert.ok(["sine", "triangle", "square", "sawtooth"].includes(s.type));
      assert.ok(s.dur > 0 && s.freq0 > 0 && s.freq1 > 0 && s.gain > 0);
    }
  }
  for (const bad of [NaN, Infinity, -5, "x", undefined]) {
    const plan = sfxPlan("pop", bad);
    assert.ok(plan.every((s) => Number.isFinite(s.t0) && s.t0 >= 0));
  }
});
