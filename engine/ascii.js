// engine/ascii.js — deterministic brightness-grid -> ASCII renderer. Pure.
// No DOM, no network, no Math.random, no Date.now. Same config -> same bytes.

import { resolveParts, compositeLayers } from "./compose.js";
import { buildInviteText } from "./invite.js";

// Brightness ramps: index 0 = darkest glyph, last = brightest.
const RAMPS = {
  low: " .:-=+*#%@",
  mid: " .'`^\",:;Il!i><~+?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
  high: " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczmwXYUJCLQ0OZ#MW&8%B@$kbdpqasho*",
};

// Grid resolution scale per density (sampling stride over the base grid).
const DENSITY_SCALE = { low: 2, mid: 1, high: 1 };

/**
 * Deterministic integer seed derived from a normalized config.
 * Used only for tie-breaking; never for the pixel values themselves.
 * @param {object} config
 * @returns {number} 32-bit unsigned
 */
export function deriveSeed(config) {
  const s = JSON.stringify({
    p: config.purpose,
    y: config.year,
    n: config.nick,
    f: config.ghost?.face,
    parts: config.ghost?.parts,
    t: config.ghost?.theme,
    d: config.density,
  });
  let h = 2166136261 >>> 0; // FNV-1a
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

// Map a brightness (0..1) to a ramp glyph. dark = invert (bright glyph on dark).
function glyphFor(brightness, ramp, dark) {
  let b = brightness;
  if (dark) b = 1 - b; // dark theme: high brightness -> denser/brighter glyph
  const n = ramp.length;
  let idx = Math.round(b * (n - 1));
  if (idx < 0) idx = 0;
  if (idx > n - 1) idx = n - 1;
  return ramp[idx];
}

/**
 * Build the layered brightness grid for a config from the asset grids.
 * @param {object} config normalized config
 * @param {object} grids assets/grids.json
 * @returns {Array<Array<number|null>>}
 */
function buildGrid(config, grids) {
  const { parts } = resolveParts(config);
  const face = grids.faces[config.ghost.face] || grids.faces.mischief;
  const layers = [
    grids.background, // background
    grids.pumpkin, // pumpkin
    grids.ghostBody, // ghost
    face, // face
  ];
  for (const p of parts) {
    if (grids.parts[p]) layers.push(grids.parts[p]); // decoration (top)
  }
  return compositeLayers(layers);
}

/**
 * Render the ASCII art body (no text frame) for a config.
 * Guarantees: deterministic, every row identical length (R12), dark invert (R11),
 * density levels (R10).
 * @param {object} config normalized config
 * @param {object} grids assets/grids.json
 * @returns {string}
 */
export function renderArt(config, grids) {
  const grid = buildGrid(config, grids);
  if (grid.length === 0) return "";
  const dark = config.ghost.theme === "dark";
  const ramp = RAMPS[config.density] || RAMPS.mid;
  const stride = DENSITY_SCALE[config.density] || 1;

  const rows = [];
  for (let y = 0; y < grid.length; y += stride) {
    let line = "";
    for (let x = 0; x < grid[y].length; x++) {
      const cell = grid[y][x];
      // transparent cell -> field brightness 0 (becomes dark-field glyph when inverted)
      const b = cell == null ? 0 : cell;
      line += glyphFor(b, ramp, dark);
    }
    rows.push(line);
  }
  // Enforce equal row length (R12): pad to the max with the field glyph.
  const field = glyphFor(0, ramp, dark);
  const wMax = rows.reduce((m, r) => Math.max(m, r.length), 0);
  return rows.map((r) => r + field.repeat(wMax - r.length)).join("\n");
}

/**
 * Full invitation: framed ASCII art + banner/title/body text.
 * Deterministic and monospace-consistent.
 * @param {object} config normalized config
 * @param {object} grids assets/grids.json
 * @returns {string}
 */
export function renderAscii(config, grids) {
  const art = renderArt(config, grids);
  const artRows = art ? art.split("\n") : [];
  const width = artRows.length ? artRows[0].length : 40;
  const text = buildInviteText(config);

  const center = (s) => {
    const str = s.slice(0, width);
    const pad = Math.max(0, Math.floor((width - str.length) / 2));
    return " ".repeat(pad) + str + " ".repeat(Math.max(0, width - pad - str.length));
  };
  const bar = "=".repeat(width);

  const out = [];
  out.push(bar);
  out.push(center(text.meta.banner));
  out.push(bar);
  for (const r of artRows) out.push(r);
  out.push(bar);
  out.push(center(text.title));
  for (const line of text.lines) out.push(center(line));
  out.push(bar);
  // Enforce equal width across the whole thing.
  const wMax = out.reduce((m, r) => Math.max(m, r.length), 0);
  return out.map((r) => r + " ".repeat(wMax - r.length)).join("\n");
}
