import { test } from "node:test";
import assert from "node:assert/strict";
import {
  resolveParts,
  compositeLayers,
  LAYER_ORDER,
  DECORATION_PARTS,
} from "../engine/compose.js";

// R8 — fixed layer order (happy path 1)
test("test_layer_order_fixed: layer order constant is the documented order", () => {
  assert.deepEqual(LAYER_ORDER, ["background", "pumpkin", "ghost", "face", "decoration"]);
});

// R8 — parts come back in allow-list order regardless of input order (happy path 2)
test("test_parts_in_stable_order: resolveParts ignores click order", () => {
  const a = resolveParts({ ghost: { parts: ["bats", "cobweb", "candle"] } });
  const b = resolveParts({ ghost: { parts: ["candle", "bats", "cobweb"] } });
  assert.deepEqual(a.parts, b.parts);
  // order follows DECORATION_PARTS
  const expected = DECORATION_PARTS.filter((p) => a.parts.includes(p));
  assert.deepEqual(a.parts, expected);
});

// R9 — mutual exclusion (negative path 1)
test("test_mutually_exclusive_parts: hat and horns -> hat wins, decision recorded", () => {
  const res = resolveParts({ ghost: { parts: ["horns", "hat", "bats"] } });
  assert.ok(res.parts.includes("hat"));
  assert.ok(!res.parts.includes("horns"));
  assert.ok(res.parts.includes("bats"));
  assert.ok(res.decisions.some((d) => d.includes("hat") && d.includes("horns")));
});

// edge: empty / missing parts (negative path 2)
test("test_resolve_parts_empty: missing parts is safe", () => {
  assert.deepEqual(resolveParts({}).parts, []);
  assert.deepEqual(resolveParts({ ghost: {} }).parts, []);
});

// error path: composite dimension mismatch throws (programmer error)
test("test_composite_dimension_mismatch_throws", () => {
  const g1 = [[0.1, 0.2]];
  const g2 = [[0.3, 0.4, 0.5]];
  assert.throws(() => compositeLayers([g1, g2]), /dimension mismatch/);
});

// happy: composite overlays upper non-null over lower
test("test_composite_overlay: upper non-null wins, null keeps lower", () => {
  const lower = [[0.2, 0.2]];
  const upper = [[0.9, null]];
  assert.deepEqual(compositeLayers([lower, upper]), [[0.9, 0.2]]);
});
