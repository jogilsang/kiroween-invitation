// WCAG 2.x contrast checks (R39). Text must reach 4.5:1; UI parts read from style.css.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PALETTE_COLORS } from "../engine/index.js";

const rgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const lum = (h) => rgb(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; })
  .reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
export const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const mix = (fg, bg, o) => "#" + rgb(fg).map((v, i) => Math.round(v * o + rgb(bg)[i] * (1 - o)).toString(16).padStart(2, "0")).join("");

const css = readFileSync(new URL("../app/style.css", import.meta.url), "utf8");
const rule = (sel) => { const m = css.match(new RegExp(sel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*\\{([^}]*)\\}")); return m ? m[1] : ""; };
const hexes = (t) => t.match(/#[0-9a-fA-F]{6}/g) || [];

test("contrast helper matches known values", () => {
  assert.ok(Math.abs(contrast("#000000", "#ffffff") - 21) < 0.01);
  assert.ok(Math.abs(contrast("#777777", "#777777") - 1) < 0.01);
});

for (const [name, p] of Object.entries(PALETTE_COLORS)) {
  test(`test_svg_text_contrast_${name}: banner, subtitle and footer reach 4.5`, () => {
    assert.ok(contrast(p.accent, p.bg1) >= 4.5, "banner");
    assert.ok(contrast(p.glow, p.bg0) >= 4.5, "subtitle");
    assert.ok(contrast(mix("#efe6ff", p.bg0, 0.55), p.bg0) >= 4.5, "footer at 55% opacity");
    assert.ok(contrast("#efe6ff", p.bg0) >= 4.5, "event details");
  });
}

test("test_ui_text_contrast: muted and ink text on the panel reach 4.5", () => {
  assert.ok(contrast("#9a7fb8", "#140c1d") >= 4.5);
  assert.ok(contrast("#e9d7ff", "#140c1d") >= 4.5);
});

test("test_action_button_contrast: white label on every gradient stop reaches 4.5", () => {
  const stops = hexes(rule(".actions button"));
  assert.ok(stops.length >= 2);
  for (const s of stops.filter((h) => h.toLowerCase() !== "#ffffff" && h.toLowerCase() !== "#fff")) {
    assert.ok(contrast("#ffffff", s) >= 4.5, `white on ${s}`);
  }
});

test("test_remix_button_contrast: dark label on every remix gradient stop reaches 4.5", () => {
  const body = rule(".actions .remix");
  const stops = hexes(body.split("color:")[0]);
  assert.ok(stops.length >= 2);
  for (const s of stops) assert.ok(contrast("#190a02", s) >= 4.5, `dark on ${s}`);
});

test("test_recv_button_contrast: receiver-view buttons reach 4.5 (primary, link, ghost)", () => {
  const prim = hexes(rule(".recv-actions button, .recv-actions .btnlink").split("color:")[0]);
  assert.ok(prim.length >= 2);
  for (const s of prim) assert.ok(contrast("#ffffff", s) >= 4.5, `white on ${s}`);
  const link = hexes(css.match(/\n\.recv-actions \.btnlink\s*\{([^}]*)\}/)[1].split("color:")[0]);
  assert.ok(link.length >= 2);
  for (const s of link) assert.ok(contrast("#190a02", s) >= 4.5, `dark on ${s}`);
  const ghost = hexes(rule(".recv-actions .ghost"));
  assert.ok(contrast("#e9d7ff", ghost[0]) >= 4.5, "ghost label");
  assert.ok(contrast("#e9d7ff", "#140c1d") >= 4.5, "count text");
});
test("test_recv_focus_visible: receiver buttons and link keep a visible focus ring", () => {
  assert.match(css, /button:focus\s*\{[^}]*outline:\s*2px/);
  assert.match(css, /\.recv-actions a:focus\s*\{[^}]*outline:\s*2px/);
});
