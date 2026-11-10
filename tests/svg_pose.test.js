// R72 — the renderer takes an optional pose; without one the output is the plain one.
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderSvg, normalizeConfig } from "../engine/index.js";
import { pose } from "../engine/pose.js";
import { createSpring, stepSpring } from "../engine/spring.js";

const cfg = normalizeConfig({ nick: "Mina", costume: "dracula", ghost: { parts: ["hat"] } }).value;
const ids = (svg) => [...svg.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);

test("test_render_without_pose_is_unchanged: no pose, {} and null all give the same bytes, with no pose transform (R72)", () => {
  const base = renderSvg(cfg);
  assert.equal(renderSvg(cfg, {}), base);
  assert.equal(renderSvg(cfg, { pose: null, spring: null }), base);
  assert.equal(renderSvg(cfg, { format: "square" }), base);
  assert.ok(!base.includes("data-pose"));
});

test("test_pose_changes_render_and_is_deterministic (R72)", () => {
  const p = pose(1.1, cfg);
  const a = renderSvg(cfg, { pose: p });
  assert.equal(a, renderSvg(cfg, { pose: p }));
  assert.notEqual(a, renderSvg(cfg));
  assert.ok(a.includes("data-pose"));
});

test("test_pose_groups_have_stable_unique_ids (R72, R46)", () => {
  for (const svg of [renderSvg(cfg), renderSvg(cfg, { pose: pose(0.7, cfg) }), renderSvg(cfg, { pose: pose(0.7, cfg), format: "wide" })]) {
    const all = ids(svg);
    assert.equal(new Set(all).size, all.length, "no duplicate ids");
    for (const id of ["ghostBody", "ghostRig", "ghostEyes", "ghostTail", "ghostGlowLayer"]) assert.ok(all.includes(id), id);
  }
});

test("test_pose_render_is_wellformed_for_hostile_pose (R72)", () => {
  for (const p of [{}, { bobY: NaN, scaleX: Infinity }, { scaleY: "x" }, { tailWave: "no" }, 5]) {
    const svg = renderSvg(cfg, { pose: p, spring: { x: NaN, v: 1 } });
    assert.ok(!/NaN|Infinity|undefined/.test(svg));
    assert.ok(svg.startsWith("<svg") && svg.endsWith("</svg>"));
  }
});

test("test_spring_squashes_the_ghost (R74)", () => {
  const s = stepSpring(createSpring(), 1, 1 / 30);
  assert.notEqual(renderSvg(cfg, { spring: s }), renderSvg(cfg));
});

test("test_ghost_path_d_matches_render_and_waves_with_pose (R72)", async () => {
  const { ghostPathD } = await import("../engine/svg.js");
  const d = (svg) => svg.match(/id="ghostBody" d="([^"]+)"/)[1];
  assert.equal(ghostPathD(cfg), d(renderSvg(cfg)));
  const p = pose(0.9, cfg);
  assert.equal(ghostPathD(cfg, p), d(renderSvg(cfg, { pose: p })));
  assert.notEqual(ghostPathD(cfg, p), ghostPathD(cfg));
});

test("test_pose_attrs_match_render: live-preview attributes equal what renderSvg writes for the same pose and spring (R72)", async () => {
  const { poseAttrs } = await import("../engine/svg.js");
  const sp = stepSpring(createSpring(), 0.8, 1 / 60);
  for (const t of [0, 0.4, 1.3, 2.9]) {
    const p = pose(t, cfg);
    const svg = renderSvg(cfg, { pose: p, spring: sp });
    const a = poseAttrs(cfg, p, sp);
    assert.ok(svg.includes(`data-pose="rig" transform="${a.rig}"`), "rig " + t);
    assert.ok(svg.includes(`data-pose="eyes" transform="${a.eyes}"`), "eyes " + t);
    assert.ok(svg.includes(`id="ghostBody" d="${a.bodyD}"`), "body " + t);
    assert.ok(svg.includes(`id="ghostRimStroke" d="${a.bodyD}"`), "rim stroke " + t);
    assert.ok(svg.includes(`id="ghostTail" d="${a.rimD}"`), "tail " + t);
    assert.ok(svg.includes(`id="ghostGlowLayer"`) && svg.includes(`opacity="${a.haloOpacity}"`), "halo " + t);
  }
});
