// engine/share.js — config <-> URL param. Pure, cross-environment.
// No server storage. Corrupt/forged params fall back to a safe default (R17).

import { normalizeConfig } from "./invite.js";

// --- base64url over UTF-8, works in Node and browsers without btoa/atob ---
const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

function utf8Bytes(str) {
  // encodeURIComponent gives %XX for non-ASCII; turn that into raw bytes.
  const esc = encodeURIComponent(str);
  const bytes = [];
  for (let i = 0; i < esc.length; i++) {
    if (esc[i] === "%") {
      bytes.push(parseInt(esc.slice(i + 1, i + 3), 16));
      i += 2;
    } else {
      bytes.push(esc.charCodeAt(i));
    }
  }
  return bytes;
}

function bytesToUtf8(bytes) {
  let esc = "";
  for (const b of bytes) esc += "%" + b.toString(16).padStart(2, "0");
  return decodeURIComponent(esc);
}

function b64urlEncode(str) {
  const bytes = utf8Bytes(str);
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : undefined;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : undefined;
    out += B64[b0 >> 2];
    out += B64[((b0 & 3) << 4) | ((b1 ?? 0) >> 4)];
    out += b1 === undefined ? "" : B64[((b1 & 15) << 2) | ((b2 ?? 0) >> 6)];
    out += b2 === undefined ? "" : B64[b2 & 63];
  }
  return out;
}

function b64urlDecode(s) {
  if (typeof s !== "string" || !/^[A-Za-z0-9\-_]*$/.test(s)) {
    throw new Error("invalid base64url");
  }
  const bytes = [];
  for (let i = 0; i < s.length; i += 4) {
    const c0 = B64.indexOf(s[i]);
    const c1 = B64.indexOf(s[i + 1]);
    const c2 = i + 2 < s.length ? B64.indexOf(s[i + 2]) : -1;
    const c3 = i + 3 < s.length ? B64.indexOf(s[i + 3]) : -1;
    if (c0 < 0 || c1 < 0) throw new Error("invalid base64url");
    bytes.push((c0 << 2) | (c1 >> 4));
    if (c2 >= 0) bytes.push(((c1 & 15) << 4) | (c2 >> 2));
    if (c3 >= 0) bytes.push(((c2 & 3) << 6) | c3);
  }
  return bytesToUtf8(bytes);
}

/**
 * Serialize a normalized config to a compact JSON string.
 * @param {object} config
 * @returns {string}
 */
export function serializeConfig(config) {
  return JSON.stringify({
    p: config.purpose,
    y: config.year,
    n: config.nick,
    pa: config.ghost.parts,
    t: config.tints,
    e: [config.event.date, config.event.time, config.event.place],
    m: config.mood,
    c: config.palette,
    g: config.glow,
    k: config.costume,
    s: config.scene,
  });
}

/**
 * Parse a serialized string back into a RAW config shape (pre-normalize).
 * @param {string} json
 * @returns {object}
 */
function deserializeRaw(json) {
  const o = JSON.parse(json);
  return {
    purpose: o.p,
    year: o.y,
    nick: o.n,
    ghost: { parts: o.pa },
    tints: o.t,
    event: Array.isArray(o.e) ? { date: o.e[0], time: o.e[1], place: o.e[2] } : {},
    mood: o.m,
    palette: o.c,
    glow: o.g,
    costume: o.k,
    scene: o.s,
  };
}

/**
 * Encode a normalized config into a URL-safe param value.
 * @param {object} config
 * @returns {string}
 */
export function encodeConfig(config) {
  return b64urlEncode(serializeConfig(config));
}

/**
 * Decode a URL param into a NORMALIZED config. Any failure (bad base64, bad
 * JSON, forged fields) yields a safe default config and never throws.
 * @param {string} param
 * @returns {{ ok: boolean, value: object, reason: string|null }}
 */
export function decodeConfig(param) {
  try {
    const json = b64urlDecode(param);
    const raw = deserializeRaw(json);
    const norm = normalizeConfig(raw); // clamps/sanitizes/falls back
    return { ok: true, value: norm.value, reason: null };
  } catch (e) {
    return { ok: false, value: normalizeConfig({}).value, reason: String(e && e.message || e) };
  }
}
