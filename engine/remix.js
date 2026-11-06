// engine/remix.js — invent a new look from a seed. Pure and deterministic.
// The engine never picks a random seed itself (no Math.random, no clock): the
// caller passes one in, and the share link reproduces the result exactly. (R27-R29)
import { normalizeConfig, MOODS, PALETTES, GLOWS, PARTS_ALLOW, SWATCH_KEYS, COSTUMES, SCENES } from "./invite.js";

const MIN_ASSETS = 4;
const MAX_ASSETS = 6;

// mulberry32, seeded
function rng(seedInt) {
  let a = seedInt >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Any input becomes a safe 32-bit integer seed; junk falls back to 1.
function toSeed(raw) {
  const n = typeof raw === "number" && Number.isFinite(raw) ? Math.trunc(raw) : 1;
  return (Math.abs(n) % 4294967295) + 1;
}

const pick = (r, list) => list[Math.floor(r() * list.length)];

/**
 * Return a new config with a new LOOK derived from `seed`. The user's own
 * content (purpose, year, nickname, event details) is copied unchanged.
 * @param {object} cfg a normalized config
 * @param {number} seed any integer (anything else falls back to a safe seed)
 * @returns {object} a normalized config
 */
export function remixConfig(cfg, seed) {
  const r = rng(toSeed(seed));
  const mood = pick(r, MOODS);
  const palette = pick(r, PALETTES);
  const glow = pick(r, GLOWS);
  const costume = pick(r, COSTUMES);
  const scene = pick(r, SCENES);

  // Choose MIN..MAX assets by a seeded shuffle of the allow-list.
  const pool = [...PARTS_ALLOW];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const count = MIN_ASSETS + Math.floor(r() * (MAX_ASSETS - MIN_ASSETS + 1));
  let parts = pool.slice(0, count);
  // hat and horns are exclusive (R9): keep whichever the shuffle put first.
  if (parts.includes("hat") && parts.includes("horns")) {
    parts = parts.filter((p) => p !== (parts.indexOf("hat") < parts.indexOf("horns") ? "horns" : "hat"));
  }

  // About half of the chosen assets get a color from the fixed swatches.
  const tints = {};
  for (const p of parts) if (r() < 0.55) tints[p] = pick(r, SWATCH_KEYS);
  if (costume !== "none" && r() < 0.55) tints[costume] = pick(r, SWATCH_KEYS);

  return normalizeConfig({
    purpose: cfg.purpose,
    year: cfg.year,
    nick: cfg.nick,
    event: cfg.event,
    ghost: { parts },
    tints,
    mood, palette, glow, costume, scene,
  }).value;
}
