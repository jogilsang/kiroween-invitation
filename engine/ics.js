// engine/ics.js — a downloadable calendar entry, made entirely on the device. Pure.
// The date field is free text, so reading it is the risky part: we accept a short
// list of unambiguous shapes and return null for everything else. We never guess.
import { buildInviteText } from "./invite.js";

const MONTHS = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4, may: 5,
  jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9, september: 9,
  oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
};

function daysIn(y, m) {
  return [31, (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
}

function validDate(y, m, d) {
  return Number.isInteger(y) && y >= 2000 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= daysIn(y, m);
}

// -> {y?, m, d} or null
function readDate(text) {
  const t = String(text).trim().toLowerCase().replace(/\s+/g, " ");
  let m;
  // 2026-10-31 / 2026.10.31 / 2026/10/31
  if ((m = t.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/))) return { y: +m[1], m: +m[2], d: +m[3] };
  // 10월 31일 / 10월31일
  if ((m = t.match(/^(\d{1,2})\s*월\s*(\d{1,2})\s*일?$/))) return { m: +m[1], d: +m[2] };
  // 10/31 or 10.31  (month first; the only supported numeric order)
  if ((m = t.match(/^(\d{1,2})[/.](\d{1,2})$/))) return { m: +m[1], d: +m[2] };
  // Oct 31 / October 31 / Oct 31st
  if ((m = t.match(/^([a-z]{3,9})\.? (\d{1,2})(?:st|nd|rd|th)?$/)) && MONTHS[m[1]]) return { m: MONTHS[m[1]], d: +m[2] };
  // 31 Oct / 31st October
  if ((m = t.match(/^(\d{1,2})(?:st|nd|rd|th)? ([a-z]{3,9})\.?$/)) && MONTHS[m[2]]) return { m: MONTHS[m[2]], d: +m[1] };
  return null;
}

// -> {hh, mm} or null
function readTime(text) {
  const t = String(text).trim().toLowerCase().replace(/\s+/g, "");
  let m;
  if ((m = t.match(/^(\d{1,2})(?::(\d{2}))?(am|pm)$/))) {
    let hh = +m[1]; const mm = m[2] ? +m[2] : 0;
    if (hh < 1 || hh > 12 || mm > 59) return null;
    if (m[3] === "am") hh = hh === 12 ? 0 : hh; else hh = hh === 12 ? 12 : hh + 12;
    return { hh, mm };
  }
  if ((m = t.match(/^(\d{1,2}):(\d{2})$/))) {
    const hh = +m[1], mm = +m[2];
    return hh <= 23 && mm <= 59 ? { hh, mm } : null;
  }
  return null;
}

/**
 * Read the event date (and optional time). Returns null when it cannot be read
 * unambiguously or is not a real calendar date.
 * @param {unknown} date @param {unknown} time @param {number} defaultYear
 * @returns {{y:number,m:number,d:number,hh:number,mm:number,allDay:boolean}|null}
 */
export function parseEventDate(date, time, defaultYear) {
  if (typeof date !== "string" || !date.trim()) return null;
  const d = readDate(date);
  if (!d) return null;
  const y = d.y ?? defaultYear;
  if (!validDate(y, d.m, d.d)) return null;
  const hasTime = typeof time === "string" && time.trim() !== "";
  if (!hasTime) return { y, m: d.m, d: d.d, hh: 0, mm: 0, allDay: true };
  const tm = readTime(time);
  if (!tm) return null; // an unreadable time is not guessed
  return { y, m: d.m, d: d.d, hh: tm.hh, mm: tm.mm, allDay: false };
}

const p2 = (n) => String(n).padStart(2, "0");
const stamp = (y, m, d, hh = 0, mm = 0) => `${y}${p2(m)}${p2(d)}T${p2(hh)}${p2(mm)}00`;

// Escape a TEXT value (RFC 5545 3.3.11) and drop every CR/LF so a value can never
// start a new line: that is what blocks header injection (R38).
function esc(v) {
  return String(v ?? "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

// Fold a content line at 75 OCTETS (not characters: Korean is 3 bytes per letter).
export function foldIcsLine(line) {
  const out = [];
  let cur = "";
  let bytes = 0;
  let limit = 75;
  for (const ch of Array.from(line)) {
    const b = Buffer.byteLength(ch, "utf8");
    if (bytes + b > limit) { out.push(cur); cur = " "; bytes = 1; limit = 75; }
    cur += ch;
    bytes += b;
  }
  out.push(cur);
  return out.join("\r\n");
}

// Small deterministic hash (FNV-1a) so the UID is a stable function of the config.
function hash(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h.toString(16).padStart(8, "0");
}

/**
 * Build an iCalendar text for the event, or null when the date/time cannot be read.
 * Floating local time: no time zone is invented. Deterministic: no clock, no random.
 * @param {object} cfg normalized config
 * @returns {string|null}
 */
export function buildIcs(cfg) {
  const ev = cfg && cfg.event ? cfg.event : {};
  const when = parseEventDate(ev.date, ev.time, cfg && cfg.year);
  if (!when) return null;

  const t = buildInviteText(cfg);
  const summary = `${t.title} - ${t.meta.banner}`;
  const uid = `${hash(JSON.stringify([cfg.purpose, cfg.year, cfg.nick, ev.date, ev.time, ev.place]))}@ascii-invite`;

  let start, end;
  if (when.allDay) {
    const next = new Date(Date.UTC(when.y, when.m - 1, when.d + 1));
    start = `DTSTART;VALUE=DATE:${when.y}${p2(when.m)}${p2(when.d)}`;
    end = `DTEND;VALUE=DATE:${next.getUTCFullYear()}${p2(next.getUTCMonth() + 1)}${p2(next.getUTCDate())}`;
  } else {
    const e = new Date(Date.UTC(when.y, when.m - 1, when.d, when.hh + 2, when.mm));
    start = `DTSTART:${stamp(when.y, when.m, when.d, when.hh, when.mm)}`;
    end = `DTEND:${stamp(e.getUTCFullYear(), e.getUTCMonth() + 1, e.getUTCDate(), e.getUTCHours(), e.getUTCMinutes())}`;
  }
  // DTSTAMP is required; use the event start itself so the file never depends on the clock.
  const dtstamp = `DTSTAMP:${stamp(when.y, when.m, when.d, when.hh, when.mm)}`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ascii-invite//Kiroween 2026//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    dtstamp,
    start,
    end,
    `SUMMARY:${esc(summary)}`,
    ...(ev.place ? [`LOCATION:${esc(ev.place)}`] : []),
    ...(cfg.nick ? [`DESCRIPTION:${esc(`Hosted by ${cfg.nick}`)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(foldIcsLine).join("\r\n") + "\r\n";
}
