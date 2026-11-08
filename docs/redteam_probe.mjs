// docs/redteam_probe.mjs — run deceptive inputs through the SVG engine and
// print the actual outcome. Writes RED_TEAM.md from real behavior, not guesses.
// Run: node docs/redteam_probe.mjs
import {
  normalizeConfig,
  renderSvg,
  decodeConfig,
  encodeConfig,
  scanText,
  scanConfig,
  buildIcs,
  formatSize,
  remixConfig,
  applyPreset,
} from "../engine/index.js";

const cases = [
  ["A1", "XSS in nickname (<script>)", () => {
    const raw = "<script>alert(1)</script>";
    const c = normalizeConfig({ nick: raw }).value;
    const svg = renderSvg(c);
    return { nick: c.nick, scan: scanText(raw).ok, svgHasScript: svg.includes("<script") };
  }],
  ["A2", "SVG tag injection via nick", () => {
    const raw = '"/><rect width="9999" height="9999" fill="red"/>';
    const c = normalizeConfig({ nick: raw }).value;
    const svg = renderSvg(c);
    return { nick: c.nick, injectedRect: svg.includes('fill="red"') };
  }],
  ["A3", "javascript: URI in nick", () => ({ scan: scanText("javascript:alert(1)").ok })],
  ["A4", "year as string '2026'", () => { const r = normalizeConfig({ year: "2026" }); return { year: r.value.year, ok: r.ok }; }],
  ["A5", "year 9999", () => normalizeConfig({ year: 9999 }).value.year],
  ["A6", "year -1", () => normalizeConfig({ year: -1 }).value.year],
  ["A7", "year float 2026.9", () => normalizeConfig({ year: 2026.9 }).value.year],
  ["A8", "purpose __proto__", () => normalizeConfig({ purpose: "__proto__" }).value.purpose],
  ["A9", "unknown mood 'demonic'", () => normalizeConfig({ mood: "demonic" }).value.mood],
  ["A10", "unknown palette 'rgb(0,0,0)'", () => normalizeConfig({ palette: "rgb(0,0,0)" }).value.palette],
  ["A11", "unknown glow 'blinding'", () => normalizeConfig({ glow: "blinding" }).value.glow],
  ["A12", "parts with injection ['moon','<b>']", () => normalizeConfig({ ghost: { parts: ["moon", "<b>"] } }).value.ghost.parts],
  ["A13", "1000-char nickname", () => normalizeConfig({ nick: "a".repeat(1000) }).value.nick.length],
  ["A14", "emoji nickname", () => JSON.stringify(normalizeConfig({ nick: "💀💀💀" }).value.nick)],
  ["A15", "newline in nickname a\\nb", () => JSON.stringify(normalizeConfig({ nick: "a\nb" }).value.nick)],
  ["A16", "forged share param (garbage)", () => { const d = decodeConfig("!!!notbase64$$$"); return { ok: d.ok, purpose: d.value.purpose, renders: renderSvg(d.value).startsWith("<svg ") }; }],
  ["A17", "valid b64 of bad JSON", () => { const d = decodeConfig("eyJ4Ijp9"); return { ok: d.ok, renders: renderSvg(d.value).startsWith("<svg ") }; }],
  ["A18", "null config", () => { const c = normalizeConfig(null).value; return { purpose: c.purpose, renders: renderSvg(c).startsWith("<svg ") }; }],
  ["A19", "array as config", () => normalizeConfig([1, 2, 3]).value.purpose],
  ["A20", "email in nickname (PII)", () => ({ scan: scanText("ping me a@b.com").ok })],
  ["A21", "phone digits in nickname (PII)", () => ({ scan: scanText("call 01012345678").ok })],
  ["A22", "ampersand/quote in nick escaped in SVG", () => {
    const c = normalizeConfig({ nick: 'A & B' }).value;
    const svg = renderSvg(c);
    return { nick: c.nick, svgWellFormed: svg.startsWith("<svg ") && !svg.includes("${") };
  }],
];

// Round 2 (2026-11-05): costume, scene, tints, event, export format, .ics, remix, preset.
const b64 = (o) => encodeConfig(normalizeConfig(o).value);
const ok = (svg) => svg.startsWith("<svg ") && !svg.includes("<script") && !svg.includes("${");
cases.push(
  ["B1", "costume '__proto__' / '<x>' / 'DRACULA'", () => ["__proto__", "<x>", "DRACULA"].map((v) => normalizeConfig({ costume: v }).value.costume)],
  ["B2", "scene 'constructor' / 'GRAVEYARD'", () => ["constructor", "GRAVEYARD"].map((v) => normalizeConfig({ scene: v }).value.scene)],
  ["B3", "tints with __proto__ key and 'constructor' swatch", () => {
    const c = normalizeConfig(JSON.parse('{"tints":{"__proto__":"orange","moon":"constructor","bats":{"a":1}}}')).value;
    return { tints: c.tints, polluted: ({}).orange !== undefined, renders: ok(renderSvg(c)) };
  }],
  ["B4", "tints for an asset that is not selected", () => normalizeConfig({ ghost: { parts: ["moon"] }, tints: { skull: "blood" } }).value.tints],
  ["B5", "event string instead of object", () => normalizeConfig({ event: "Oct 31" }).value.event],
  ["B6", "event fields as number / object / array", () => normalizeConfig({ event: { date: 1031, time: { a: 1 }, place: [1] } }).value.event],
  ["B7", ".ics header injection through date", () => { const t = buildIcs(normalizeConfig({ year: 2026, event: { date: "Oct 31\r\nBEGIN:VEVENT", time: "7 PM", place: "x" } }).value); return t === null ? "null (no entry)" : t.split("\r\n").filter((l) => l.startsWith("BEGIN:VEVENT")).length; }],
  ["B8", ".ics injection through place", () => { const t = buildIcs(normalizeConfig({ year: 2026, event: { date: "Oct 31", time: "7 PM", place: "x\r\nATTENDEE:evil" } }).value); return t.includes("\r\nATTENDEE"); }],
  ["B9", ".ics impossible date Feb 30 / month 13 / 31 Apr", () => ["Feb 30", "13/1", "Apr 31"].map((d) => buildIcs(normalizeConfig({ year: 2026, event: { date: d } }).value))],
  ["B10", "export format '__proto__' / '../x' / null / 7", () => ["__proto__", "../x", null, 7].map((f) => { const z = formatSize(f); return `${z.width}x${z.height}`; })],
  ["B11", "renderSvg with unknown format option", () => ok(renderSvg(normalizeConfig({}).value, { format: "<script>" }))],
  ["B12", "share param: 1 MB of garbage", () => { const d = decodeConfig("A".repeat(1_000_000)); return { ok: d.ok, renders: ok(renderSvg(d.value)) }; }],
  ["B13", "share param: JSON with __proto__ payload", () => { const d = decodeConfig(Buffer.from('{"__proto__":{"polluted":1},"nick":"x"}').toString("base64url")); return { polluted: ({}).polluted !== undefined, nick: d.value.nick }; }],
  ["B14", "share param: 5000 parts", () => { const d = decodeConfig(Buffer.from(JSON.stringify({ ghost: { parts: Array(5000).fill("moon") } })).toString("base64url")); return d.value.ghost.parts.length; }],
  ["B15", "remix with NaN / Infinity / object / string seed", () => [NaN, Infinity, {}, "x", null].map((sd) => ok(renderSvg(remixConfig(normalizeConfig({}).value, sd))))],
  ["B16", "remix keeps nick/year/event", () => { const c = normalizeConfig({ nick: "민아", year: 2031, event: { date: "Oct 31" } }).value; const r = remixConfig(c, 7); return r.nick === c.nick && r.year === c.year && r.event.date === "Oct 31"; }],
  ["B17", "preset id '__proto__' / 'constructor' / object", () => ["__proto__", "constructor", {}].map((id) => applyPreset(normalizeConfig({}).value, id) !== undefined)],
  ["B18", "RTL override and zero-width chars in nick", () => JSON.stringify(normalizeConfig({ nick: "a\u202Eb\u200Bc" }).value.nick)],
  ["B19", "hat + horns + dracula all at once", () => { const c = normalizeConfig({ ghost: { parts: ["hat", "horns"] }, costume: "dracula" }).value; return { parts: c.ghost.parts, renders: ok(renderSvg(c)) }; }],
  ["B20", "every asset + every swatch + long Korean event, all formats", () => { const c = normalizeConfig({ nick: "가나다라마바사아자차카타파하".repeat(3), ghost: { parts: ["moon", "bats", "cobweb", "crow", "cat", "tombstone", "skull", "candle", "pumpkins", "hat"] }, event: { date: "10월 31일", time: "오후 7시", place: "서울 마포구 합정동 어딘가 지하 클럽" } }).value; return ["square", "story", "wide"].map((f) => ok(renderSvg(c, { format: f }))); }],
);

for (const [id, desc, fn] of cases) {
  let actual;
  try { actual = fn(); } catch (e) { actual = "THREW: " + (e && e.message); }
  console.log(`${id}\t${desc}\t${JSON.stringify(actual)}`);
}
