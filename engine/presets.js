// engine/presets.js — named looks. Pure data + one pure function.
// A preset sets only the LOOK (mood, palette, glow, costume, scene, assets, tints).
// The user's own content (purpose, year, nickname, event) is never touched. (R40-R42)
import { normalizeConfig } from "./invite.js";

export const PRESETS = Object.freeze([
  { id: "classic-haunt", name: "Classic Haunt", look: {
    mood: "screaming", palette: "magenta", glow: "strong", costume: "none", scene: "house",
    ghost: { parts: ["moon", "bats", "cobweb", "pumpkins", "candle"] }, tints: {} } },
  { id: "vampire-ball", name: "Vampire Ball", look: {
    mood: "uneasy", palette: "deeppurple", glow: "soft", costume: "dracula", scene: "sky",
    ghost: { parts: ["moon", "bats", "candle", "cobweb"] }, tints: { candle: "blood", dracula: "blood" } } },
  { id: "pirate-crypt", name: "Pirate Crypt", look: {
    mood: "screaming", palette: "indigo", glow: "strong", costume: "pirate", scene: "graveyard",
    ghost: { parts: ["skull", "crow", "tombstone", "moon"] }, tints: { skull: "bone", crow: "ice" } } },
  { id: "mummys-tomb", name: "Mummy's Tomb", look: {
    mood: "hollow", palette: "deeppurple", glow: "soft", costume: "mummy", scene: "graveyard",
    ghost: { parts: ["tombstone", "candle", "cobweb", "skull"] }, tints: { candle: "orange" } } },
  { id: "bone-orchard", name: "Bone Orchard", look: {
    mood: "hollow", palette: "indigo", glow: "strong", costume: "skeleton", scene: "forest",
    ghost: { parts: ["skull", "crow", "bats", "moon", "tombstone"] }, tints: { moon: "ice", bats: "green" } } },
  { id: "witching-hour", name: "Witching Hour", look: {
    mood: "uneasy", palette: "magenta", glow: "strong", costume: "none", scene: "forest",
    ghost: { parts: ["hat", "cat", "moon", "bats", "pumpkins"] }, tints: { cat: "green", hat: "purple" } } },
]);

const BY_ID = new Map(PRESETS.map((p) => [p.id, p]));

/**
 * Return a new config with the preset's look applied.
 * @param {object} cfg a normalized config
 * @param {string} id preset id; anything unknown returns cfg unchanged
 * @returns {object} a normalized config
 */
export function applyPreset(cfg, id) {
  const p = typeof id === "string" ? BY_ID.get(id) : undefined;
  if (!p) return cfg;
  return normalizeConfig({
    purpose: cfg.purpose, year: cfg.year, nick: cfg.nick, event: cfg.event,
    ...structuredClone(p.look),
  }).value;
}
