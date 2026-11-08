// Red team round 2 (R43, R44): bugs found by docs/redteam_probe.mjs cases B6 and B10.
import test from "node:test";
import assert from "node:assert/strict";
import { formatSize, renderSvg, normalizeConfig } from "../engine/index.js";

test("test_format_size_ignores_prototype_keys: inherited keys fall back to square", () => {
  for (const k of ["__proto__", "constructor", "toString", "hasOwnProperty", "valueOf"]) {
    assert.deepEqual(formatSize(k), { width: 1080, height: 1080 }, k);
  }
});

test("test_render_with_prototype_format_does_not_throw: renders the square", () => {
  const cfg = normalizeConfig({}).value;
  assert.equal(renderSvg(cfg, { format: "__proto__" }), renderSvg(cfg, { format: "square" }));
});

test("test_event_fields_reject_non_text: objects and arrays become empty, numbers stay", () => {
  const e = normalizeConfig({ event: { date: 1031, time: { a: 1 }, place: [1, 2] } }).value.event;
  assert.equal(e.date, "1031");
  assert.equal(e.time, "");
  assert.equal(e.place, "");
});

test("test_nick_rejects_non_text: an object nickname never becomes the text 'object Object'", () => {
  assert.equal(normalizeConfig({ nick: { a: 1 } }).value.nick, "");
  assert.equal(normalizeConfig({ nick: ["x"] }).value.nick, "");
});
