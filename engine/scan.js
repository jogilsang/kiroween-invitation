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
  // \p{Nd} = a decimal digit of ANY script (full-width, Arabic-Indic, ...), not just 0-9.
  /(?:\+?\p{Nd}[\s-]?){10,}/u, // 10+ digit phone-like run
  /(?:\p{Nd}[ -]?){13,16}/u, // card-like
];

// Links: a free-text field is not a place for a clickable URL (a share link could
// otherwise plant one in someone's calendar entry).
SCRIPT_PATTERNS.push(/\b[a-z][a-z0-9+.-]*:\/\//i, /\bwww\./i);

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
  // Free-text fields: nickname and each event field, scanned one by one so the
  // digits of a date and a time are never read as one phone-number-like run.
  const fields = [config?.nick, config?.event?.date, config?.event?.time, config?.event?.place];
  const hits = [];
  for (const f of fields) hits.push(...scanText(f ?? "").hits);
  return { ok: hits.length === 0, hits };
}

/**
 * Scan the RAW user input (before sanitizing). Sanitizing strips characters like
 * "@" and "<", which would hide the user's intent (an email address becomes
 * "ab.com"). The app calls this on the raw fields so PII or markup is blocked
 * instead of being silently rewritten into a shareable link.
 * @param {{nick?: unknown, date?: unknown, time?: unknown, place?: unknown}} raw
 * @returns {{ ok: boolean, hits: string[] }}
 */
export function scanRaw(raw) {
  const hits = [];
  for (const k of ["nick", "date", "time", "place"]) hits.push(...scanText(raw?.[k] ?? "").hits);
  return { ok: hits.length === 0, hits };
}
