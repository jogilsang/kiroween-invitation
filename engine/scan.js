// engine/scan.js — pre-share safety scan. Pure.
// Blocks script-like content, obvious PII patterns, and banned phrases before
// any share link or export is produced. Code decides; nothing is "trusted".

const SCRIPT_PATTERNS = [
  /<\s*script/i,
  /<\s*\/?\s*[a-z]+[^>]*>/i, // any html-ish tag
  /javascript\s*:/i,
  /on\w+\s*=/i, // onload=, onclick=
  /data\s*:\s*text\/html/i,
];

const PII_PATTERNS = [
  /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/, // email
  /(?:\+?\d[\s-]?){10,}/, // 10+ digit phone-like run
  /\b(?:\d[ -]?){13,16}\b/, // card-like
];

// A tiny banned-phrase list. Deliberately small and documented; extendable.
const BANNED = ["password", "api_key", "apikey", "secret_key", "ssh-rsa"];

/**
 * Scan a free-text string for unsafe content.
 * @param {unknown} s
 * @returns {{ ok: boolean, hits: string[] }}
 */
export function scanText(s) {
  const str = typeof s === "string" ? s : s == null ? "" : String(s);
  const hits = [];
  for (const re of SCRIPT_PATTERNS) if (re.test(str)) hits.push(`script-like: ${re}`);
  for (const re of PII_PATTERNS) if (re.test(str)) hits.push(`pii-like: ${re}`);
  const lower = str.toLowerCase();
  for (const b of BANNED) if (lower.includes(b)) hits.push(`banned: ${b}`);
  return { ok: hits.length === 0, hits };
}

/**
 * Scan every free-text field of a config that could reach output.
 * @param {object} config normalized config
 * @returns {{ ok: boolean, hits: string[] }}
 */
export function scanConfig(config) {
  // Only `nick` is free text; everything else is enum/int from normalizeConfig.
  return scanText(config?.nick ?? "");
}
