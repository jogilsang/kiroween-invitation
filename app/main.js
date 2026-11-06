// app/main.js — UI only. Calls the engine; holds state, SVG preview, PNG export.
// The engine decides everything about the invitation; this file never does.

import {
  normalizeConfig,
  renderSvg,
  encodeConfig,
  decodeConfig,
  scanConfig,
  buildInviteText,
  CANVAS,
} from "../engine/index.js";

const LS_KEY = "ascii-invite:config";
const $ = (id) => document.getElementById(id);

function readUi() {
  const purpose = document.querySelector('#purpose button[aria-checked="true"]')?.dataset.val || "join";
  const parts = [...document.querySelectorAll(".parts input:checked")].map((c) => c.value);
  return normalizeConfig({
    purpose,
    year: parseInt($("year").value, 10),
    nick: $("nick").value,
    ghost: { parts },
    mood: $("mood").value,
    palette: $("palette").value,
    glow: $("glow").value,
  }).value;
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
  for (const c of document.querySelectorAll(".parts input")) {
    c.checked = cfg.ghost.parts.includes(c.value);
  }
}

function setHint(msg) { $("hint").textContent = msg || ""; }

function render() {
  const cfg = readUi();
  const svg = renderSvg(cfg);
  $("art").innerHTML = svg;
  const meta = buildInviteText(cfg).meta;
  $("art").setAttribute("aria-label", `${meta.purpose} invitation, ${meta.banner}${cfg.nick ? ", " + cfg.nick : ""}`);
  return cfg;
}

let debounce;
function onInput() { clearTimeout(debounce); debounce = setTimeout(render, 60); }

// Rasterize the current SVG to PNG via an Image + canvas.
function savePng() {
  const cfg = readUi();
  if (!scanConfig(cfg).ok) { setHint("Blocked: nickname contains unsafe content."); return; }
  const svg = renderSvg(cfg);
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS; canvas.height = CANVAS;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, CANVAS, CANVAS);
    URL.revokeObjectURL(url);
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `kiroween-${cfg.year}-${cfg.purpose}.png`;
    a.click();
    setHint("Saved PNG.");
  };
  img.onerror = () => { URL.revokeObjectURL(url); setHint("Could not rasterize image."); };
  img.src = url;
}

async function copyLink() {
  const cfg = readUi();
  if (!scanConfig(cfg).ok) { setHint("Blocked: nickname contains unsafe content."); return; }
  const link = `${location.origin}${location.pathname}?i=${encodeConfig(cfg)}`;
  try { await navigator.clipboard.writeText(link); setHint("Share link copied."); }
  catch { setHint("Copy this link: " + link); }
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
  for (const el of ["year", "nick", "mood", "palette", "glow"]) $(el).addEventListener("input", onInput);
  for (const c of document.querySelectorAll(".parts input")) c.addEventListener("change", render);
  $("savePng").addEventListener("click", savePng);
  $("copyLink").addEventListener("click", copyLink);
  $("saveCfg").addEventListener("click", saveCfg);

  writeUi(initialConfig());
  render();
}

boot();
