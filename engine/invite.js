// engine/invite.js — purpose/year/nick + look options -> invitation text, with
// validation. Pure: no DOM, no network, no clock, no Math.random.
// Model says, code decides.

export const PURPOSES = ["join", "notice", "recruit"];
export const MOODS = ["uneasy", "screaming", "hollow"];
export const PALETTES = ["deeppurple", "magenta", "indigo"];
export const GLOWS = ["soft", "strong"];
// Decoration parts the SVG renderer understands. hat/horns are kept because the
// mutual-exclusion rule (R9) is specified over them; moon/bats are drawn.
export const PARTS_ALLOW = ["hat", "horns", "moon", "bats"];

export const YEAR_MIN = 2000;
export const YEAR_MAX = 2100;
export const NICK_MAX = 24;
// Allow letters, digits, space, and a small safe punctuation set. Everything
// else (including <, >, &, quotes, control chars) is stripped by sanitizeNick.
const NICK_ALLOWED = /[^0-9A-Za-z \-_.!?]/g;

const DEFAULTS = Object.freeze({
  purpose: "join",
  year: 2026,
  nick: "",
  ghost: { parts: [] },
  mood: "screaming",
  palette: "magenta",
  glow: "strong",
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
export function sanitizeNick(raw) {
  const s = typeof raw === "string" ? raw : raw == null ? "" : String(raw);
  const stripped = s.replace(NICK_ALLOWED, "").replace(/\s+/g, " ").trim();
  const clamped = stripped.slice(0, NICK_MAX);
  return { value: clamped, changed: clamped !== s };
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

  const mood = pickEnum(r.mood, MOODS, DEFAULTS.mood);
  if (mood !== r.mood) reasons.push(`mood fell back to "${mood}"`);
  const palette = pickEnum(r.palette, PALETTES, DEFAULTS.palette);
  if (palette !== r.palette) reasons.push(`palette fell back to "${palette}"`);
  const glow = pickEnum(r.glow, GLOWS, DEFAULTS.glow);
  if (glow !== r.glow) reasons.push(`glow fell back to "${glow}"`);

  const value = {
    purpose,
    year,
    nick: nick.value,
    ghost: { parts },
    mood,
    palette,
    glow,
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
    },
  };
}
