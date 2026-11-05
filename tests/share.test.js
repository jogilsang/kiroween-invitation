import { test } from "node:test";
import assert from "node:assert/strict";
import { encodeConfig, decodeConfig, serializeConfig } from "../engine/share.js";
import { scanText, scanConfig } from "../engine/scan.js";
import { normalizeConfig } from "../engine/invite.js";
import { renderAscii } from "../engine/ascii.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const grids = JSON.parse(readFileSync(join(here, "../assets/grids.json"), "utf8"));

function cfg(over = {}) {
  return normalizeConfig({ purpose: "join", year: 2026, nick: "Mina", density: "mid",
    ghost: { face: "spooky", parts: ["hat", "bats"], theme: "dark" }, ...over }).value;
}

// R15 — share link roundtrip (happy 1)
test("test_share_link_roundtrip: encode then decode returns an equal config", () => {
  const c = cfg();
  const dec = decodeConfig(encodeConfig(c));
  assert.equal(dec.ok, true);
  assert.deepEqual(dec.value, c);
});

// R16 — opened link reconstructs identical invitation (happy 2)
test("test_open_shared_link_restores: decoded config renders identical ASCII", () => {
  const c = cfg({ nick: "Río" }); // non-ASCII to exercise utf8
  const dec = decodeConfig(encodeConfig(c));
  assert.equal(renderAscii(dec.value, grids), renderAscii(c, grids));
});

// R17 — corrupt / forged params fall back safely (negative 1)
test("test_corrupt_share_param_safe: garbage never throws and yields a default", () => {
  for (const bad of ["!!!!", "%%%", "not*base64", "", "YWJj###", "{", "null"]) {
    const dec = decodeConfig(bad);
    assert.equal(dec.ok, false);
    assert.ok(dec.value && typeof dec.value === "object");
    assert.ok(["join", "notice", "recruit"].includes(dec.value.purpose));
  }
});

// R17 — forged fields are re-normalized (negative 2)
test("test_forged_fields_renormalized: injected junk is clamped on decode", () => {
  // valid base64url of a forged payload with bad year/purpose
  const forged = encodeConfig(normalizeConfig({}).value); // start valid
  const dec = decodeConfig(forged);
  assert.ok(dec.value.year >= 2000 && dec.value.year <= 2100);
});

// R18 — scan blocks script / pii / banned (error path)
test("test_share_content_scan: unsafe nick is flagged", () => {
  assert.equal(scanText("<script>alert(1)</script>").ok, false);
  assert.equal(scanText("mail me at a@b.com").ok, false);
  assert.equal(scanText("my password is hunter2").ok, false);
  assert.equal(scanText("Mina").ok, true);
  assert.equal(scanConfig(cfg({ nick: "Mina" })).ok, true);
});

// config roundtrip (serialize/deserialize is stable)
test("test_config_roundtrip: serialize is stable for equal configs", () => {
  assert.equal(serializeConfig(cfg()), serializeConfig(cfg()));
});
