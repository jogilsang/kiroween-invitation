import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeConfig,
  buildInviteText,
  sanitizeNick,
  YEAR_MIN,
  YEAR_MAX,
} from "../engine/invite.js";

// R3 — distinct template per purpose (happy path 1)
test("test_purpose_templates: each purpose yields a distinct title", () => {
  const base = { year: 2026, nick: "Mina" };
  const join = buildInviteText(normalizeConfig({ ...base, purpose: "join" }).value);
  const notice = buildInviteText(normalizeConfig({ ...base, purpose: "notice" }).value);
  const recruit = buildInviteText(normalizeConfig({ ...base, purpose: "recruit" }).value);
  const titles = new Set([join.title, notice.title, recruit.title]);
  assert.equal(titles.size, 3, "three purposes must give three distinct titles");
  assert.ok(join.lines.join(" ").includes("Mina"));
});

// R4 — year is variable (happy path 2)
test("test_year_is_variable: year appears in text and meta banner", () => {
  const out = buildInviteText(normalizeConfig({ purpose: "join", year: 2031, nick: "X" }).value);
  assert.equal(out.meta.banner, "KIROWEEN 2031");
  assert.ok(out.lines.join(" ").includes("2031"));
});

// R5 — invalid year rejected to default (negative path 1)
test("test_reject_invalid_year: non-integer or out-of-range year falls back with a reason", () => {
  for (const bad of ["2026", 1999, YEAR_MAX + 1, 2026.5, NaN, null]) {
    const res = normalizeConfig({ year: bad });
    assert.ok(res.value.year >= YEAR_MIN && res.value.year <= YEAR_MAX);
    assert.equal(Number.isInteger(res.value.year), true);
    assert.ok(res.reasons.some((r) => r.includes("year")), `expected a year reason for ${bad}`);
  }
});

// R6 — nickname sanitized (negative path 2)
test("test_sanitize_nick: strips markup and clamps length; raw never passes through", () => {
  const evil = '<script>alert(1)</script>';
  const { value } = sanitizeNick(evil);
  assert.ok(!value.includes("<"), "angle brackets must be stripped");
  assert.ok(!value.includes(">"));
  const long = "a".repeat(100);
  assert.equal(sanitizeNick(long).value.length, 24);
  // non-string input does not throw
  assert.equal(sanitizeNick(null).value, "");
  assert.equal(typeof sanitizeNick(42).value, "string");
});

// R7 — unknown keys fall back safely (error/edge path)
test("test_unknown_key_falls_back: unknown purpose/face/parts never branch arbitrarily", () => {
  const res = normalizeConfig({
    purpose: "necromancy",
    ghost: { face: "dragon", parts: ["hat", "lightsaber"], theme: "neon" },
    density: "ultra",
  });
  assert.equal(res.value.purpose, "join");
  assert.equal(res.value.ghost.face, "mischief");
  assert.deepEqual(res.value.ghost.parts, ["hat"]); // lightsaber dropped
  assert.equal(res.value.ghost.theme, "dark");
  assert.equal(res.value.density, "mid");
  assert.equal(res.ok, false);
});
