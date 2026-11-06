// Export sizes (R34, R35).
import { test } from "node:test";
import { execFileSync } from "node:child_process";
import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";
import fc from "fast-check";
import { normalizeConfig, renderSvg, FORMATS, formatSize } from "../engine/index.js";

const build = (over = {}) => normalizeConfig({
  purpose: "join", year: 2026, nick: "Mina", mood: "screaming", palette: "magenta", glow: "strong",
  event: { date: "Oct 31", time: "7:00 PM", place: "Seoul" }, ghost: { parts: ["cat", "moon"] }, costume: "mummy", scene: "house", ...over,
}).value;

test("test_format_list_and_sizes: three formats with the documented sizes", () => {
  assert.deepEqual(FORMATS, ["square", "story", "wide"]);
  assert.deepEqual(formatSize("square"), { width: 1080, height: 1080 });
  assert.deepEqual(formatSize("story"), { width: 1080, height: 1920 });
  assert.deepEqual(formatSize("wide"), { width: 1920, height: 1080 });
});

test("test_format_dimensions: width, height and viewBox match the format", () => {
  for (const f of FORMATS) {
    const { width, height } = formatSize(f);
    const svg = renderSvg(build(), { format: f });
    assert.ok(svg.includes(`width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"`), f);
  }
});

test("test_square_is_default_and_unchanged: no option equals the square format", () => {
  assert.equal(renderSvg(build()), renderSvg(build(), { format: "square" }));
  assert.equal(renderSvg(build()), renderSvg(build(), {}));
});

test("test_unknown_format_falls_back: bad values give the square", () => {
  for (const bad of ["tall", "", null, 3, {}, "__proto__"]) {
    assert.equal(renderSvg(build(), { format: bad }), renderSvg(build()));
  }
});

test("test_wide_story_contain_whole_artwork: the full square art is inside, unscaled", () => {
  const square = renderSvg(build());
  for (const f of ["story", "wide"]) {
    const svg = renderSvg(build(), { format: f });
    // the artwork is nested as a 1080x1080 svg, never smaller
    assert.ok(/<svg[^>]*data-artwork[^>]*width="1080" height="1080"/.test(svg), `${f}: artwork must be 1080x1080`);
    assert.ok(svg.includes('data-part="costume-mummy"') && svg.includes('data-part="cat"'));
    assert.ok(svg.includes("Oct 31 · 7:00 PM · Seoul"));
    // the artwork's own gradients and filters are still present
    for (const id of ["ghostBody", "ghostGlow", "fog"]) assert.ok(svg.includes(`id="${id}"`), `${f}: ${id}`);
    assert.ok(svg.length > square.length);
  }
});

test("test_formats_wellformed_and_deterministic: every format, twice, identical and clean", () => {
  for (const f of FORMATS) {
    const a = renderSvg(build(), { format: f }), b = renderSvg(build(), { format: f });
    assert.equal(a, b);
    assert.ok(a.startsWith("<svg ") && a.trimEnd().endsWith("</svg>"));
    assert.ok(!a.includes("NaN") && !a.includes("undefined") && !a.includes("${"));
    assert.equal((a.match(/<g[\s>]/g) || []).length, (a.match(/<\/g>/g) || []).length);
  }
});

test("test_no_duplicate_ids: nested artwork must not collide with the backdrop ids", () => {
  for (const f of ["story", "wide"]) {
    const ids = [...renderSvg(build(), { format: f }).matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
    assert.equal(new Set(ids).size, ids.length, `${f}: duplicate ids ${ids.filter((x, i) => ids.indexOf(x) !== i)}`);
  }
});

test("pbt: any format value and config renders a clean svg", () => {
  fc.assert(fc.property(fc.anything(), (format) => {
    const svg = renderSvg(build(), { format });
    return svg.startsWith("<svg ") && !svg.includes("NaN");
  }), { numRuns: 200 });
});

// The app turns the SVG into a PNG through an XML parser, which is stricter than the
// HTML parser a browser uses to display it. Check with a real XML parser (xmllint).
function xmllintAvailable() { try { execFileSync("xmllint", ["--version"], { stdio: "ignore" }); return true; } catch { return false; } }

test("test_formats_are_valid_xml: a real XML parser accepts every format", { skip: !xmllintAvailable() && "xmllint not installed" }, () => {
  const dir = mkdtempSync(join(tmpdir(), "svgxml-"));
  try {
    for (const f of FORMATS) {
      const file = join(dir, `${f}.svg`);
      writeFileSync(file, renderSvg(build(), { format: f }));
      execFileSync("xmllint", ["--noout", file]); // throws on any XML error
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

import { readFileSync } from "node:fs";
test("test_ui_offers_every_format: the export-size select matches the engine's FORMATS", () => {
  const html = readFileSync(new URL("../app/index.html", import.meta.url), "utf8");
  const block = html.match(/<select id="format">([\s\S]*?)<\/select>/);
  assert.ok(block, "format select must exist");
  const values = [...block[1].matchAll(/value="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(values, FORMATS);
});
