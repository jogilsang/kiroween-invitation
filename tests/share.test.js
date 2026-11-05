import { test } from "node:test";
import assert from "node:assert/strict";
import { encodeConfig, decodeConfig, serializeConfig } from "../engine/share.js";
import { scanText, scanConfig } from "../engine/scan.js";
import { normalizeConfig } from "../engine/invite.js";
import { renderSvg } from "../engine/svg.js";

function cfg(over = {}) {
  return normalizeConfig({
    purpose: "join", year: 2026, nick: "Mina",
    mood: "screaming", palette: "magenta", glow: "strong",
    ghost: { parts: ["moon", "bats"] }, ...over,
  }).value;
}

// R15 — share roundtrip
test("test_share_link_roundtrip: encode then decode returns an equal config", () => {
  const c = cfg();
  const dec = decodeConfig(encodeConfig(c));
  assert.equal(dec.ok, true);
  assert.deepEqual(dec.value, c);
});

// R16 — opened link reconstructs identical SVG
test("test_open_shared_link_restores: decoded config renders identical SVG", () => {
  const c = cfg({ nick: "Rio", palette: "indigo" });
  const dec = decodeConfig(encodeConfig(c));
  assert.equal(renderSvg(dec.value), renderSvg(c));
});

// R17 — corrupt params fall back safely
test("test_corrupt_share_param_safe: garbage never throws and yields a default", () => {
  for (const bad of ["!!!!", "%%%", "not*base64", "", "YWJj###", "{", "null"]) {
    const dec = decodeConfig(bad);
    assert.equal(dec.ok, false);
    assert.ok(["join", "notice", "recruit"].includes(dec.value.purpose));
    // and the fallback still renders
    assert.ok(renderSvg(dec.value).startsWith("<svg "));
  }
});

// R18 — scan blocks script/pii/banned
test("test_share_content_scan: unsafe nick is flagged, safe nick passes", () => {
  assert.equal(scanText("<script>alert(1)</script>").ok, false);
  assert.equal(scanText("mail me at a@b.com").ok, false);
  assert.equal(scanText("my password is hunter2").ok, false);
  assert.equal(scanText("Mina").ok, true);
  assert.equal(scanConfig(cfg({ nick: "Mina" })).ok, true);
});

// config roundtrip stable
test("test_config_roundtrip: serialize is stable for equal configs", () => {
  assert.equal(serializeConfig(cfg()), serializeConfig(cfg()));
});
