// Remix (R27-R29): a seed invents a new look; the user's own content is untouched.
import { test } from "node:test";
import assert from "node:assert/strict";
import fc from "fast-check";
import {
  normalizeConfig, renderSvg, remixConfig, encodeConfig, decodeConfig,
  MOODS, PALETTES, GLOWS, PARTS_ALLOW, SWATCH_KEYS,
} from "../engine/index.js";

const base = () => normalizeConfig({
  purpose: "recruit", year: 2027, nick: "민아",
  event: { date: "Oct 31", time: "7:00 PM", place: "Seoul" },
  mood: "uneasy", palette: "indigo", glow: "soft", ghost: { parts: ["moon"] },
}).value;

test("test_remix_deterministic: same config and seed -> identical config and identical SVG", () => {
  const a = remixConfig(base(), 12345), b = remixConfig(base(), 12345);
  assert.deepEqual(a, b);
  assert.equal(renderSvg(a), renderSvg(b));
});

test("test_remix_keeps_user_content: purpose, year, nick and event never change", () => {
  for (const seed of [1, 2, 3, 99, 4242]) {
    const r = remixConfig(base(), seed);
    assert.equal(r.purpose, "recruit");
    assert.equal(r.year, 2027);
    assert.equal(r.nick, "민아");
    assert.deepEqual(r.event, { date: "Oct 31", time: "7:00 PM", place: "Seoul" });
  }
});

test("test_remix_always_valid: odd seeds still give a valid, renderable config", () => {
  for (const seed of [0, -1, -987654321, 2 ** 31, 2 ** 53, 1.5, NaN, Infinity, "7", null, undefined, {}]) {
    const r = remixConfig(base(), seed);
    assert.ok(MOODS.includes(r.mood) && PALETTES.includes(r.palette) && GLOWS.includes(r.glow));
    assert.ok(r.ghost.parts.every((p) => PARTS_ALLOW.includes(p)));
    assert.ok(!(r.ghost.parts.includes("hat") && r.ghost.parts.includes("horns")), "hat and horns are exclusive");
    assert.ok(Object.values(r.tints).every((t) => SWATCH_KEYS.includes(t)));
    assert.ok(renderSvg(r).startsWith("<svg "));
  }
});

test("test_remix_variety: 60 seeds give at least 40 distinct looks", () => {
  const seen = new Set();
  for (let s = 1; s <= 60; s++) seen.add(renderSvg(remixConfig(base(), s)));
  assert.ok(seen.size >= 40, `only ${seen.size} distinct looks`);
});

test("test_remix_uses_assets_and_colors: remixes pick several assets and some colors", () => {
  let withTints = 0, minAssets = 99, maxAssets = 0;
  for (let s = 1; s <= 40; s++) {
    const r = remixConfig(base(), s);
    if (Object.keys(r.tints).length) withTints++;
    minAssets = Math.min(minAssets, r.ghost.parts.length);
    maxAssets = Math.max(maxAssets, r.ghost.parts.length);
  }
  assert.ok(withTints >= 20, `tinted in only ${withTints}/40`);
  assert.ok(minAssets >= 4 && maxAssets <= 6, `asset count ${minAssets}..${maxAssets}`);
});

test("test_remix_survives_share_link: the remixed look is reproduced exactly from the link", () => {
  const r = remixConfig(base(), 777);
  const back = decodeConfig(encodeConfig(r));
  assert.equal(back.ok, true);
  assert.equal(renderSvg(back.value), renderSvg(r));
});

test("pbt: remix is valid and well-formed for any integer seed", () => {
  fc.assert(fc.property(fc.integer(), (seed) => {
    const r = remixConfig(base(), seed);
    const svg = renderSvg(r);
    return svg.startsWith("<svg ") && !svg.includes("NaN") && !svg.includes("undefined")
      && !(r.ghost.parts.includes("hat") && r.ghost.parts.includes("horns"))
      && r.nick === "민아" && r.purpose === "recruit";
  }), { numRuns: 300 });
});
