import test from "node:test";
import assert from "node:assert/strict";
import fc from "fast-check";
import {
  encodeGif, MAX_FRAMES, MAX_PIXELS, MAX_TOTAL_PIXELS,
} from "../engine/gif.js";
import { parseGif, composeFrames } from "./gif_decoder.js";

// Deterministic pseudo-random bytes for test data (no Math.random).
function lcg(seed) {
  let s = seed >>> 0;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s >>> 24; };
}
function noiseFrame(w, h, seed) {
  const r = lcg(seed);
  const f = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) { f[i * 4] = r(); f[i * 4 + 1] = r(); f[i * 4 + 2] = r(); f[i * 4 + 3] = 255; }
  return f;
}
function gradientFrame(w, h, shift = 0) {
  const f = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    f[i] = (x * 255 / Math.max(1, w - 1) + shift) & 255;
    f[i + 1] = y * 255 / Math.max(1, h - 1);
    f[i + 2] = 90; f[i + 3] = 255;
  }
  return f;
}
function solid(w, h, [r, g, b]) {
  const f = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) { f[i * 4] = r; f[i * 4 + 1] = g; f[i * 4 + 2] = b; f[i * 4 + 3] = 255; }
  return f;
}

function checkStructure(bytes, w, h, n, delayCs, loop) {
  const g = parseGif(bytes);
  assert.equal(g.header, "GIF89a");
  assert.equal(g.width, w);
  assert.equal(g.height, h);
  assert.equal(g.frames.length, n);
  assert.equal(g.loop, loop);
  assert.ok(g.trailer, "file must end with 0x3B");
  assert.deepEqual(g.errors, []);
  // the first frame is the whole picture; later ones may be a smaller changed area
  assert.equal(g.frames[0].w, w); assert.equal(g.frames[0].h, h);
  for (const f of g.frames) {
    assert.ok(f.left + f.w <= w && f.top + f.h <= h && f.w >= 1 && f.h >= 1);
    assert.equal(f.delay, delayCs);
  }
  return g;
}

test("test_gif_has_valid_structure", () => {
  const frames = [gradientFrame(20, 12, 0), gradientFrame(20, 12, 40), noiseFrame(20, 12, 7)];
  const bytes = encodeGif({ width: 20, height: 12, frames, delayCs: 6 });
  assert.ok(bytes instanceof Uint8Array);
  checkStructure(bytes, 20, 12, 3, 6, 0);
  // explicit loop count is written as given
  checkStructure(encodeGif({ width: 20, height: 12, frames: [frames[0]], delayCs: 6, loop: 3 }), 20, 12, 1, 6, 3);
});

test("test_gif_has_valid_structure: any valid input (property-based)", () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 1, max: 24 }), fc.integer({ min: 1, max: 24 }),
      fc.integer({ min: 1, max: 4 }), fc.integer({ min: 1, max: 100 }),
      fc.integer({ min: 0, max: 0xffff }),
      (w, h, n, delay, seed) => {
        const frames = [];
        for (let i = 0; i < n; i++) frames.push(noiseFrame(w, h, seed + i));
        const bytes = encodeGif({ width: w, height: h, frames, delayCs: delay });
        checkStructure(bytes, w, h, n, delay, 0);
      },
    ),
    { numRuns: 60 },
  );
});

test("test_gif_is_deterministic", () => {
  const mk = () => [gradientFrame(33, 17, 0), noiseFrame(33, 17, 3)];
  const a = encodeGif({ width: 33, height: 17, frames: mk(), delayCs: 5 });
  const b = encodeGif({ width: 33, height: 17, frames: mk(), delayCs: 5 });
  assert.deepEqual(Array.from(a), Array.from(b));
  // same bytes whether frames are Uint8Array or Uint8ClampedArray
  const c = encodeGif({ width: 33, height: 17, frames: mk().map((f) => new Uint8Array(f)), delayCs: 5 });
  assert.deepEqual(Array.from(a), Array.from(c));
});

test("test_gif_rejects_bad_input", () => {
  const ok = () => [solid(4, 4, [1, 2, 3])];
  const base = { width: 4, height: 4, frames: ok(), delayCs: 5 };
  assert.doesNotThrow(() => encodeGif(base));
  const bad = (patch, label) =>
    assert.throws(() => encodeGif({ ...base, frames: ok(), ...patch }), RangeError, label);
  bad({ frames: [] }, "no frames");
  bad({ frames: undefined }, "frames missing");
  bad({ frames: "x" }, "frames not an array");
  bad({ width: 0 }, "width 0");
  bad({ height: 0 }, "height 0");
  bad({ width: -4 }, "negative width");
  bad({ width: 4.5 }, "fractional width");
  bad({ height: NaN }, "NaN height");
  bad({ frames: [new Uint8ClampedArray(4 * 4 * 4 - 4)] }, "short frame");
  bad({ frames: [solid(4, 4, [0, 0, 0]), new Uint8ClampedArray(8)] }, "length mismatch");
  bad({ frames: [[1, 2, 3, 4]] }, "frame not a typed array");
  bad({ delayCs: 0 }, "delay 0");
  bad({ delayCs: 1001 }, "delay too big");
  bad({ delayCs: 2.5 }, "delay fractional");
  bad({ delayCs: "5" }, "delay string");
  bad({ loop: -1 }, "negative loop");
  bad({ loop: 70000 }, "loop too big");
  // Caps are checked before any frame data is touched: a fake "frame" whose
  // length claims to be huge is refused without allocating.
  const fake = (w, h, n) => ({ width: w, height: h, delayCs: 5, frames: Array.from({ length: n }, () => ({ length: w * h * 4 })) });
  assert.throws(() => encodeGif(fake(4, 4, MAX_FRAMES + 1)), RangeError, "too many frames");
  assert.throws(() => encodeGif(fake(1001, 1000, 1)), RangeError, "too many pixels per frame");
  assert.throws(() => encodeGif(fake(1000, 1000, 31)), RangeError, "too many total pixels");
  assert.equal(MAX_FRAMES, 64);
  assert.equal(MAX_PIXELS, 1_000_000);
  assert.equal(MAX_TOTAL_PIXELS, 30_000_000);
});

function nearest(pal, r, g, b) {
  let best = 0, bd = Infinity;
  pal.forEach((c, i) => {
    const d = (c[0] - r) ** 2 + (c[1] - g) ** 2 + (c[2] - b) ** 2;
    if (d < bd) { bd = d; best = i; }
  });
  return best;
}

test("test_gif_roundtrip_pixels", () => {
  // 1. a solid image comes back exactly
  const s = encodeGif({ width: 9, height: 7, frames: [solid(9, 7, [200, 30, 99])], delayCs: 4 });
  const gs = parseGif(s);
  for (const idx of gs.frames[0].indices) assert.deepEqual(gs.gct[idx], [200, 30, 99]);

  // 2. few colors (no quantizing needed): each pixel decodes to the palette
  // color nearest to the original, which here is the exact color
  const colors = [[0, 0, 0], [255, 255, 255], [248, 8, 8], [8, 248, 8], [8, 8, 248], [120, 64, 200]];
  const w = 31, h = 23;
  const f = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) { const c = colors[(i * 7 + (i >> 3)) % colors.length]; f.set([...c, 255], i * 4); }
  const g = parseGif(encodeGif({ width: w, height: h, frames: [f, f], delayCs: 3 }));
  for (const screen of composeFrames(g)) {
    for (let i = 0; i < w * h; i++) {
      const [r, gg, b] = [f[i * 4], f[i * 4 + 1], f[i * 4 + 2]];
      assert.deepEqual(screen[i], [r, gg, b]);
      assert.deepEqual(screen[i], g.gct[nearest(g.gct, r, gg, b)]);
    }
  }

  // 3. many colors (quantized + dithered): palette has <= 256 entries, every
  // decoded color is close to the original, and the table-reset path of the
  // LZW coder (more than 4096 codes) is exercised by noise.
  for (const frame of [gradientFrame(64, 48), noiseFrame(80, 60, 11)]) {
    const wd = frame === undefined ? 0 : (frame.length / 4 === 64 * 48 ? 64 : 80);
    const hd = frame.length / 4 / wd;
    const q = parseGif(encodeGif({ width: wd, height: hd, frames: [frame], delayCs: 2 }));
    assert.ok(q.gct.length <= 256);
    let total = 0;
    for (let i = 0; i < wd * hd; i++) {
      const c = q.gct[q.frames[0].indices[i]];
      total += Math.abs(c[0] - frame[i * 4]) + Math.abs(c[1] - frame[i * 4 + 1]) + Math.abs(c[2] - frame[i * 4 + 2]);
    }
    const mean = total / (wd * hd * 3);
    const limit = frame[0] === undefined ? 0 : (wd === 64 ? 12 : 40);
    assert.ok(mean < limit, `mean channel error ${mean} should be < ${limit}`);
  }
});

// ---- inter-frame delta (pw_gif2) -------------------------------------------
// Static noisy-gradient background with a square that moves; made like a real
// scene where only the ghost moves.
function movingSquare(w, h, n, count) {
  const bg = gradientFrame(w, h, 0);
  const frames = [];
  for (let k = 0; k < count; k++) {
    const f = bg.slice();
    const x0 = 4 + ((k * 3) % (w - 24)), y0 = 6 + ((k * 2) % (h - 24));
    for (let y = y0; y < y0 + 14; y++) for (let x = x0; x < x0 + 14; x++) f.set([250, 240 - k * 3, 20, 255], (y * w + x) * 4);
    frames.push(f);
  }
  return frames;
}

test("test_gif_delta_roundtrip_matches_full", () => {
  const w = 72, h = 64;
  const frames = movingSquare(w, h, 0, 12);
  frames.push(frames[11].slice(), frames[11].slice()); // identical frames at the end
  frames.splice(3, 0, frames[2].slice()); // and one in the middle
  const args = { width: w, height: h, frames, delayCs: 4 };
  const full = parseGif(encodeGif({ ...args, delta: false }));
  const delta = parseGif(encodeGif(args));
  assert.equal(delta.frames.length, frames.length, "frame count is kept");
  assert.deepEqual(delta.errors, []);
  assert.deepEqual(delta.gct, full.gct, "same palette");
  const a = composeFrames(full), b = composeFrames(delta);
  assert.equal(a.length, b.length);
  for (let n = 0; n < a.length; n++) assert.deepEqual(b[n], a[n], `frame ${n} looks the same`);
  // frame 0 is whole; later frames use the transparent index and disposal 1
  assert.equal(delta.frames[0].w * delta.frames[0].h, w * h);
  assert.ok(delta.frames.slice(1).every((f) => f.transparent !== null && f.disposal === 1));
  assert.ok(delta.frames[1].w * delta.frames[1].h < w * h, "changed area is smaller than the picture");
  // an unchanged frame is a 1x1 transparent pixel
  assert.deepEqual([delta.frames[3].w, delta.frames[3].h], [1, 1]);
  assert.equal(delta.frames[3].indices[0], delta.frames[3].transparent);
  // transparent slot is never a real color: 255 colors at most plus the slot
  assert.ok(delta.gct.length <= 256);
});

test("test_gif_delta_is_smaller_when_background_static", () => {
  const w = 128, h = 128;
  const frames = movingSquare(w, h, 0, 40);
  const args = { width: w, height: h, frames, delayCs: 10 };
  const full = encodeGif({ ...args, delta: false }).length;
  const delta = encodeGif(args).length;
  assert.ok(delta <= full * 0.6, `delta ${delta} bytes should be <= 60% of full ${full}`);
});

test("test_gif_delta_is_deterministic", () => {
  const mk = () => movingSquare(64, 64, 0, 10);
  const a = encodeGif({ width: 64, height: 64, frames: mk(), delayCs: 5 });
  const b = encodeGif({ width: 64, height: 64, frames: mk(), delayCs: 5 });
  assert.deepEqual(Array.from(a), Array.from(b));
});
