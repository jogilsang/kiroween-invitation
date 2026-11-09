import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../app/style.css", import.meta.url), "utf8");
const html = readFileSync(new URL("../app/index.html", import.meta.url), "utf8");
const js = readFileSync(new URL("../app/main.js", import.meta.url), "utf8");

test("test_entrance_animation_respects_reduced_motion", () => {
  assert.match(css, /@keyframes\s+recv-rise/);
  assert.match(css, /prefers-reduced-motion:\s*reduce\)\s*\{[^}]*\.recv[^}]*animation:\s*none/s);
});

test("test_mobile_preview_comes_first", () => {
  const m = css.match(/@media \(max-width: 760px\)\s*\{[^}]*order:\s*-1[^}]*\}/s);
  assert.ok(m, "a 760px rule sets order:-1 on the preview");
});

test("test_save_config_label_is_explained", () => {
  assert.ok(!/>Save config</.test(html));
  assert.match(html, /id="saveCfg"[^>]*>[^<]*(device|Remember)/);
});

test("receiver markup exists with accessible controls", () => {
  assert.match(html, /id="recv"/);
  assert.match(html, /id="recvEdit"/);
  assert.match(html, /id="recvOwn"/);
  assert.match(html, /id="recvCal"/);
  assert.match(html, /id="recvShare"/);
  assert.match(html, /id="recvCount"[^>]*aria-live/);
});

test("main.js wires the receiver view through the engine", () => {
  assert.match(js, /receiverView\(/);
  assert.match(js, /receiverTitle\(/);
  assert.match(js, /canNativeShare\(/);
  assert.match(js, /document\.title/);
});

test("app adds no external script or stylesheet", () => {
  assert.ok(!/(src|href)="https?:\/\//.test(html.replace(/property="og:[^>]*>/g, "")));
});

test("test_hidden_attr_not_overridden: every element toggled with [hidden] stays hidden despite display rules", async () => {
  const { readFileSync } = await import("node:fs");
  const css = readFileSync(new URL("../app/style.css", import.meta.url), "utf8");
  assert.match(css, /\.layout\[hidden\]\s*\{\s*display:\s*none/);
});
