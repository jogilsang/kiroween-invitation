// engine/compose.js — layer ordering and composition rules. Pure.
// Code decides the layer order and which mutually-exclusive part wins.

// Fixed bottom-to-top layer order. Parts are slotted into their layer.
export const LAYER_ORDER = ["background", "pumpkin", "ghost", "face", "decoration"];

// Parts that cannot coexist. If both are selected, the one listed FIRST wins,
// and the decision is recorded. (hat vs horns = headwear slot)
const EXCLUSIVE_GROUPS = [["hat", "horns"]];

// Which decoration parts map into which layer. Everything here is a decoration
// layer part except the structural ghost/face/pumpkin/background.
export const DECORATION_PARTS = ["hat", "horns", "cobweb", "bats", "candle"];

/**
 * Resolve the active parts for a normalized config, enforcing mutual exclusion.
 * @param {object} config normalized config (ghost.parts is an allow-listed array)
 * @returns {{ parts: string[], decisions: string[] }}
 */
export function resolveParts(config) {
  const decisions = [];
  const selected = Array.isArray(config?.ghost?.parts) ? [...config.ghost.parts] : [];

  for (const group of EXCLUSIVE_GROUPS) {
    const present = group.filter((p) => selected.includes(p));
    if (present.length > 1) {
      const winner = present[0];
      const losers = present.slice(1);
      for (const l of losers) {
        const idx = selected.indexOf(l);
        if (idx !== -1) selected.splice(idx, 1);
      }
      decisions.push(`exclusive group [${group.join("|")}]: kept "${winner}", dropped ${losers.map((x) => `"${x}"`).join(", ")}`);
    }
  }

  // Stable, deterministic order: keep allow-list order, not user click order.
  const ordered = DECORATION_PARTS.filter((p) => selected.includes(p));
  return { parts: ordered, decisions };
}

/**
 * Composite a list of layer grids (bottom-first) into one grid.
 * Each grid is a 2D array of numbers (brightness 0..1) or null = transparent.
 * Upper non-null cells overwrite lower cells; null keeps the layer below.
 * All grids must share dimensions (caller guarantees via asset sampler).
 * @param {Array<Array<Array<number|null>>>} layers bottom-first
 * @returns {Array<Array<number|null>>}
 */
export function compositeLayers(layers) {
  const real = layers.filter((g) => Array.isArray(g) && g.length > 0);
  if (real.length === 0) return [];
  const h = real[0].length;
  const w = real[0][0].length;
  const out = Array.from({ length: h }, () => Array.from({ length: w }, () => null));
  for (const g of real) {
    if (g.length !== h || g[0].length !== w) {
      throw new Error("compositeLayers: layer dimension mismatch");
    }
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const cell = g[y][x];
        if (cell !== null && cell !== undefined) out[y][x] = cell;
      }
    }
  }
  return out;
}
