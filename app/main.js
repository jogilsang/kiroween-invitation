// app/main.js — UI only. Calls the engine; holds state, canvas export, clipboard.
// The engine decides everything about the invitation; this file never does.

import {
  normalizeConfig,
  renderAscii,
  encodeConfig,
  decodeConfig,
  scanConfig,
} from "../engine/index.js";

const LS_KEY = "ascii-invite:config";
const $ = (id) => document.getElementById(id);

// Load grids once (JSON asset). Kept out of the engine to keep it pure.
let grids = null;

// --- UI state <-> config ---
function readUi() {
  const purpose = document.querySelector('#purpose button[aria-checked="true"]')?.dataset.val || "join";
  const parts = [...document.querySelectorAll(".parts input:checked")].map((c) => c.value);
  return normalizeConfig({
    purpose,
    year: parseInt($("year").value, 10),
    nick: $("nick").value,
    ghost: { face: $("face").value, parts, theme: "dark" },
    density: $("density").value,
  }).value;
}

function writeUi(cfg) {
  for (const b of document.querySelectorAll("#purpose button")) {
    b.setAttribute("aria-checked", String(b.dataset.val === cfg.purpose));
  }
  $("year").value = cfg.year;
  $("nick").value = cfg.nick;
  $("face").value = cfg.ghost.face;
  $("density").value = cfg.density;
  for (const c of document.querySelectorAll(".parts input")) {
    c.checked = cfg.ghost.parts.includes(c.value);
  }
}

function setHint(msg) { $("hint").textContent = msg || ""; }

// --- render ---
function render() {
  const cfg = readUi();
  const art = renderAscii(cfg, grids);
  $("art").textContent = art;
  $("alt").textContent = `Invitation: ${cfg.purpose} · KIROWEEN ${cfg.year}${cfg.nick ? " · " + cfg.nick : ""}`;
  return cfg;
}

let debounce;
function onInput() {
  clearTimeout(debounce);
  debounce = setTimeout(render, 80);
}

// --- actions ---
function savePng() {
  const cfg = readUi();
  const scan = scanConfig(cfg);
  if (!scan.ok) { setHint("Blocked: nickname contains unsafe content."); return; }
  const text = renderAscii(cfg, grids);
  const lines = text.split("\n");
  const fontPx = 12, lineH = 12, padding = 20;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  ctx.font = `${fontPx}px ui-monospace, Menlo, monospace`;
  const charW = ctx.measureText("M").width;
  canvas.width = Math.ceil(charW * (lines[0]?.length || 40) + padding * 2);
  canvas.height = Math.ceil(lineH * lines.length + padding * 2);
  const c2 = canvas.getContext("2d");
  c2.fillStyle = "#060309";
  c2.fillRect(0, 0, canvas.width, canvas.height);
  c2.font = `${fontPx}px ui-monospace, Menlo, monospace`;
  c2.textBaseline = "top";
  c2.fillStyle = "#ff7a18";
  lines.forEach((ln, i) => c2.fillText(ln, padding, padding + i * lineH));
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = `kiroween-${cfg.year}-${cfg.purpose}.png`;
  a.click();
  setHint("Saved PNG.");
}

async function copyLink() {
  const cfg = readUi();
  const scan = scanConfig(cfg);
  if (!scan.ok) { setHint("Blocked: nickname contains unsafe content."); return; }
  const url = `${location.origin}${location.pathname}?i=${encodeConfig(cfg)}`;
  try {
    await navigator.clipboard.writeText(url);
    setHint("Share link copied.");
  } catch {
    setHint("Copy this link: " + url);
  }
}

function saveCfg() {
  const cfg = readUi();
  localStorage.setItem(LS_KEY, encodeConfig(cfg));
  setHint("Config saved on this device.");
}

// --- init ---
function initialConfig() {
  const param = new URLSearchParams(location.search).get("i");
  if (param) {
    const dec = decodeConfig(param);
    if (!dec.ok) setHint("Share link was corrupt — showing a default invitation.");
    return dec.value;
  }
  const saved = localStorage.getItem(LS_KEY);
  if (saved) {
    const dec = decodeConfig(saved);
    if (dec.ok) return dec.value;
  }
  return normalizeConfig({ purpose: "join", year: 2026, nick: "", density: "mid" }).value;
}

async function boot() {
  try {
    const res = await fetch("../assets/grids.json");
    grids = await res.json();
  } catch (e) {
    $("app").hidden = false;
    setHint("Could not load art assets.");
    return;
  }
  $("app").hidden = false;

  // seg buttons
  for (const b of document.querySelectorAll("#purpose button")) {
    b.addEventListener("click", () => {
      for (const o of document.querySelectorAll("#purpose button")) o.setAttribute("aria-checked", "false");
      b.setAttribute("aria-checked", "true");
      render();
    });
  }
  for (const el of ["year", "nick", "face", "density"]) $(el).addEventListener("input", onInput);
  for (const c of document.querySelectorAll(".parts input")) c.addEventListener("change", render);
  $("savePng").addEventListener("click", savePng);
  $("copyLink").addEventListener("click", copyLink);
  $("saveCfg").addEventListener("click", saveCfg);

  writeUi(initialConfig());
  render();
}

boot();
