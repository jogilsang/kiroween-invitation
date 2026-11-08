// Preset looks (R40-R42). A preset changes only the LOOK; the user's own content survives.
import test from "node:test";
import assert from "node:assert/strict";
import { PRESETS, applyPreset, normalizeConfig, renderSvg } from "../engine/index.js";

const base = () => normalizeConfig({
  purpose: "recruit", year: 2027, nick: "민아",
  event: { date: "Oct 31", time: "7:00 PM", place: "Seoul" },
}).value;

test("test_presets_exist: at least six presets with unique ids and names", () => {
  assert.ok(PRESETS.length >= 6);
  assert.equal(new Set(PRESETS.map((p) => p.id)).size, PRESETS.length);
  assert.equal(new Set(PRESETS.map((p) => p.name)).size, PRESETS.length);
});

test("test_preset_keeps_user_content: purpose, year, nick and event survive", () => {
  for (const p of PRESETS) {
    const out = applyPreset(base(), p.id);
    assert.equal(out.purpose, "recruit");
    assert.equal(out.year, 2027);
    assert.equal(out.nick, "민아");
    assert.deepEqual(out.event, base().event);
  }
});

test("test_preset_is_already_normalized: normalizing again changes nothing", () => {
  for (const p of PRESETS) {
    const out = applyPreset(base(), p.id);
    assert.deepEqual(normalizeConfig(out).value, out, p.id);
  }
});

test("test_presets_look_different: every preset renders a distinct image", () => {
  const svgs = PRESETS.map((p) => renderSvg(applyPreset(base(), p.id)));
  assert.equal(new Set(svgs).size, PRESETS.length);
});

test("test_preset_is_deterministic: same input gives the same bytes", () => {
  const id = PRESETS[0].id;
  assert.equal(renderSvg(applyPreset(base(), id)), renderSvg(applyPreset(base(), id)));
});

test("test_unknown_preset_is_noop: unknown, empty and prototype keys change nothing", () => {
  for (const id of ["nope", "", "__proto__", "constructor", null, undefined, 7]) {
    assert.deepEqual(applyPreset(base(), id), base());
  }
});
