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

// Round 3 (2026-11-09): new probes C1-C4.
cases.push(
  ["C1", "Thai-digit phone-like text in event.place", () => {
    // Thai digits ๐-๙ are \p{Nd} in Unicode; a run of 10+ should match the PII phone pattern.
    const place = "โทร ๐๖๑-๒๓๔-๕๖๗๘"; // 10 Thai digits (with separators)
    const scanResult = scanText(place);
    const c = normalizeConfig({ event: { date: "Oct 31", time: "7 PM", place } }).value;
    return { scanBlocked: !scanResult.ok, hits: scanResult.hits.length, sanitizedPlace: c.event.place };
  }],
  ["C2", "300-character numeric string as year", () => {
    const bigStr = "2".repeat(300);
    const r = normalizeConfig({ year: bigStr });
    return { ok: r.ok, year: r.value.year };
  }],
  ["C3", "share param whose e field is a nested array", () => {
    // Forge a share param where e = [["Oct 31"], "7 PM", "here"] (date is itself an array)
    const forged = Buffer.from(JSON.stringify({
      p: "join", y: 2026, n: "Ghost", pa: [],
      t: {}, e: [["Oct 31", "extra"], "7 PM", "here"],
      m: "screaming", c: "magenta", g: "strong", k: "none", s: "sky"
    })).toString("base64url");
    const d = decodeConfig(forged);
    return {
      ok: d.ok,
      dateIsArray: Array.isArray(d.value.event.date),
      dateValue: d.value.event.date,
      renders: d.value && renderSvg(d.value).startsWith("<svg ")
    };
  }],
  ["C4", "preset id padded with spaces", () => {
    const base = normalizeConfig({}).value;
    const before = base.mood;
    const after = applyPreset(base, "  pirate-crypt  ");
    return { changed: after.mood !== before, mood: after.mood };
  }],
);

// Round 4 (2026-11-09): receiver view — receiverTitle, receiverView, countdownInfo,
// canNativeShare, makeYourOwnUrl, shareText. 20+ probes covering injection,
// forged/malformed ?i= params, countdown edge-cases, native-share guards.
import {
  receiverView,
  receiverTitle,
  receiverActions,
  makeYourOwnUrl,
  countdownInfo,
  canNativeShare,
  shareText,
} from "../engine/index.js";

cases.push(
  // ── Title injection ─────────────────────────────────────────────────────────
  ["D1", "receiverTitle: <script> in nick", () => {
    const cfg = normalizeConfig({ nick: "<script>alert(1)</script>" }).value;
    const title = receiverTitle(cfg);
    return { title, hasScript: title.includes("<script") };
  }],
  ["D2", "receiverTitle: </title> injection attempt", () => {
    const cfg = normalizeConfig({ nick: "</title><script>x</script>" }).value;
    const title = receiverTitle(cfg);
    return { title, hasClosingTitle: title.includes("</title") };
  }],
  ["D3", "receiverTitle: HTML double-quote breaks attribute context", () => {
    // If title were placed in an attribute like data-title="...", a quote would escape.
    // receiverTitle itself: does it allow raw quotes?
    const cfg = normalizeConfig({ nick: 'say "hello"' }).value;
    const title = receiverTitle(cfg);
    return { title, nick: cfg.nick };
  }],
  ["D4", "receiverTitle: &lt; entity bypass attempt", () => {
    // Some filters only strip literal < but not the entity; check both paths.
    const cfg = normalizeConfig({ nick: "&lt;script&gt;x&lt;/script&gt;" }).value;
    const title = receiverTitle(cfg);
    return { title, nick: cfg.nick };
  }],
  ["D5", "receiverTitle: RTL override U+202E in nick", () => {
    const cfg = normalizeConfig({ nick: "Alice\u202EEcilA" }).value;
    const title = receiverTitle(cfg);
    return { title, nick: cfg.nick, hasRTL: title.includes("\u202E") };
  }],
  ["D6", "receiverTitle: zero-width chars (U+200B, U+FEFF) in nick", () => {
    const cfg = normalizeConfig({ nick: "G\u200Bhost\uFEFF" }).value;
    const title = receiverTitle(cfg);
    return { title, nick: cfg.nick, hasZeroWidth: title.includes("\u200B") || title.includes("\uFEFF") };
  }],
  ["D7", "receiverTitle: 1000-char nickname", () => {
    const cfg = normalizeConfig({ nick: "x".repeat(1000) }).value;
    const title = receiverTitle(cfg);
    return { titleLen: title.length, nickLen: cfg.nick.length };
  }],
  ["D8", "receiverTitle: emoji-only nickname (stripped → empty fallback)", () => {
    const cfg = normalizeConfig({ nick: "💀🎃👻" }).value;
    const title = receiverTitle(cfg);
    return { nick: cfg.nick, title };
  }],

  // ── receiverView: forged / malformed ?i= params ──────────────────────────
  ["D9", "receiverView: garbage string (not base64)", () => {
    const v = receiverView("?i=!!!GARBAGE###");
    return { mode: v.mode, corrupt: v.corrupt };
  }],
  ["D10", "receiverView: valid base64url of bad JSON payload", () => {
    // base64url("not json at all")
    const badB64 = "bm90IGpzb24gYXQgYWxs";
    const v = receiverView(`?i=${badB64}`);
    return { mode: v.mode, corrupt: v.corrupt };
  }],
  ["D11", "receiverView: 100 KB payload (huge forged param)", () => {
    const huge = "A".repeat(100_000);
    const v = receiverView(`?i=${huge}`);
    return { mode: v.mode, corrupt: v.corrupt };
  }],
  ["D12", "receiverView: duplicate ?i= param (?i=A&i=B) — which wins?", () => {
    // URLSearchParams.get('i') returns the FIRST value of key 'i'.
    // Probe: pass a valid encoded config as first i, garbage as second.
    const goodParam = encodeConfig(normalizeConfig({ nick: "ghost" }).value);
    const search = `?i=${goodParam}&i=GARBAGE`;
    const v = receiverView(search);
    return { mode: v.mode, nick: v.config && v.config.nick };
  }],
  ["D13", "receiverView: hash fragment mixed in (?i=X#frag)", () => {
    // location.search in a browser stops at #; but we test the engine directly with
    // the hash appended to the search string — URLSearchParams should not include it.
    const good = encodeConfig(normalizeConfig({ nick: "bat" }).value);
    const v = receiverView(`?i=${good}#frag`);
    return { mode: v.mode, nick: v.config && v.config.nick };
  }],
  ["D14", "receiverView: #?i=X (hash contains the param, not the search)", () => {
    // If someone pastes a fragment-only URL, search string is empty — no i param.
    const good = encodeConfig(normalizeConfig({ nick: "cat" }).value);
    const v = receiverView(`#?i=${good}`);
    return { mode: v.mode, corrupt: v.corrupt };
  }],
  ["D15", "receiverView: search string without leading '?' (e.g. 'i=X')", () => {
    const good = encodeConfig(normalizeConfig({ nick: "skull" }).value);
    // URLSearchParams can parse 'i=X' without '?'
    const v = receiverView(`i=${good}`);
    return { mode: v.mode, nick: v.config && v.config.nick };
  }],
  ["D16", "receiverView: i= with spaces (?i=A+B+C and ?i=A%20B)", () => {
    // URLSearchParams decodes + as space and %20 as space in values; neither is valid base64url.
    const v1 = receiverView("?i=A+B");
    const v2 = receiverView("?i=A%20B");
    return { plusMode: v1.mode, plusCorrupt: v1.corrupt, pctMode: v2.mode, pctCorrupt: v2.corrupt };
  }],

  // ── countdownInfo: edge cases ────────────────────────────────────────────
  ["D17", "countdownInfo: year 1 in config (far past)", () => {
    // parseEventDate requires year in 2000..2100; year 1 should yield null from buildIcs.
    const cfg = normalizeConfig({ year: 2026, event: { date: "Oct 31", time: "7 PM" } }).value;
    // Manually supply a 'today' that is far in the future (year 9999 equiv via big numbers).
    const today = { y: 9999, m: 1, d: 1 };
    const info = countdownInfo(cfg, today);
    return { info }; // should be null (event is in the past relative to 9999-01-01)
  }],
  ["D18", "countdownInfo: event date Feb 29 on a non-leap year", () => {
    const cfg = normalizeConfig({ year: 2025, event: { date: "Feb 29", time: "7 PM" } }).value;
    const today = { y: 2025, m: 2, d: 1 };
    const info = countdownInfo(cfg, today);
    return { info }; // Feb 29 2025 is invalid → parseEventDate returns null → countdownInfo null
  }],
  ["D19", "countdownInfo: 'today' missing required fields (null, partial, strings)", () => {
    const cfg = normalizeConfig({ year: 2026, event: { date: "Oct 31" } }).value;
    return {
      nullToday: countdownInfo(cfg, null),
      emptyToday: countdownInfo(cfg, {}),
      stringFields: countdownInfo(cfg, { y: "2026", m: "10", d: "31" }),
      partialToday: countdownInfo(cfg, { y: 2026, m: 10 }),
    };
  }],
  ["D20", "countdownInfo: today === event date (should say Today/Tonight)", () => {
    const cfg = normalizeConfig({ year: 2026, event: { date: "Oct 31", time: "7 PM" } }).value;
    const today = { y: 2026, m: 10, d: 31 };
    const info = countdownInfo(cfg, today);
    return { info };
  }],
  ["D21", "countdownInfo: far future date (year 9999)", () => {
    // parseEventDate rejects year > 2100; countdownInfo should return null.
    const cfg = normalizeConfig({ year: 2100, event: { date: "2999-12-31" } }).value;
    const today = { y: 2026, m: 1, d: 1 };
    const info = countdownInfo(cfg, today);
    return { info };
  }],

  // ── canNativeShare: hostile/unusual navigator values ─────────────────────
  ["D22", "canNativeShare: null / undefined", () => ({
    nullNav: canNativeShare(null),
    undefNav: canNativeShare(undefined),
  })],
  ["D23", "canNativeShare: {share: true} (non-function, truthy property)", () => ({
    result: canNativeShare({ share: true }),
  })],
  ["D24", "canNativeShare: Proxy-like object with 'share' getter that throws", () => {
    let threw = false;
    const hostile = { get share() { threw = true; throw new Error("spy"); } };
    let result;
    try { result = canNativeShare(hostile); } catch { result = "THREW"; }
    return { result, threw };
  }],
  ["D25", "canNativeShare: function-like object (share is arrow fn)", () => ({
    result: canNativeShare({ share: () => {} }),
  })],

  // ── makeYourOwnUrl: hostile inputs ───────────────────────────────────────
  ["D26", "makeYourOwnUrl: javascript: origin", () => ({
    result: makeYourOwnUrl("javascript:alert(1)", "/app/index.html"),
  })],
  ["D27", "makeYourOwnUrl: non-string args (number, null, object)", () => ({
    numNum: makeYourOwnUrl(8080, "/app/"),
    nullNull: makeYourOwnUrl(null, null),
    objStr: makeYourOwnUrl({}, "/app/"),
  })],
  ["D28", "makeYourOwnUrl: pathname with query string stripped", () => ({
    result: makeYourOwnUrl("https://kiroween.example.com", "/app/index.html?i=SOMETOKEN"),
  })],
  ["D29", "makeYourOwnUrl: origin with embedded newline (header-injection style)", () => ({
    result: makeYourOwnUrl("https://evil.com\r\nX-Injected: yes", "/app/"),
  })],

  // ── shareText: hostile config ─────────────────────────────────────────────
  ["D30", "shareText: nick with script tags", () => {
    const cfg = normalizeConfig({ nick: "<script>evil</script>" }).value;
    const text = shareText(cfg);
    return { text, hasScript: text.includes("<script") };
  }],
);

for (const [id, desc, fn] of cases) {
  let actual;
  try { actual = fn(); } catch (e) { actual = "THREW: " + (e && e.message); }
  console.log(`${id}\t${desc}\t${JSON.stringify(actual)}`);
}
