// Property-based tests (fast-check). These assert invariants that must hold for
// ANY input, not just hand-picked cases. "model says, code decides" lives here.
import { test } from "node:test";
import assert from "node:assert/strict";
import fc from "fast-check";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  normalizeConfig,
  renderAscii,
  encodeConfig,
  decodeConfig,
  PURPOSES,
  FACES,
  DENSITIES,
  PARTS_ALLOW,
  YEAR_MIN,
  YEAR_MAX,
} from "../engine/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const grids = JSON.parse(readFileSync(join(here, "../assets/grids.json"), "utf8"));

// Arbitrary for a VALID-ish raw config (fields may still be slightly off-range).
const rawConfigArb = fc.record({
  purpose: fc.constantFrom(...PURPOSES),
  year: fc.integer({ min: YEAR_MIN, max: YEAR_MAX }),
  nick: fc.string({ maxLength: 40 }),
  ghost: fc.record({
    face: fc.constantFrom(...FACES),
    parts: fc.subarray(PARTS_ALLOW),
    theme: fc.constant("dark"),
  }),
  density: fc.constantFrom(...DENSITIES),
});

// Arbitrary for arbitrary junk (any JSON-ish value).
const junkArb = fc.anything();

// Property 1 — determinism: same config => byte-identical ASCII.
test("pbt: same config renders identical ASCII (determinism)", () => {
  fc.assert(
    fc.property(rawConfigArb, (raw) => {
      const cfg = normalizeConfig(raw).value;
      return renderAscii(cfg, grids) === renderAscii(JSON.parse(JSON.stringify(cfg)), grids);
    }),
    { numRuns: 300 }
  );
});

// Property 1b — every row of the rendered invitation has equal length.
test("pbt: rendered invitation is a rectangle (equal row lengths)", () => {
  fc.assert(
    fc.property(rawConfigArb, (raw) => {
      const cfg = normalizeConfig(raw).value;
      const rows = renderAscii(cfg, grids).split("\n");
      const len = rows[0].length;
      return rows.every((r) => r.length === len);
    }),
    { numRuns: 200 }
  );
});

// Property 2 — robustness: ANY junk input never throws and leaves a safe config.
test("pbt: junk input never throws; normalizeConfig always yields a safe config", () => {
  fc.assert(
    fc.property(junkArb, (junk) => {
      const res = normalizeConfig(junk);
      const v = res.value;
      return (
        PURPOSES.includes(v.purpose) &&
        Number.isInteger(v.year) && v.year >= YEAR_MIN && v.year <= YEAR_MAX &&
        typeof v.nick === "string" && v.nick.length <= 24 &&
        FACES.includes(v.ghost.face) &&
        Array.isArray(v.ghost.parts) && v.ghost.parts.every((p) => PARTS_ALLOW.includes(p)) &&
        DENSITIES.includes(v.density)
      );
    }),
    { numRuns: 500 }
  );
});

// Property 2b — any string decodes to a safe config without throwing.
test("pbt: decodeConfig never throws on arbitrary strings", () => {
  fc.assert(
    fc.property(fc.string(), (s) => {
      const dec = decodeConfig(s);
      return dec.value && PURPOSES.includes(dec.value.purpose);
    }),
    { numRuns: 500 }
  );
});

// Property 3 — share roundtrip identity: encode then decode === normalized config.
test("pbt: encode -> decode is identity for valid configs", () => {
  fc.assert(
    fc.property(rawConfigArb, (raw) => {
      const cfg = normalizeConfig(raw).value;
      const back = decodeConfig(encodeConfig(cfg)).value;
      return JSON.stringify(back) === JSON.stringify(cfg);
    }),
    { numRuns: 300 }
  );
});
