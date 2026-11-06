// Regression tests for issues found by the independent Kiro Crew review
// (docs/CREW_FINDINGS.md). Each test names the finding it closes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { normalizeConfig, renderSvg, NICK_MAX } from "../engine/index.js";

const here = dirname(fileURLToPath(import.meta.url));

function cfg(parts) {
  return normalizeConfig({ purpose: "join", year: 2026, nick: "Mina", ghost: { parts } }).value;
}

// Finding P0-1: hat/horns checkboxes drew nothing (only the fog seed changed).
test("crew_hat_is_drawn: selecting hat adds a hat shape, not just a different fog seed", () => {
  const none = renderSvg(cfg([]));
  const hat = renderSvg(cfg(["hat"]));
  assert.ok(hat.includes('data-part="hat"'), "hat group must exist in the SVG");
  assert.ok(!none.includes('data-part="hat"'));
});

test("crew_horns_is_drawn: selecting horns adds a horns shape", () => {
  const horns = renderSvg(cfg(["horns"]));
  assert.ok(horns.includes('data-part="horns"'));
});

test("crew_hat_horns_exclusive_in_svg: both selected -> only hat is drawn (R9 visible in output)", () => {
  const both = renderSvg(cfg(["horns", "hat"]));
  assert.ok(both.includes('data-part="hat"'));
  assert.ok(!both.includes('data-part="horns"'));
});

test("crew_parts_do_not_reshuffle_fog: toggling a part must not change the fog seed", () => {
  const seedOf = (s) => (s.match(/feTurbulence[^>]*seed="(\d+)"/g) || []).join("|");
  assert.equal(seedOf(renderSvg(cfg([]))), seedOf(renderSvg(cfg(["hat"]))));
});

test("crew_parts_keep_determinism: same parts -> identical bytes", () => {
  assert.equal(renderSvg(cfg(["hat", "moon"])), renderSvg(cfg(["hat", "moon"])));
});

// Finding: nick input maxlength (40) did not match NICK_MAX (24) -> silent cut.
test("crew_nick_maxlength_matches_engine: the input limit equals NICK_MAX", () => {
  const html = readFileSync(join(here, "../app/index.html"), "utf8");
  const m = html.match(/id="nick"[^>]*maxlength="(\d+)"/);
  assert.ok(m, "nick input must declare maxlength");
  assert.equal(Number(m[1]), NICK_MAX);
});

// Finding: purpose radiogroup had no keyboard navigation.
test("crew_purpose_keyboard_nav: main.js handles arrow keys with roving tabindex", () => {
  const js = readFileSync(join(here, "../app/main.js"), "utf8");
  assert.ok(js.includes("ArrowRight") && js.includes("ArrowLeft"));
  assert.ok(js.includes("tabindex"));
});
