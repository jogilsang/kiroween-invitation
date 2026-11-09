// engine/recv.js — receiver-view decisions. Pure: no DOM, no clock, no network.
// The app passes in the URL search string, "today" and navigator; this file decides.

import { decodeConfig } from "./share.js";
import { buildIcs, parseEventDate } from "./ics.js";
import { buildInviteText } from "./invite.js";

/**
 * Decide the starting view from the URL search string (R60).
 * A valid `i` param gives the receiver view; anything else gives the editor.
 * @param {unknown} search e.g. "?i=abc"
 * @returns {{mode:"receiver"|"edit", config:object|null, corrupt:boolean}}
 */
export function receiverView(search) {
  let param = null;
  if (typeof search === "string") {
    try { param = new URLSearchParams(search).get("i"); } catch { param = null; }
  }
  if (param === null || param === "") return { mode: "edit", config: null, corrupt: false };
  const dec = decodeConfig(param);
  if (!dec.ok) return { mode: "edit", config: dec.value, corrupt: true };
  return { mode: "receiver", config: dec.value, corrupt: false };
}

/** The "make your own" link: the app URL without any query (R61). */
export function makeYourOwnUrl(origin, pathname) {
  if (typeof origin !== "string" || typeof pathname !== "string") return "./";
  // Strip control characters/whitespace (CR/LF injection), then accept only http(s) origins.
  const o = origin.replace(/[\x00-\x1f\x7f\s]/g, "");
  if (!/^https?:\/\/[A-Za-z0-9.-]+(:\d{1,5})?$/i.test(o)) return "./";
  return o + pathname.split("?")[0].replace(/[\x00-\x1f\x7f\s]/g, "");
}

/** Page title from the normalized nickname only (R62). */
export function receiverTitle(cfg) {
  const nick = cfg && typeof cfg.nick === "string" ? cfg.nick.replace(/[<>]/g, "") : "";
  return nick ? `${nick}'s invitation | Kiroween Invitation` : "You are summoned | Kiroween Invitation";
}

/** Which buttons the receiver view shows (R61, R63). */
export function receiverActions(cfg) {
  return { calendar: buildIcs(cfg) !== null, edit: true, makeYourOwn: true };
}

/**
 * Countdown to the event (R64). `today` is injected; the engine never reads the clock.
 * @returns {{days:number,text:string}|null} null when unreadable, past, or today missing
 */
export function countdownInfo(cfg, today) {
  if (!cfg || !today || ![today.y, today.m, today.d].every(Number.isInteger)) return null;
  const ev = cfg.event || {};
  const when = parseEventDate(ev.date, ev.time, cfg.year);
  if (!when) return null;
  const days = Math.round((Date.UTC(when.y, when.m - 1, when.d) - Date.UTC(today.y, today.m - 1, today.d)) / 86400000);
  if (days < 0) return null;
  if (days === 0) return { days, text: when.allDay ? "Today" : "Tonight" };
  if (days === 1) return { days, text: "Tomorrow" };
  return { days, text: `${days} days to go` };
}

/** Native share is offered only when the browser has it (R65). */
export function canNativeShare(nav) {
  try {
    return !!nav && typeof nav.share === "function";
  } catch {
    return false; // hostile getter
  }
}

/** Text for the native share sheet. */
export function shareText(cfg) {
  const t = buildInviteText(cfg);
  return `${t.title} - ${t.meta.banner}`;
}
