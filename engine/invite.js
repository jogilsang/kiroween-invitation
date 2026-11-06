// engine/invite.js — purpose/year/nick + look options -> invitation text, with
// validation. Pure: no DOM, no network, no clock, no Math.random.
// Model says, code decides.

export const PURPOSES = ["join", "notice", "recruit"];
export const MOODS = ["uneasy", "screaming", "hollow"];
export const PALETTES = ["deeppurple", "magenta", "indigo"];
export const GLOWS = ["soft", "strong"];
// One costume at a time (R30) and one backdrop scene (R31).
export const COSTUMES = ["none", "dracula", "mummy", "pirate", "skeleton"];
export const SCENES = ["sky", "graveyard", "house", "forest"];
// Decoration parts the SVG renderer understands. hat/horns are kept because the
// mutual-exclusion rule (R9) is specified over them; moon/bats are drawn.
export const PARTS_ALLOW = [
  "hat", "horns", "moon", "bats", "cobweb", "crow", "cat",
  "tombstone", "skull", "candle", "pumpkins",
];
// Fixed color swatches an asset can be tinted with (R23). Never free-form.
export const SWATCHES = Object.freeze({
  orange: "#ff7a18", purple: "#b14bff", green: "#5bd16a",
  bone: "#efe6d0", blood: "#e0203f", ice: "#7fd6ff",
});
export const SWATCH_KEYS = Object.keys(SWATCHES);
export const EVENT_MAX = Object.freeze({ date: 16, time: 12, place: 32 });

export const YEAR_MIN = 2000;
export const YEAR_MAX = 2100;
export const NICK_MAX = 24;
// Nickname: letters, numbers and combining marks from ANY script (so Korean and
// Japanese names work), plus space and - _ . ! ? . Everything else (markup,
// symbols, emoji, control chars) is stripped. (R25)
const NICK_DISALLOWED = /[^\p{L}\p{N}\p{M} \-_.!?]/gu;
// Event text allows a little more punctuation for dates, times and places.
// Still no < > & " ' ` or brackets that could form markup.
const TEXT_DISALLOWED = /[^\p{L}\p{N}\p{M} \-_.,!?:/#()]/gu;

const DEFAULTS = Object.freeze({
  purpose: "join",
  year: 2026,
  nick: "",
  ghost: { parts: [] },
  mood: "screaming",
  palette: "magenta",
  glow: "strong",
  costume: "none",
  scene: "sky",
});

/**
 * XML-escape a value before it is placed into SVG text/attributes.
 * Defense in depth: nick is already sanitized, but anything dynamic that
 * reaches the SVG goes through this too.
 * @param {unknown} v
 * @returns {string}
 */
export function escapeXml(v) {
  const s = typeof v === "string" ? v : v == null ? "" : String(v);
  return s.replace(/[<>&"']/g, (c) => (
    { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c]
  ));
}

/**
 * Sanitize a nickname: coerce to string, strip disallowed chars, collapse
 * whitespace, clamp length. Never returns raw user input.
 * @param {unknown} raw
 * @returns {{ value: string, changed: boolean }}
 */
function cleanText(raw, disallowed, max) {
  const s = typeof raw === "string" ? raw : raw == null ? "" : String(raw);
  const stripped = s.normalize("NFC").replace(disallowed, "").replace(/\s+/g, " ").trim();
  // Truncate by code point so a surrogate pair is never split (R25).
  const clamped = Array.from(stripped).slice(0, max).join("");
  return { value: clamped, changed: clamped !== s };
}

export function sanitizeNick(raw) {
  return cleanText(raw, NICK_DISALLOWED, NICK_MAX);
}

/** Sanitize an event text field (date / time / place). */
export function sanitizeEventText(raw, max) {
  return cleanText(raw, TEXT_DISALLOWED, max);
}

function pickEnum(raw, allow, fallback) {
  return allow.includes(raw) ? raw : fallback;
}

/**
 * Normalize/validate an arbitrary raw config into a safe InviteConfig.
 * Expected bad input never throws: it is clamped, sanitized, or defaulted,
 * and every change is listed in `reasons`.
 * @param {any} raw
 * @returns {{ ok: boolean, value: object, reasons: string[] }}
 */
export function normalizeConfig(raw) {
  const reasons = [];
  const r = raw && typeof raw === "object" ? raw : {};

  const purpose = pickEnum(r.purpose, PURPOSES, DEFAULTS.purpose);
  if (purpose !== r.purpose) reasons.push(`purpose fell back to "${purpose}"`);

  let year = r.year;
  const yearOk = Number.isInteger(year) && year >= YEAR_MIN && year <= YEAR_MAX;
  if (!yearOk) {
    reasons.push(`year "${r.year}" invalid; using default ${DEFAULTS.year}`);
    year = DEFAULTS.year;
  }

  const nick = sanitizeNick(r.nick);
  if (nick.changed) reasons.push("nick sanitized");

  const g = r.ghost && typeof r.ghost === "object" ? r.ghost : {};
  const partsRaw = Array.isArray(g.parts) ? g.parts : [];
  const parts = partsRaw.filter((p) => PARTS_ALLOW.includes(p));
  if (parts.length !== partsRaw.length) reasons.push("unknown parts dropped");

  // Per-asset color (R23): only known assets with known swatches survive.
  const tintsRaw = r.tints && typeof r.tints === "object" ? r.tints : {};
  const tints = {};
  for (const id of [...PARTS_ALLOW, ...COSTUMES.filter((c) => c !== "none")]) {
    if (Object.prototype.hasOwnProperty.call(tintsRaw, id) && SWATCH_KEYS.includes(tintsRaw[id])) {
      tints[id] = tintsRaw[id];
    }
  }
  if (Object.keys(tintsRaw).length !== Object.keys(tints).length) reasons.push("unknown tints dropped");

  // Event details (R24).
  const evRaw = r.event && typeof r.event === "object" ? r.event : {};
  const event = {
    date: sanitizeEventText(evRaw.date, EVENT_MAX.date).value,
    time: sanitizeEventText(evRaw.time, EVENT_MAX.time).value,
    place: sanitizeEventText(evRaw.place, EVENT_MAX.place).value,
  };

  const mood = pickEnum(r.mood, MOODS, DEFAULTS.mood);
  if (mood !== r.mood) reasons.push(`mood fell back to "${mood}"`);
  const palette = pickEnum(r.palette, PALETTES, DEFAULTS.palette);
  if (palette !== r.palette) reasons.push(`palette fell back to "${palette}"`);
  const glow = pickEnum(r.glow, GLOWS, DEFAULTS.glow);
  if (glow !== r.glow) reasons.push(`glow fell back to "${glow}"`);
  const costume = pickEnum(r.costume, COSTUMES, DEFAULTS.costume);
  if (costume !== r.costume && r.costume !== undefined) reasons.push(`costume fell back to "${costume}"`);
  const scene = pickEnum(r.scene, SCENES, DEFAULTS.scene);
  if (scene !== r.scene && r.scene !== undefined) reasons.push(`scene fell back to "${scene}"`);

  const value = {
    purpose,
    year,
    nick: nick.value,
    ghost: { parts },
    tints,
    event,
    mood,
    palette,
    glow,
    costume,
    scene,
  };
  return { ok: reasons.length === 0, value, reasons };
}

const TEMPLATES = {
  join: {
    title: "YOU ARE SUMMONED",
    body: (c) => [
      `${c.nick || "A brave soul"} enters Kiroween ${c.year}.`,
      "Join the ritual. Build something wicked.",
    ],
  },
  notice: {
    title: "A HAUNTING IS CALLED",
    body: (c) => [
      `Kiroween ${c.year} — all spirits welcome.`,
      `Summoned by ${c.nick || "the host"}.`,
    ],
  },
  recruit: {
    title: "SEEKING ACCOMPLICES",
    body: (c) => [
      `${c.nick || "A lone coder"} needs a crew for Kiroween ${c.year}.`,
      "Answer if you dare to commit to the darkness.",
    ],
  },
};

/**
 * Build the invitation text for a NORMALIZED config.
 * @param {object} config result of normalizeConfig().value
 * @returns {{ title: string, lines: string[], meta: object }}
 */
export function buildInviteText(config) {
  const t = TEMPLATES[config.purpose] || TEMPLATES.join;
  return {
    title: t.title,
    lines: t.body(config),
    meta: {
      banner: `KIROWEEN ${config.year}`,
      purpose: config.purpose,
      year: config.year,
      details: [config.event && config.event.date, config.event && config.event.time, config.event && config.event.place]
        .filter(Boolean).join(" \u00b7 "),
    },
  };
}
