// Module Web Worker: encodes frames to a GIF off the main thread (R80).
// Message in : { type:"encode", width, height, frames:[ArrayBuffer...], delayCs }
// Messages out: { type:"progress", done, total } ... then { type:"done", bytes } or { type:"error", message }
// The pure parts (validateEncodeMessage, handleEncode) are exported for tests.
import { encodeGif, MAX_FRAMES, MAX_PIXELS, MAX_TOTAL_PIXELS, MAX_DELAY_CS, MIN_DELAY_CS } from "../engine/gif.js";

const isInt = (n) => typeof n === "number" && Number.isInteger(n);

/** @returns {{ok:true,value:object}|{ok:false,reason:string}} */
export function validateEncodeMessage(m) {
  if (!m || typeof m !== "object" || Array.isArray(m)) return { ok: false, reason: "message must be an object" };
  if (m.type !== "encode") return { ok: false, reason: "unknown message type" };
  if (!isInt(m.width) || m.width < 1 || !isInt(m.height) || m.height < 1) return { ok: false, reason: "bad size" };
  if (m.width * m.height > MAX_PIXELS) return { ok: false, reason: "frame too large" };
  if (!Array.isArray(m.frames) || m.frames.length < 1) return { ok: false, reason: "no frames" };
  if (m.frames.length > MAX_FRAMES) return { ok: false, reason: "too many frames" };
  if (m.width * m.height * m.frames.length > MAX_TOTAL_PIXELS) return { ok: false, reason: "too many pixels in total" };
  if (!isInt(m.delayCs) || m.delayCs < MIN_DELAY_CS || m.delayCs > MAX_DELAY_CS) return { ok: false, reason: "bad delay" };
  for (const f of m.frames) {
    if (!(f instanceof ArrayBuffer)) return { ok: false, reason: "frames must be ArrayBuffers" };
    if (f.byteLength !== m.width * m.height * 4) return { ok: false, reason: "frame length does not match size" };
  }
  return { ok: true, value: m };
}

/** Runs one encode job; reports through `post`. Never throws. */
export function handleEncode(msg, post) {
  const v = validateEncodeMessage(msg);
  if (!v.ok) { post({ type: "error", message: v.reason }); return; }
  try {
    const { width, height, frames, delayCs } = v.value;
    const bytes = encodeGif({
      width, height, delayCs,
      frames: frames.map((b) => new Uint8Array(b)),
      onProgress: (done, total) => post({ type: "progress", done, total }),
    });
    post({ type: "done", bytes });
  } catch (e) {
    post({ type: "error", message: e instanceof Error ? e.message : "encode failed" });
  }
}

// Only wire up inside a real worker (not when imported by tests in Node).
if (typeof WorkerGlobalScope !== "undefined" && typeof self !== "undefined" && self instanceof WorkerGlobalScope) {
  self.onmessage = (e) => handleEncode(e.data, (m) => (m.type === "done" ? self.postMessage(m, [m.bytes.buffer]) : self.postMessage(m)));
}
