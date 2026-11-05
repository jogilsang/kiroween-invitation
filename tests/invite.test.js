import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeConfig,
  buildInviteText,
  sanitizeNick,
  escapeXml,
  YEAR_MIN,
  YEAR_MAX,
} from "../engine/invite.js";

// R3 — distinct template per purpose
test("test_purpose_templates: each purpose yields a distinct title", () => {
  const base = { year: 2026, nick: "Mina" };
  const titles = new Set(["join", "notice", "recruit"].map(
    (p) => buildInviteText(normalizeConfig({ ...base, purpose: p }).value).title
  ));
  assert.equal(titles.size, 3);
});

// R4 — year variable
test("test_year_is_variable: year appears in banner and body", () => {
  const out = buildInviteText(normalizeConfig({ purpose: "join", year: 2031, nick: "X" }).value);
  assert.equal(out.meta.banner, "KIROWEEN 2031");
  assert.ok(out.lines.join(" ").includes("2031"));
});

// R5 — invalid year rejected
test("test_reject_invalid_year: non-integer/out-of-range year falls back with reason", () => {
  for (const bad of ["2026", 1999, YEAR_MAX + 1, 2026.5, NaN, null]) {
    const res = normalizeConfig({ year: bad });
    assert.ok(Number.isInteger(res.value.year) && res.value.year >= YEAR_MIN && res.value.year <= YEAR_MAX);
    assert.ok(res.reasons.some((r) => r.includes("year")));
  }
});

// R6 — nickname sanitized
test("test_sanitize_nick: strips markup and clamps length", () => {
  assert.ok(!sanitizeNick("<script>alert(1)</script>").value.includes("<"));
  assert.equal(sanitizeNick("a".repeat(100)).value.length, 24);
  assert.equal(sanitizeNick(null).value, "");
  assert.equal(typeof sanitizeNick(42).value, "string");
});

// R6 — escapeXml escapes all five entities
test("test_escape_xml: escapes <, >, &, quotes", () => {
  assert.equal(escapeXml(`<a href="x" id='y'>&`), "&lt;a href=&quot;x&quot; id=&apos;y&apos;&gt;&amp;");
  assert.equal(escapeXml(null), "");
  assert.equal(escapeXml(2026), "2026");
});

// R7 — unknown keys fall back (purpose/mood/palette/glow/parts)
test("test_unknown_key_falls_back: unknown enums default safely", () => {
  const res = normalizeConfig({
    purpose: "necromancy",
    mood: "dragon",
    palette: "neon",
    glow: "blinding",
    ghost: { parts: ["moon", "lightsaber"] },
  });
  assert.equal(res.value.purpose, "join");
  assert.equal(res.value.mood, "screaming");
  assert.equal(res.value.palette, "magenta");
  assert.equal(res.value.glow, "strong");
  assert.deepEqual(res.value.ghost.parts, ["moon"]);
  assert.equal(res.ok, false);
});
