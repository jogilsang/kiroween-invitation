// engine/invite.js — purpose/year/nick -> invitation text, with validation.
// Pure: no DOM, no network, no clock, no Math.random. Model says, code decides.

export const PURPOSES = ["join", "notice", "recruit"];
export const FACES = ["mischief", "spooky", "cute"];
export const THEMES = ["dark"];
export const DENSITIES = ["low", "mid", "high"];
export const PARTS_ALLOW = ["hat", "horns", "cobweb", "bats", "candle"];

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
  ghost: { face: "mischief", parts: [], theme: "dark" },
  density: "mid",
});

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
  let yearOk = Number.isInteger(year) && year >= YEAR_MIN && year <= YEAR_MAX;
  if (!yearOk) {
    reasons.push(`year "${r.year}" invalid; using default ${DEFAULTS.year}`);
    year = DEFAULTS.year;
  }

  const nick = sanitizeNick(r.nick);
  if (nick.changed) reasons.push("nick sanitized");

  const g = r.ghost && typeof r.ghost === "object" ? r.ghost : {};
  const face = pickEnum(g.face, FACES, DEFAULTS.ghost.face);
  if (face !== g.face) reasons.push(`face fell back to "${face}"`);
  const theme = pickEnum(g.theme, THEMES, DEFAULTS.ghost.theme);
  const partsRaw = Array.isArray(g.parts) ? g.parts : [];
  const parts = partsRaw.filter((p) => PARTS_ALLOW.includes(p));
  if (parts.length !== partsRaw.length) reasons.push("unknown parts dropped");

  const density = pickEnum(r.density, DENSITIES, DEFAULTS.density);
  if (density !== r.density) reasons.push(`density fell back to "${density}"`);

  const value = {
    purpose,
    year,
    nick: nick.value,
    ghost: { face, parts, theme },
    density,
  };
  return { ok: reasons.length === 0, value, reasons };
}

const TEMPLATES = {
  join: {
    title: "YOU ARE SUMMONED",
    body: (c) => [
      `${c.nick || "A brave soul"} is entering Kiroween ${c.year}.`,
      "Join the ritual. Build something wicked.",
    ],
  },
  notice: {
    title: "A HAUNTING IS ANNOUNCED",
    body: (c) => [
      `Kiroween ${c.year} gathering — all spirits welcome.`,
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
