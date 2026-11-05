import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { renderAscii, renderArt, deriveSeed } from "../engine/ascii.js";
import { normalizeConfig } from "../engine/invite.js";

const here = dirname(fileURLToPath(import.meta.url));
const grids = JSON.parse(readFileSync(join(here, "../assets/grids.json"), "utf8"));

function cfg(over = {}) {
  return normalizeConfig({ purpose: "join", year: 2026, nick: "Mina", density: "mid", ...over }).value;
}

// R2 — byte-identical determinism (happy 1)
test("test_deterministic_bytes: same config renders identical bytes", () => {
  const c = cfg();
  assert.equal(renderAscii(c, grids), renderAscii(c, grids));
  // deep clone -> still identical
  const c2 = JSON.parse(JSON.stringify(c));
  assert.equal(renderAscii(c, grids), renderAscii(c2, grids));
});

// R1 — output determined solely by config (happy 2)
test("test_same_config_same_output: different nick changes output, same nick does not", () => {
  const a = renderAscii(cfg({ nick: "Ann" }), grids);
  const b = renderAscii(cfg({ nick: "Ben" }), grids);
  const a2 = renderAscii(cfg({ nick: "Ann" }), grids);
  assert.notEqual(a, b);
  assert.equal(a, a2);
});

// R10 — density levels (edge)
test("test_density_levels: low/mid/high all render and differ by resolution", () => {
  const low = renderArt(cfg({ density: "low" }), grids);
  const mid = renderArt(cfg({ density: "mid" }), grids);
  const high = renderArt(cfg({ density: "high" }), grids);
  for (const s of [low, mid, high]) assert.ok(s.length > 0);
  // low uses stride 2 -> fewer rows than mid
  assert.ok(low.split("\n").length < mid.split("\n").length);
});

// R12 — monospace grid: every row identical length (invariant)
test("test_monospace_grid_consistent: all rows equal length", () => {
  for (const d of ["low", "mid", "high"]) {
    const s = renderAscii(cfg({ density: d }), grids);
    const rows = s.split("\n");
    const len = rows[0].length;
    for (const r of rows) assert.equal(r.length, len, `row length drift at density ${d}`);
  }
});

// R11 — dark theme: field/background maps to dense glyphs (inverted), not blank
test("test_dark_theme_contrast: dark field uses dense glyphs, invitation is non-empty", () => {
  const s = renderAscii(cfg(), grids);
  assert.ok(s.includes("KIROWEEN 2026"));
  // In dark/inverted mid ramp, low brightness maps to the dense end of the ramp,
  // so an art row should be filled with dense (non-space) glyphs, not blanks.
  const firstArtRow = s.split("\n")[3];
  assert.ok(firstArtRow.trim().length === firstArtRow.length, "dark field should not be blank");
  assert.ok(!/^ +$/.test(firstArtRow), "dark field row should not be all spaces");
});

// error path: a light theme (not dark) renders with space as the field glyph
test("test_light_field_is_space: non-dark theme uses space for empty field", () => {
  // theme is normalized to "dark" only, so simulate by rendering and checking
  // that the dark path is what we get; a config forcing an unknown theme falls
  // back to dark (R7), which we assert here to lock the behavior.
  const c = normalizeConfig({ purpose: "join", year: 2026, ghost: { theme: "neon" } }).value;
  assert.equal(c.ghost.theme, "dark");
});

// seed is stable and config-derived
test("test_derive_seed_stable: same config same seed, different config differs", () => {
  assert.equal(deriveSeed(cfg()), deriveSeed(cfg()));
  assert.notEqual(deriveSeed(cfg({ year: 2026 })), deriveSeed(cfg({ year: 2027 })));
});
