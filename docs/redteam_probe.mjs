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

for (const [id, desc, fn] of cases) {
  let actual;
  try { actual = fn(); } catch (e) { actual = "THREW: " + (e && e.message); }
  console.log(`${id}\t${desc}\t${JSON.stringify(actual)}`);
}
