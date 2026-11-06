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
  formatSize,
  PARTS_ALLOW,
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
  return cfg;
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

function boot() {
  $("app").hidden = false;
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
  buildAssetRows();
  buildCostumeTint();
  for (const el of ["costume", "costumeTint", "scene", "format"]) $(el).addEventListener("change", render);
  for (const el of ["year", "nick", "evDate", "evTime", "evPlace", "mood", "palette", "glow"]) $(el).addEventListener("input", onInput);
  $("savePng").addEventListener("click", savePng);
  $("copyLink").addEventListener("click", copyLink);
  $("saveCfg").addEventListener("click", saveCfg);
  $("remix").addEventListener("click", remix);

  writeUi(initialConfig());
  render();
}

boot();
