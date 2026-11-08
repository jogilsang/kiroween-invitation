// Link preview image (R51): social crawlers need an absolute URL to a real PNG.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const html = readFileSync(new URL("../app/index.html", import.meta.url), "utf8");
const meta = (name) => (html.match(new RegExp(`<meta [^>]*(?:property|name)="${name}" content="([^"]*)"`)) || [])[1];

test("test_og_image_is_absolute_png_url", () => {
  const u = meta("og:image");
  assert.ok(u && /^https:\/\/[^/]+\/og\.png$/.test(u), u);
});

test("test_og_png_exists_and_is_1200x630", () => {
  const p = new URL("../app/og.png", import.meta.url);
  assert.ok(existsSync(p));
  const b = readFileSync(p);
  assert.equal(b.subarray(1, 4).toString(), "PNG");
  assert.equal(b.readUInt32BE(16), 1200);
  assert.equal(b.readUInt32BE(20), 630);
});

test("test_og_declares_size_alt_and_large_twitter_card", () => {
  assert.equal(meta("og:image:width"), "1200");
  assert.equal(meta("og:image:height"), "630");
  assert.ok(meta("og:image:alt"));
  assert.equal(meta("twitter:card"), "summary_large_image");
  assert.equal(meta("twitter:image"), meta("og:image"));
});

test("test_stage_script_copies_og_png", () => {
  assert.match(readFileSync(new URL("../deploy/stage.mjs", import.meta.url), "utf8"), /og\.png/);
});
