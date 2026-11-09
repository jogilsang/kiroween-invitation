// Static checks for requirements that used to be "checked in a browser" only
// (R20, R46, R50). They read app/index.html and app/main.js as text, so they
// prove the markup is present and ordered; they do NOT prove how it looks.
// They test element presence and relative order, not exact markup.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../app/index.html", import.meta.url), "utf8");
const main = readFileSync(new URL("../app/main.js", import.meta.url), "utf8");

// R20: with JavaScript off the page explains itself instead of staying blank.
test("test_noscript_explains_the_page", () => {
  const m = html.match(/<noscript>([\s\S]*?)<\/noscript>/i);
  assert.ok(m, "no <noscript> block");
  const text = m[1].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  assert.ok(text.length >= 20, `noscript text too short: "${text}"`);
});

test("test_noscript_comes_before_the_hidden_app", () => {
  const ns = html.search(/<noscript>/i);
  const app = html.search(/<main[^>]*id="app"/i);
  assert.ok(ns >= 0 && app >= 0);
  assert.ok(ns < app, "the noscript block should not be buried after the app");
});

// R46: preset thumbnails are <img> elements, never inline <svg> (duplicate ids).
test("test_preset_thumbnails_are_img_elements", () => {
  assert.match(html, /id="presets"/);
  assert.match(main, /createElement\(\s*["']img["']\s*\)/);
  assert.match(main, /data:image\/svg\+xml/);
});

test("test_index_html_has_no_inline_svg_in_the_preset_gallery", () => {
  const m = html.match(/id="presets"[^>]*>([\s\S]*?)<\/div>/);
  assert.ok(m, "preset container not found");
  assert.doesNotMatch(m[1], /<svg[\s>]/i);
});

// R50: save and share come before the long list of controls.
test("test_save_and_share_come_before_the_long_controls", () => {
  const save = html.search(/id="savePng"/);
  const share = html.search(/id="copyLink"/);
  const firstFieldset = html.search(/<fieldset/i);
  assert.ok(save >= 0 && share >= 0 && firstFieldset >= 0, "buttons or fieldset missing");
  assert.ok(save < firstFieldset, "Save as image should come before the first fieldset");
  assert.ok(share < firstFieldset, "Copy share link should come before the first fieldset");
});

test("test_calendar_button_has_a_written_reason_slot", () => {
  assert.match(html, /id="saveIcs"/);
  assert.match(html, /id="icsNote"/);
});

// R53: on load the order is share parameter, then localStorage, then defaults.
test("test_restore_order_share_param_before_local_storage", () => {
  const fn = main.slice(main.indexOf("function initialConfig"));
  const param = fn.search(/get\(\s*["']i["']\s*\)/);
  const stored = fn.search(/localStorage\.getItem/);
  const dflt = fn.search(/normalizeConfig\(/);
  assert.ok(param >= 0 && stored >= 0 && dflt >= 0, "one of the three sources is missing");
  assert.ok(param < stored && stored < dflt, "order must be ?i=, localStorage, defaults");
});

// R52: the stack keeps the bucket private behind origin access control; the
// custom domain is optional (guarded by a condition).
test("test_template_keeps_bucket_private_with_oac", () => {
  const t = readFileSync(new URL("../deploy/template.yaml", import.meta.url), "utf8");
  assert.match(t, /AWS::CloudFront::OriginAccessControl/);
  assert.match(t, /PublicAccessBlockConfiguration:/);
  assert.match(t, /BlockPublicAcls:\s*true/);
  assert.match(t, /BlockPublicPolicy:\s*true/);
  assert.match(t, /HasDomain/);
});
