// engine/compose.js — layer ordering and composition rules. Pure.
// Code decides the SVG layer order and which mutually-exclusive part wins.

// Fixed bottom-to-top SVG layer order (R8).
export const LAYER_ORDER = ["background", "fog", "moon", "bats", "props", "ghost", "pumpkin", "frame", "text"];

// Parts that cannot coexist. If both are selected, the one listed FIRST wins,
// and the decision is recorded. (hat vs horns = headwear slot)
const EXCLUSIVE_GROUPS = [["hat", "horns"]];

// Decoration parts in their stable, deterministic order (not user click order).
export const DECORATION_PARTS = [
  "hat", "horns", "moon", "bats", "cobweb", "crow", "cat",
  "tombstone", "skull", "candle", "pumpkins",
];

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
