// Costumes and scenes (R30-R33).
import { test } from "node:test";
import assert from "node:assert/strict";
import fc from "fast-check";
import {
  normalizeConfig, renderSvg, encodeConfig, decodeConfig, remixConfig,
  COSTUMES, SCENES, MOODS, SWATCHES,
} from "../engine/index.js";

const WORN = ["dracula", "mummy", "pirate", "skeleton"];
const build = (over = {}) => normalizeConfig({
  purpose: "join", year: 2026, nick: "Mina", mood: "screaming", palette: "magenta", glow: "strong", ...over,
}).value;
const body = (s) => (s.match(/id="ghostBody" d="([^"]+)"/) || [])[1];

test("test_costume_and_scene_lists: exactly the specified values", () => {
  assert.deepEqual(COSTUMES, ["none", "dracula", "mummy", "pirate", "skeleton"]);
  assert.deepEqual(SCENES, ["sky", "graveyard", "house", "forest"]);
});

test("test_costume_is_drawn: each worn costume adds its own group; none adds nothing", () => {
  for (const c of WORN) assert.ok(renderSvg(build({ costume: c })).includes(`data-part="costume-${c}"`), c);
  const none = renderSvg(build({ costume: "none" }));
  for (const c of WORN) assert.ok(!none.includes(`data-part="costume-${c}"`));
});

test("test_only_one_costume_at_a_time: wearing one never draws another", () => {
  for (const c of WORN) {
    const svg = renderSvg(build({ costume: c }));
    for (const other of WORN.filter((x) => x !== c)) assert.ok(!svg.includes(`costume-${other}`));
  }
});

test("test_unknown_costume_falls_back: bad values become none", () => {
  for (const bad of ["clown", "", null, 5, {}, "__proto__"]) assert.equal(build({ costume: bad }).costume, "none");
});

test("test_costume_is_clipped_to_body: clipPath exists and the costume uses it", () => {
  for (const c of WORN) {
    const svg = renderSvg(build({ costume: c }));
    assert.ok(svg.includes('<clipPath id="ghostClip">'));
    assert.ok(/data-part="costume-[a-z]+"[^>]*clip-path="url\(#ghostClip\)"/.test(svg), c);
  }
});

test("test_costume_tint: a chosen swatch recolors the costume", () => {
  for (const c of WORN) {
    const plain = renderSvg(build({ costume: c }));
    const key = Object.keys(SWATCHES).find((k) => !plain.includes(SWATCHES[k]) || k === "ice");
    const tinted = renderSvg(build({ costume: c, tints: { [c]: key } }));
    assert.notEqual(plain, tinted, `${c} tint must change output`);
    assert.ok(tinted.includes(SWATCHES[key]));
  }
});

test("test_costume_tint_inert_when_not_worn: a tint for an unworn costume changes nothing", () => {
  assert.equal(renderSvg(build({ costume: "mummy" })), renderSvg(build({ costume: "mummy", tints: { dracula: "ice" } })));
  assert.equal(renderSvg(build()), renderSvg(build({ tints: { pirate: "blood" } })));
});

test("test_scene_is_drawn: each non-sky scene adds a marker; sky adds none", () => {
  for (const s of ["graveyard", "house", "forest"]) assert.ok(renderSvg(build({ scene: s })).includes(`data-scene="${s}"`), s);
  assert.ok(!renderSvg(build({ scene: "sky" })).includes("data-scene="));
});

test("test_unknown_scene_falls_back: bad values become sky", () => {
  for (const bad of ["moon", "", null, 7, {}]) assert.equal(build({ scene: bad }).scene, "sky");
});

test("test_costume_scene_do_not_reshape_ghost: ghost body and fog stay identical", () => {
  const fog = (s) => (s.match(/feTurbulence[^>]*seed="(\d+)"/) || [])[1];
  const base = renderSvg(build());
  for (const c of COSTUMES) for (const s of SCENES) {
    const svg = renderSvg(build({ costume: c, scene: s }));
    assert.equal(body(svg), body(base), `${c}/${s} reshaped the ghost`);
    assert.equal(fog(svg), fog(base), `${c}/${s} reshuffled the fog`);
  }
});

test("test_costume_scene_combinations_wellformed: every costume x scene x mood renders cleanly", () => {
  for (const c of COSTUMES) for (const s of SCENES) for (const mood of MOODS) {
    const svg = renderSvg(build({ costume: c, scene: s, mood, ghost: { parts: ["cat", "crow", "moon", "hat"] } }));
    assert.ok(svg.startsWith("<svg ") && svg.trimEnd().endsWith("</svg>"));
    assert.ok(!svg.includes("NaN") && !svg.includes("undefined") && !svg.includes("${"));
    assert.equal((svg.match(/<g[\s>]/g) || []).length, (svg.match(/<\/g>/g) || []).length);
  }
});

test("test_share_roundtrip_costume_scene: both survive the link and render identically", () => {
  const c = build({ costume: "pirate", scene: "house", tints: { pirate: "blood" } });
  const back = decodeConfig(encodeConfig(c));
  assert.equal(back.ok, true);
  assert.deepEqual(back.value, c);
  assert.equal(renderSvg(back.value), renderSvg(c));
});

test("test_remix_covers_costume_and_scene: remixes use several costumes and scenes", () => {
  const costumes = new Set(), scenes = new Set();
  for (let s = 1; s <= 60; s++) { const r = remixConfig(build(), s); costumes.add(r.costume); scenes.add(r.scene); }
  assert.ok(costumes.size >= 4, `costumes seen: ${[...costumes]}`);
  assert.ok(scenes.size >= 3, `scenes seen: ${[...scenes]}`);
});

test("pbt: any costume and scene string is safe", () => {
  fc.assert(fc.property(fc.anything(), fc.anything(), (costume, scene) => {
    const c = build({ costume, scene });
    return COSTUMES.includes(c.costume) && SCENES.includes(c.scene) && renderSvg(c).startsWith("<svg ");
  }), { numRuns: 300 });
});
