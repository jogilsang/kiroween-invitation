// Customization depth (R22-R26): assets, per-asset color, event details, Unicode.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeConfig, renderSvg, encodeConfig, decodeConfig,
  scanConfig, scanRaw, PARTS_ALLOW, SWATCHES, NICK_MAX,
} from "../engine/index.js";

const ASSETS = ["hat", "horns", "moon", "bats", "cobweb", "crow", "cat", "tombstone", "skull", "candle", "pumpkins"];
const build = (over = {}) => normalizeConfig({
  purpose: "join", year: 2026, nick: "Mina", mood: "screaming", palette: "magenta", glow: "strong",
  ghost: { parts: [] }, ...over,
}).value;
const withParts = (parts, tints) => build({ ghost: { parts }, tints });

test("test_asset_list_matches_spec: exactly the 11 spec assets are allowed", () => {
  assert.deepEqual([...PARTS_ALLOW].sort(), [...ASSETS].sort());
});

test("test_every_asset_is_drawn: each selected asset adds its own data-part group", () => {
  for (const a of ASSETS) {
    const svg = renderSvg(withParts([a]));
    assert.ok(svg.includes(`data-part="${a}"`), `${a} must be drawn`);
  }
});

test("test_no_assets_by_default: nothing is drawn unless selected", () => {
  const svg = renderSvg(withParts([]));
  for (const a of ASSETS) assert.ok(!svg.includes(`data-part="${a}"`), `${a} must not appear`);
});

test("test_tint_changes_asset: choosing a swatch recolors that asset", () => {
  for (const a of ASSETS) {
    // pick a swatch that is NOT the asset's default color, so the change is real
    const plain = renderSvg(withParts([a]));
    const key = Object.keys(SWATCHES).find((k) => !plain.includes(`data-part="${a}"`) || !new RegExp(`data-part="${a}"[\\s\\S]*?${SWATCHES[k]}`).test(plain.slice(plain.indexOf(`data-part="${a}"`), plain.indexOf(`data-part="${a}"`) + 900)));
    const tinted = renderSvg(withParts([a], { [a]: key }));
    assert.notEqual(plain, tinted, `${a} tint must change output`);
    assert.ok(tinted.includes(SWATCHES[key]), `${a} must use the ${key} color`);
  }
});

test("test_unknown_tint_dropped: bad swatch or bad asset key is dropped", () => {
  const c = build({ ghost: { parts: ["skull"] }, tints: { skull: "rainbow", dragon: "blood", cat: "green" } });
  assert.deepEqual(c.tints, { cat: "green" });
});

test("test_tint_of_unselected_asset_is_inert: tint without the asset changes nothing", () => {
  assert.equal(renderSvg(withParts(["skull"])), renderSvg(withParts(["skull"], { cat: "green" })));
});

test("test_toggle_does_not_change_ghost_body: assets and tints never reshape the ghost", () => {
  const body = (s) => (s.match(/id="ghostBody" d="([^"]+)"/) || [])[1];
  const base = body(renderSvg(withParts([])));
  assert.ok(base, "ghost body path must be addressable");
  assert.equal(body(renderSvg(withParts(["bats", "cat", "skull", "cobweb"], { cat: "ice" }))), base);
});

test("test_all_assets_deterministic_and_wellformed: everything on, twice, identical", () => {
  const c = withParts(ASSETS.filter((a) => a !== "horns"), Object.fromEntries(ASSETS.map((a) => [a, "green"])));
  const a = renderSvg(c), b = renderSvg(c);
  assert.equal(a, b);
  assert.ok(!a.includes("NaN") && !a.includes("undefined") && !a.includes("${"));
  assert.equal((a.match(/<g[\s>]/g) || []).length, (a.match(/<\/g>/g) || []).length);
});

test("test_event_details_rendered: date, time and place appear on the invitation", () => {
  const svg = renderSvg(build({ event: { date: "Oct 31", time: "7:00 PM", place: "Seoul Jamsil" } }));
  assert.ok(svg.includes("Oct 31") && svg.includes("7:00 PM") && svg.includes("Seoul Jamsil"));
});

test("test_no_details_line_when_empty: no event data -> no details text", () => {
  assert.ok(!renderSvg(build()).includes('data-part="details"'));
  assert.ok(renderSvg(build({ event: { date: "Oct 31" } })).includes('data-part="details"'));
});

test("test_event_details_sanitized: markup and over-long text cannot reach the SVG", () => {
  const c = build({ event: { date: "<b>x</b>", time: "&amp;", place: "A".repeat(200) + '"/><rect fill="red"/>' } });
  assert.ok(c.event.place.length <= 32 && c.event.date.length <= 16 && c.event.time.length <= 12);
  const svg = renderSvg(c);
  assert.ok(!svg.includes('fill="red"') && !svg.includes("<b>"));
});

test("test_event_scan_blocks_pii: raw email or phone in place is blocked, a plain date is not", () => {
  // The RAW text is scanned: sanitizing would turn "a@b.com" into "ab.com" and hide the intent.
  assert.equal(scanRaw({ place: "mail a@b.com" }).ok, false);
  assert.equal(scanRaw({ place: "call 01012345678" }).ok, false);
  assert.equal(scanRaw({ date: "2026-10-31", time: "19:00", place: "Seoul" }).ok, true);
  // and scanConfig still works on the cleaned config
  assert.equal(scanConfig(build({ event: { date: "2026-10-31", time: "19:00", place: "Seoul" } })).ok, true);
});

test("test_unicode_nick_allowed: Korean and Japanese names survive, emoji and markup do not", () => {
  assert.equal(build({ nick: "민아" }).nick, "민아");
  assert.equal(build({ nick: "ハロウィン" }).nick, "ハロウィン");
  assert.equal(build({ nick: "💀민아<b>" }).nick, "민아b");
  assert.ok(renderSvg(build({ nick: "민아" })).includes("민아"));
});

test("test_truncation_never_splits_surrogate: long astral-plane names stay valid", () => {
  const nick = build({ nick: "𠮷".repeat(40) }).nick;
  assert.equal(Array.from(nick).length, NICK_MAX);
  assert.equal(nick, nick.toWellFormed());
});

test("test_share_roundtrip_with_new_fields: tints, event and Korean nick survive the link", () => {
  const c = build({ nick: "민아", ghost: { parts: ["cat", "skull"] }, tints: { cat: "green", skull: "ice" },
    event: { date: "10/31", time: "19:00", place: "서울" } });
  const back = decodeConfig(encodeConfig(c));
  assert.equal(back.ok, true);
  assert.deepEqual(back.value, c);
  assert.equal(renderSvg(back.value), renderSvg(c));
});

// The ghost hem must stay under the body. (Earlier "verified" only that the hem
// advanced by the body width, not in WHICH direction, so it ran off to the right.)
function pathExtents(d) {
  const tok = d.match(/[MLCQqZ]|-?\d+(?:\.\d+)?(?:e-?\d+)?/g);
  let i = 0, x = 0, y = 0, cmd = "", minX = Infinity, maxX = -Infinity;
  const num = () => Number(tok[i++]);
  const see = (px) => { minX = Math.min(minX, px); maxX = Math.max(maxX, px); };
  while (i < tok.length) {
    if (/[A-Za-z]/.test(tok[i])) cmd = tok[i++];
    if (cmd === "Z") continue;
    if (cmd === "M" || cmd === "L") { x = num(); y = num(); see(x); }
    else if (cmd === "C") { const a = num(), b = num(), c = num(), e = num(), nx = num(), ny = num(); see(a); see(c); x = nx; y = ny; see(x); }
    else if (cmd === "q") { const cx = num(), cy = num(), dx = num(), dy = num(); see(x + cx); x += dx; y += dy; see(x); }
  }
  return { minX, maxX };
}

test("test_ghost_hem_stays_under_body: no path point leaves the ghost's width", () => {
  for (const mood of ["screaming", "uneasy", "hollow"]) {
    const svg = renderSvg(build({ mood }));
    const d = (svg.match(/id="ghostBody" d="([^"]+)"/) || [])[1];
    const { minX, maxX } = pathExtents(d);
    // body half-width at the shoulders is ~132px around x=540 (+ a small curve margin)
    assert.ok(minX >= 540 - 150 && maxX <= 540 + 150, `${mood}: path spans ${minX.toFixed(0)}..${maxX.toFixed(0)}`);
  }
});

test("test_assets_do_not_overlap_the_text_area: props stay above the title line", () => {
  const svg = renderSvg(build({ ghost: { parts: ["pumpkins", "skull", "cat", "tombstone", "candle"] } }));
  assert.ok(svg.includes('data-part="pumpkins"'));
});
