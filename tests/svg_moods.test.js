import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { renderSvg } from "../engine/svg.js";
import { pose } from "../engine/pose.js";
import { normalizeConfig, MOODS, COSTUMES, SCENES } from "../engine/invite.js";

const NEW = ["wink", "sleepy", "surprised", "blush", "joy"];
const cfg = (over = {}) =>
  normalizeConfig({ purpose: "join", year: 2026, nick: "Mina", palette: "magenta", glow: "strong", ...over }).value;
const sha = (s) => createHash("sha256").update(s).digest("hex");

function wellFormed(svg) {
  assert.equal((svg.match(/<svg[\s>]/g) || []).length, 1);
  assert.ok(!/NaN|undefined|Infinity|\$\{/.test(svg));
  const stack = [];
  for (const m of svg.matchAll(/<(\/?)([a-zA-Z][\w:-]*)([^>]*?)(\/?)>/g)) {
    if (m[4] === "/") continue;
    if (m[1]) assert.equal(stack.pop(), m[2]);
    else stack.push(m[2]);
  }
  assert.equal(stack.length, 0);
}

test("test_all_moods_render_wellformed: 8 moods x costumes x scenes", () => {
  assert.equal(MOODS.length, 8);
  for (const mood of MOODS) for (const costume of COSTUMES) for (const scene of SCENES) {
    const c = cfg({ mood, costume, scene });
    wellFormed(renderSvg(c));
    wellFormed(renderSvg(c, { pose: pose(1.3, c) }));
    assert.ok(renderSvg(c).includes('id="ghostEyes"'));
  }
});

test("test_new_moods_differ_from_each_other: 8 distinct SVGs", () => {
  const set = new Set(MOODS.map((mood) => renderSvg(cfg({ mood }))));
  assert.equal(set.size, 8);
});

test("test_existing_moods_unchanged: first three moods keep their bytes", () => {
  const want = {
    uneasy: "0be6a75eceb0390db2407aaa1549b2d6eebf493219f4cfd1c23f69ffc8dd9674",
    screaming: "07e6537f30fc6febfa018cf20e6a2b45d3d6e50c0322fc6817c617795dc7d44e",
    hollow: "7ba3dc8c5bf4aedab889858c3e13c2f928fd0f2b8d4c6a35c12109f357b8f139",
  };
  for (const [m, h] of Object.entries(want)) assert.equal(sha(renderSvg(cfg({ mood: m }))), h, m);
});

test("test_new_moods_deterministic: same bytes twice, with and without pose", () => {
  for (const mood of NEW) {
    const c = cfg({ mood });
    assert.equal(renderSvg(c), renderSvg(JSON.parse(JSON.stringify(c))));
    const p = pose(2.1, c);
    assert.equal(renderSvg(c, { pose: p }), renderSvg(c, { pose: p }));
  }
});

test("test_new_moods_have_own_features: blush cheeks, closed eyes drawn as paths", () => {
  const eyes = (mood) => {
    const s = renderSvg(cfg({ mood }));
    return s.slice(s.indexOf('id="ghostEyes"'), s.indexOf('id="ghostEyes"') + 1200);
  };
  assert.ok(renderSvg(cfg({ mood: "blush" })).includes('data-feature="cheeks"'));
  assert.ok(!renderSvg(cfg({ mood: "joy" })).includes('data-feature="cheeks"'));
  for (const m of ["wink", "joy", "sleepy"]) assert.ok(/<path/.test(eyes(m)), m);
});
