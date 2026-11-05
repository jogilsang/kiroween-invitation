import { test } from "node:test";
import assert from "node:assert/strict";
import { renderSvg, deriveSeed, CANVAS } from "../engine/svg.js";
import { normalizeConfig } from "../engine/invite.js";

function cfg(over = {}) {
  return normalizeConfig({
    purpose: "join", year: 2026, nick: "Mina",
    mood: "screaming", palette: "magenta", glow: "strong",
    ghost: { parts: ["moon", "bats"] }, ...over,
  }).value;
}

// R2 — byte-identical determinism
test("test_deterministic_bytes: same config renders identical SVG bytes", () => {
  const c = cfg();
  assert.equal(renderSvg(c), renderSvg(c));
  assert.equal(renderSvg(c), renderSvg(JSON.parse(JSON.stringify(c))));
});

// R1 — output determined solely by config
test("test_same_config_same_output: nick change changes output; same nick stable", () => {
  assert.notEqual(renderSvg(cfg({ nick: "Ann" })), renderSvg(cfg({ nick: "Ben" })));
  assert.equal(renderSvg(cfg({ nick: "Ann" })), renderSvg(cfg({ nick: "Ann" })));
});

// R10 — mood variants differ
test("test_mood_variants_differ: each mood produces different SVG", () => {
  const u = renderSvg(cfg({ mood: "uneasy" }));
  const s = renderSvg(cfg({ mood: "screaming" }));
  const h = renderSvg(cfg({ mood: "hollow" }));
  assert.ok(u !== s && s !== h && u !== h);
});

// R10 — palette variants differ
test("test_palette_variants_differ: each palette produces different SVG", () => {
  const d = renderSvg(cfg({ palette: "deeppurple" }));
  const m = renderSvg(cfg({ palette: "magenta" }));
  const i = renderSvg(cfg({ palette: "indigo" }));
  assert.ok(d !== m && m !== i && d !== i);
});

// R11 — well-formed SVG: single root, fixed viewBox, balanced tags, no leftover placeholders
test("test_svg_wellformed: root svg, fixed viewBox, balanced tags, no template leftovers", () => {
  const out = renderSvg(cfg());
  assert.ok(out.startsWith("<svg "));
  assert.ok(out.trimEnd().endsWith("</svg>"));
  assert.ok(out.includes(`viewBox="0 0 ${CANVAS} ${CANVAS}"`));
  // exactly one root <svg ...> open tag
  assert.equal((out.match(/<svg[\s>]/g) || []).length, 1);
  assert.equal((out.match(/<\/svg>/g) || []).length, 1);
  // no unresolved template placeholders or undefined/NaN leaking in
  assert.ok(!out.includes("${"));
  assert.ok(!out.includes("undefined"));
  assert.ok(!out.includes("NaN"));
  // balanced <g> / </g>
  assert.equal((out.match(/<g[\s>]/g) || []).length, (out.match(/<\/g>/g) || []).length);
});

// R12 — dark-background contract
test("test_dark_background_contract: dark bg gradient + white ghost fill present", () => {
  const out = renderSvg(cfg());
  assert.ok(out.includes('id="bg"'));
  assert.ok(out.includes("#030109")); // darkest bg stop
  assert.ok(out.includes("#ffffff")); // white ghost highlight
});

// R21 — SVG carries a title / aria-label
test("test_svg_has_title: svg has <title> and aria-label with purpose+year", () => {
  const out = renderSvg(cfg({ purpose: "recruit", year: 2027 }));
  assert.ok(out.includes("<title>"));
  assert.ok(out.includes('aria-label="'));
  assert.ok(out.includes("KIROWEEN 2027"));
});

// R6 — nick is escaped in the SVG (defense in depth); sanitize already strips <>
test("test_svg_escapes_nick: no raw angle brackets from nick reach the SVG", () => {
  // sanitize strips < > already, but a value with an ampersand-like char must be escaped.
  const out = renderSvg(cfg({ nick: "A&B <x>" }));
  // the sanitized nick has no < or & ; ensure the document has no stray unescaped '<x>'
  assert.ok(!out.includes("<x>"));
});

// seed stable + config-derived
test("test_derive_seed_stable: same config same seed, different config differs", () => {
  assert.equal(deriveSeed(cfg()), deriveSeed(cfg()));
  assert.notEqual(deriveSeed(cfg({ year: 2026 })), deriveSeed(cfg({ year: 2027 })));
});
