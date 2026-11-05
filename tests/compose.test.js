import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveParts, LAYER_ORDER, DECORATION_PARTS } from "../engine/compose.js";

// R8 — fixed SVG layer order
test("test_layer_order_fixed: layer order is the documented SVG order", () => {
  assert.deepEqual(LAYER_ORDER, ["background", "fog", "moon", "bats", "ghost", "pumpkin", "frame", "text"]);
});

// R8 — parts in stable allow-list order regardless of input order
test("test_parts_in_stable_order: resolveParts ignores click order", () => {
  const a = resolveParts({ ghost: { parts: ["bats", "moon"] } });
  const b = resolveParts({ ghost: { parts: ["moon", "bats"] } });
  assert.deepEqual(a.parts, b.parts);
  assert.deepEqual(a.parts, DECORATION_PARTS.filter((p) => a.parts.includes(p)));
});

// R9 — mutual exclusion hat/horns
test("test_mutually_exclusive_parts: hat and horns -> hat wins, decision recorded", () => {
  const res = resolveParts({ ghost: { parts: ["horns", "hat", "bats"] } });
  assert.ok(res.parts.includes("hat"));
  assert.ok(!res.parts.includes("horns"));
  assert.ok(res.parts.includes("bats"));
  assert.ok(res.decisions.some((d) => d.includes("hat") && d.includes("horns")));
});

// edge — empty/missing parts
test("test_resolve_parts_empty: missing parts is safe", () => {
  assert.deepEqual(resolveParts({}).parts, []);
  assert.deepEqual(resolveParts({ ghost: {} }).parts, []);
});
