// app/main.js — UI only. Calls the engine; holds state, SVG preview, PNG export.
// The engine decides everything about the invitation; this file never does.

import {
  normalizeConfig,
  renderSvg,
  encodeConfig,
  decodeConfig,
  scanRaw,
  buildInviteText,
  remixConfig,
  PRESETS,
  applyPreset,
  buildIcs,
  formatSize,
  PARTS_ALLOW,
  receiverView,
  receiverTitle,
  receiverActions,
  makeYourOwnUrl,
  countdownInfo,
  canNativeShare,
  shareText,
  SWATCHES,
  CANVAS,
} from "../engine/index.js";

const LS_KEY = "ascii-invite:config";
const $ = (id) => document.getElementById(id);

// The raw (not yet sanitized) text the user typed. Scanned BEFORE sanitizing so
// an email or markup is blocked instead of being silently rewritten.
function readRaw() {
  return { nick: $("nick").value, date: $("evDate").value, time: $("evTime").value, place: $("evPlace").value };
}

function readUi() {
  const purpose = document.querySelector('#purpose button[aria-checked="true"]')?.dataset.val || "join";
  const parts = [...document.querySelectorAll("#assets input[type=checkbox]:checked")].map((c) => c.value);
  const tints = {};
  for (const sel of document.querySelectorAll("#assets select")) if (sel.value) tints[sel.dataset.asset] = sel.value;
  if ($("costume").value !== "none" && $("costumeTint").value) tints[$("costume").value] = $("costumeTint").value;
  return normalizeConfig({
    purpose,
    year: parseInt($("year").value, 10),
    nick: $("nick").value,
    event: { date: $("evDate").value, time: $("evTime").value, place: $("evPlace").value },
    ghost: { parts },
    tints,
    mood: $("mood").value,
    palette: $("palette").value,
    glow: $("glow").value,
    costume: $("costume").value,
    scene: $("scene").value,
  }).value;
}

// Build one row per asset from the engine's allow-list: checkbox + swatch select.
function buildCostumeTint() {
  for (const k of Object.keys(SWATCHES)) $("costumeTint").add(new Option(k, k));
}

function buildAssetRows() {
  const box = $("assets");
  for (const id of PARTS_ALLOW) {
    const row = document.createElement("div");
    row.className = "asset";
    const label = document.createElement("label");
    const cb = document.createElement("input");
    cb.type = "checkbox"; cb.value = id;
    label.append(cb, " " + id);
    const sel = document.createElement("select");
    sel.dataset.asset = id;
    sel.setAttribute("aria-label", `${id} color`);
    sel.add(new Option("default", ""));
    for (const k of Object.keys(SWATCHES)) sel.add(new Option(k, k));
    row.append(label, sel);
    box.append(row);
    cb.addEventListener("change", render);
    sel.addEventListener("change", render);
  }
}

// Preset gallery: one thumbnail per engine preset, rendered from a neutral config.
function buildPresets() {
  const box = $("presets");
  const neutral = normalizeConfig({ purpose: "join", year: 2026, nick: "" }).value;
  for (const p of PRESETS) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "preset";
    b.dataset.preset = p.id;
    b.setAttribute("aria-label", `Apply the ${p.name} look`);
    // An <img> keeps each thumbnail's SVG ids (bg, fog, ghostGlow...) out of the page.
    // Inlined, seven SVGs shared one set of ids and every palette looked like the first one.
    const thumb = document.createElement("span");
    thumb.className = "thumb";
    const img = document.createElement("img");
    img.alt = "";
    img.setAttribute("aria-hidden", "true");
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(renderSvg(applyPreset(neutral, p.id)));
    thumb.append(img);
    const name = document.createElement("span");
    name.className = "pname";
    name.textContent = p.name;
    b.append(thumb, name);
    b.addEventListener("click", () => {
      writeUi(applyPreset(readUi(), p.id));
      render();
      setHint(`${p.name} look applied. Your text stays as it was.`);
    });
    box.append(b);
  }
}

function writeUi(cfg) {
  for (const b of document.querySelectorAll("#purpose button")) {
    const on = b.dataset.val === cfg.purpose;
    b.setAttribute("aria-checked", String(on));
    b.setAttribute("tabindex", on ? "0" : "-1"); // roving tabindex (radiogroup)
  }
  $("year").value = cfg.year;
  $("nick").value = cfg.nick;
  $("mood").value = cfg.mood;
  $("palette").value = cfg.palette;
  $("glow").value = cfg.glow;
  for (const c of document.querySelectorAll("#assets input[type=checkbox]")) {
    c.checked = cfg.ghost.parts.includes(c.value);
  }
  for (const sel of document.querySelectorAll("#assets select")) sel.value = cfg.tints[sel.dataset.asset] || "";
  $("costume").value = cfg.costume;
  $("scene").value = cfg.scene;
  $("costumeTint").value = cfg.costume !== "none" ? (cfg.tints[cfg.costume] || "") : "";
  $("evDate").value = cfg.event.date;
  $("evTime").value = cfg.event.time;
  $("evPlace").value = cfg.event.place;
}

function setHint(msg) { $("hint").textContent = msg || ""; }

function render() {
  const cfg = readUi();
  const format = $("format").value;
  const { width, height } = formatSize(format);
  $("art").style.aspectRatio = `${width} / ${height}`;
  $("art").style.maxWidth = format === "story" ? "304px" : format === "wide" ? "760px" : "540px";
  $("art").innerHTML = renderSvg(cfg, { format });
  const meta = buildInviteText(cfg).meta;
  $("art").setAttribute("aria-label", `${meta.purpose} invitation, ${meta.banner}${cfg.nick ? ", " + cfg.nick : ""}`);
  syncIcsButton(cfg);
  return cfg;
}

const ICS_HELP = "Calendar needs a date like Oct 31, 10/31 or 10월 31일 and a time like 7:00 PM, 19:00 or 오후 7시.";

// The calendar button is enabled only when the date (and time, if given) can be read.
function syncIcsButton(cfg) {
  const ok = buildIcs(cfg) !== null;
  const btn = $("saveIcs");
  btn.disabled = !ok;
  btn.title = ok ? "Download a calendar entry" : ICS_HELP;
  // The tooltip never shows on a phone, so the reason is also written on the page.
  const hasDate = cfg.event && cfg.event.date;
  $("icsNote").textContent = ok || !hasDate ? "" : ICS_HELP;
}

let debounce;
function onInput() { clearTimeout(debounce); debounce = setTimeout(render, 60); }

// Rasterize the current SVG to PNG via an Image + canvas.
function savePng() {
  const cfg = readUi();
  if (!scanRaw(readRaw()).ok) { setHint("Blocked: the text contains an email, phone number or unsafe content."); return; }
  const format = $("format").value;
  const { width, height } = formatSize(format);
  const svg = renderSvg(cfg, { format });
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);
    URL.revokeObjectURL(url);
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `kiroween-${cfg.year}-${cfg.purpose}-${format}.png`;
    a.click();
    setHint("Saved PNG.");
  };
  img.onerror = () => { URL.revokeObjectURL(url); setHint("Could not rasterize image."); };
  img.src = url;
}

async function copyLink() {
  const cfg = readUi();
  if (!scanRaw(readRaw()).ok) { setHint("Blocked: the text contains an email, phone number or unsafe content."); return; }
  const link = `${location.origin}${location.pathname}?i=${encodeConfig(cfg)}`;
  try { await navigator.clipboard.writeText(link); setHint("Share link copied."); }
  catch { setHint("Copy this link: " + link); }
}

// Remix: the ENGINE is pure and takes a seed; only the app picks a random one.
// The result is an ordinary config, so the share link reproduces it exactly.
function remix() {
  const seed = crypto.getRandomValues(new Uint32Array(1))[0];
  writeUi(remixConfig(readUi(), seed));
  render();
  setHint("New look. Copy the share link to keep this exact one.");
}

function saveIcs() {
  const cfg = readUi();
  if (!scanRaw(readRaw()).ok) { setHint("Blocked: the text contains an email, phone number or unsafe content."); return; }
  const text = buildIcs(cfg);
  if (!text) { setHint("Could not read that date. Try Oct 31, 10/31 or 10월 31일."); return; }
  const url = URL.createObjectURL(new Blob([text], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url; a.download = `kiroween-${cfg.year}.ics`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  setHint("Calendar file saved.");
}

function saveCfg() {
  localStorage.setItem(LS_KEY, encodeConfig(readUi()));
  setHint("Config saved on this device.");
}

function initialConfig() {
  const param = new URLSearchParams(location.search).get("i");
  if (param) {
    const dec = decodeConfig(param);
    if (!dec.ok) setHint("Share link was corrupt — showing a default invitation.");
    return dec.value;
  }
  const saved = localStorage.getItem(LS_KEY);
  if (saved) { const dec = decodeConfig(saved); if (dec.ok) return dec.value; }
  return normalizeConfig({ purpose: "join", year: 2026, nick: "" }).value;
}

// ---- Receiver view (R60-R65): someone who opened a share link sees the card, not the tool ----
const BASE_TITLE = document.title;

function shareUrl(cfg) { return `${location.origin}${location.pathname}?i=${encodeConfig(cfg)}`; }

async function nativeShare(cfg, hintEl) {
  try { await navigator.share({ title: shareText(cfg), text: shareText(cfg), url: shareUrl(cfg) }); }
  catch (e) { if (!e || e.name !== "AbortError") hintEl.textContent = "Sharing did not work here. Use Copy link."; }
}

function showReceiver(cfg) {
  const now = new Date();
  const info = countdownInfo(cfg, { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() });
  const acts = receiverActions(cfg);
  const hint = $("recvHint");
  document.title = receiverTitle(cfg);
  $("recvTitle").textContent = cfg.nick ? `${cfg.nick} invites you` : "You are summoned";
  $("recvCount").textContent = info ? info.text : "";
  const meta = buildInviteText(cfg).meta;
  $("recvArt").innerHTML = renderSvg(cfg, { format: "square" });
  $("recvArt").setAttribute("aria-label", `${meta.purpose} invitation, ${meta.banner}${cfg.nick ? ", " + cfg.nick : ""}`);
  $("recvOwn").href = makeYourOwnUrl(location.origin, location.pathname);
  $("recvCal").hidden = !acts.calendar;
  $("recvShare").hidden = !canNativeShare(navigator);
  $("recvCal").addEventListener("click", () => {
    const text = buildIcs(cfg);
    if (!text) { hint.textContent = "Could not read that date."; return; }
    const url = URL.createObjectURL(new Blob([text], { type: "text/calendar;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = `kiroween-${cfg.year}.ics`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    hint.textContent = "Calendar file saved.";
  });
  $("recvShare").addEventListener("click", () => nativeShare(cfg, hint));
  $("recvCopy").addEventListener("click", async () => {
    const link = shareUrl(cfg);
    try { await navigator.clipboard.writeText(link); hint.textContent = "Link copied."; }
    catch { hint.textContent = "Copy this link: " + link; }
  });
  $("recvEdit").addEventListener("click", () => {
    $("recv").hidden = true;
    $("app").hidden = false;
    document.title = BASE_TITLE;
    render();
    $("nick").focus(); // keyboard users land in the editor, not on a removed button
  });
  $("recv").hidden = false;
  $("recvTitle").focus({ preventScroll: true });
}

function boot() {
  const view = receiverView(location.search);
  $("app").hidden = view.mode === "receiver";
  if ($("shareNative")) $("shareNative").hidden = !canNativeShare(navigator);
  const radios = [...document.querySelectorAll("#purpose button")];
  const select = (b, focus) => {
    for (const o of radios) { o.setAttribute("aria-checked", "false"); o.setAttribute("tabindex", "-1"); }
    b.setAttribute("aria-checked", "true");
    b.setAttribute("tabindex", "0");
    if (focus) b.focus();
    render();
  };
  for (const b of radios) {
    b.addEventListener("click", () => select(b, false));
    // Keyboard navigation for the radiogroup (found by the Crew review).
    b.addEventListener("keydown", (e) => {
      const i = radios.indexOf(b);
      let next = null;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") next = radios[(i + 1) % radios.length];
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = radios[(i - 1 + radios.length) % radios.length];
      if (next) { e.preventDefault(); select(next, true); }
    });
  }
  buildPresets();
  buildAssetRows();
  buildCostumeTint();
  for (const el of ["costume", "costumeTint", "scene", "format"]) $(el).addEventListener("change", render);
  for (const el of ["year", "nick", "evDate", "evTime", "evPlace", "mood", "palette", "glow"]) $(el).addEventListener("input", onInput);
  $("savePng").addEventListener("click", savePng);
  $("copyLink").addEventListener("click", copyLink);
  $("saveCfg").addEventListener("click", saveCfg);
  $("saveIcs").addEventListener("click", saveIcs);
  $("remix").addEventListener("click", remix);

  $("shareNative").addEventListener("click", () => nativeShare(readUi(), $("hint")));

  writeUi(initialConfig());
  const cfgNow = render();
  if (view.mode === "receiver") showReceiver(cfgNow);
}

boot();
