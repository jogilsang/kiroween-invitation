// Pure GIF89a encoder (R77-R80). RGBA frames in, Uint8Array out.
// No DOM, no clock, no randomness, no Node-only globals: same frames, same bytes.
//
// Pipeline: one global palette from all frames (median cut over a 15-bit color
// histogram), 4x4 Bayer ordered dithering when colors had to be reduced,
// variable-width LZW, NETSCAPE2.0 loop block.

export const MAX_FRAMES = 64;
export const MAX_PIXELS = 1_000_000; // per frame
export const MAX_TOTAL_PIXELS = 30_000_000; // all frames
export const MIN_DELAY_CS = 1;
export const MAX_DELAY_CS = 1000;
export const MAX_DIMENSION = 0xffff; // GIF stores sizes in 16 bits
const SAMPLE_LIMIT = 262_144; // pixels looked at when building the palette
const MAX_COLORS = 255; // one of the 256 slots is kept for the transparent index

const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

const isInt = (n) => typeof n === "number" && Number.isInteger(n);

/** Throws RangeError for anything invalid. Touches no frame data. */
function validate({ width, height, frames, delayCs, loop }) {
  if (!isInt(width) || width < 1 || width > MAX_DIMENSION) throw new RangeError("width must be an integer from 1 to 65535");
  if (!isInt(height) || height < 1 || height > MAX_DIMENSION) throw new RangeError("height must be an integer from 1 to 65535");
  if (!Array.isArray(frames) || frames.length < 1) throw new RangeError("frames must be a non-empty array");
  if (frames.length > MAX_FRAMES) throw new RangeError(`at most ${MAX_FRAMES} frames`);
  const px = width * height;
  if (px > MAX_PIXELS) throw new RangeError(`at most ${MAX_PIXELS} pixels per frame`);
  if (px * frames.length > MAX_TOTAL_PIXELS) throw new RangeError(`at most ${MAX_TOTAL_PIXELS} pixels in total`);
  if (!isInt(delayCs) || delayCs < MIN_DELAY_CS || delayCs > MAX_DELAY_CS) throw new RangeError("delayCs must be an integer from 1 to 1000");
  if (!isInt(loop) || loop < 0 || loop > 0xffff) throw new RangeError("loop must be an integer from 0 to 65535");
  for (const f of frames) {
    if (!(f instanceof Uint8Array || f instanceof Uint8ClampedArray)) throw new RangeError("each frame must be a Uint8Array or Uint8ClampedArray");
    if (f.length !== px * 4) throw new RangeError("each frame must hold width*height*4 bytes");
  }
}

// ---- palette -------------------------------------------------------------

const key15 = (r, g, b) => ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);

/** Returns { palette: [[r,g,b],...] (<=MAX_COLORS), exact: boolean }. */
function buildPalette(frames, px) {
  const total = px * frames.length;
  const step = Math.max(1, Math.ceil(total / SAMPLE_LIMIT));
  const cnt = new Uint32Array(32768);
  const sr = new Float64Array(32768), sg = new Float64Array(32768), sb = new Float64Array(32768);
  for (let n = 0; n < total; n += step) {
    const f = frames[(n / px) | 0];
    const i = (n % px) * 4;
    const k = key15(f[i], f[i + 1], f[i + 2]);
    cnt[k]++; sr[k] += f[i]; sg[k] += f[i + 1]; sb[k] += f[i + 2];
  }
  const bins = [];
  for (let k = 0; k < 32768; k++) if (cnt[k]) bins.push(k);
  const avg = (k) => [sr[k] / cnt[k], sg[k] / cnt[k], sb[k] / cnt[k]];
  const mean = (list) => {
    let c = 0, r = 0, g = 0, b = 0;
    for (const k of list) { c += cnt[k]; r += sr[k]; g += sg[k]; b += sb[k]; }
    return [Math.round(r / c), Math.round(g / c), Math.round(b / c)];
  };
  if (bins.length <= MAX_COLORS) return { palette: bins.map((k) => mean([k])), exact: step === 1 };

  // median cut: repeatedly split the box with the most pixels x widest channel
  const spanOf = (list) => {
    const lo = [255, 255, 255], hi = [0, 0, 0];
    for (const k of list) { const a = avg(k); for (let c = 0; c < 3; c++) { if (a[c] < lo[c]) lo[c] = a[c]; if (a[c] > hi[c]) hi[c] = a[c]; } }
    let ch = 0, best = -1;
    for (let c = 0; c < 3; c++) if (hi[c] - lo[c] > best) { best = hi[c] - lo[c]; ch = c; }
    return { ch, span: best };
  };
  const weight = (list) => { let c = 0; for (const k of list) c += cnt[k]; return c; };
  const boxes = [{ list: bins, ...spanOf(bins), w: weight(bins) }];
  while (boxes.length < MAX_COLORS) {
    let bi = -1, bs = -1;
    boxes.forEach((b, i) => { if (b.list.length > 1) { const s = b.w * (b.span + 1); if (s > bs) { bs = s; bi = i; } } });
    if (bi < 0) break;
    const b = boxes[bi];
    const ch = b.ch;
    const sorted = b.list.slice().sort((x, y) => (avg(x)[ch] - avg(y)[ch]) || (x - y));
    let acc = 0, cut = 1;
    for (let i = 0; i < sorted.length - 1; i++) { acc += cnt[sorted[i]]; cut = i + 1; if (acc * 2 >= b.w) break; }
    const left = sorted.slice(0, cut), right = sorted.slice(cut);
    boxes.splice(bi, 1, { list: left, ...spanOf(left), w: weight(left) }, { list: right, ...spanOf(right), w: weight(right) });
  }
  return { palette: boxes.map((b) => mean(b.list)), exact: false };
}

/** Maps every 15-bit color to the nearest palette index (computed lazily). */
function makeMapper(palette) {
  const cache = new Int16Array(32768).fill(-1);
  return (r, g, b) => {
    const k = key15(r, g, b);
    let v = cache[k];
    if (v >= 0) return v;
    const cr = ((k >> 10) << 3) + 4, cg = (((k >> 5) & 31) << 3) + 4, cb = ((k & 31) << 3) + 4;
    let bd = Infinity;
    v = 0;
    for (let i = 0; i < palette.length; i++) {
      const p = palette[i];
      const d = (p[0] - cr) ** 2 + (p[1] - cg) ** 2 + (p[2] - cb) ** 2;
      if (d < bd) { bd = d; v = i; }
    }
    cache[k] = v;
    return v;
  };
}

const clamp = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);

function indexFrame(f, w, h, map, dither) {
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    if (dither) {
      const o = BAYER4[((y & 3) << 2) | (x & 3)] - 8; // -8..7, one bin is 8 wide
      out[y * w + x] = map(clamp(f[i] + o), clamp(f[i + 1] + o), clamp(f[i + 2] + o));
    } else {
      out[y * w + x] = map(f[i], f[i + 1], f[i + 2]);
    }
  }
  return out;
}

// ---- bytes ---------------------------------------------------------------

class ByteSink {
  constructor(cap = 1024) { this.buf = new Uint8Array(cap); this.len = 0; }
  need(n) {
    if (this.len + n <= this.buf.length) return;
    let cap = this.buf.length * 2;
    while (cap < this.len + n) cap *= 2;
    const nb = new Uint8Array(cap);
    nb.set(this.buf.subarray(0, this.len));
    this.buf = nb;
  }
  byte(v) { this.need(1); this.buf[this.len++] = v & 255; }
  u16(v) { this.byte(v); this.byte(v >> 8); }
  ascii(s) { for (let i = 0; i < s.length; i++) this.byte(s.charCodeAt(i)); }
  bytes(a) { this.need(a.length); this.buf.set(a, this.len); this.len += a.length; }
  result() { return this.buf.slice(0, this.len); }
}

/** LZW with variable code width; returns the raw code stream bytes. */
function lzw(indices, minCode) {
  const clear = 1 << minCode, eoi = clear + 1;
  const out = new ByteSink(Math.max(1024, indices.length >> 1));
  let bitBuf = 0, bitCnt = 0;
  const emit = (code, size) => {
    bitBuf |= code << bitCnt;
    bitCnt += size;
    while (bitCnt >= 8) { out.byte(bitBuf & 255); bitBuf >>>= 8; bitCnt -= 8; }
  };
  let size = minCode + 1, next = eoi + 1;
  let dict = new Map();
  emit(clear, size);
  let prefix = indices[0];
  for (let i = 1; i < indices.length; i++) {
    const k = indices[i];
    const key = (prefix << 8) | k;
    const hit = dict.get(key);
    if (hit !== undefined) { prefix = hit; continue; }
    emit(prefix, size);
    if (next < 4096) {
      dict.set(key, next++);
      if (next - 1 === (1 << size) && size < 12) size++;
    } else {
      emit(clear, size);
      dict = new Map();
      size = minCode + 1;
      next = eoi + 1;
    }
    prefix = k;
  }
  emit(prefix, size);
  emit(eoi, size);
  if (bitCnt > 0) out.byte(bitBuf & 255);
  return out.result();
}

/**
 * Encode frames as an animated GIF.
 * @param {{width:number,height:number,frames:(Uint8Array|Uint8ClampedArray)[],
 *   delayCs:number,loop?:number,delta?:boolean,onProgress?:(done:number,total:number)=>void}} opts
 * @returns {Uint8Array}
 * @throws {RangeError} on invalid input, before anything large is allocated.
 */
export function encodeGif(opts) {
  const o = opts && typeof opts === "object" ? opts : {};
  const { width, height, frames, delayCs, loop = 0, onProgress, delta = true } = o;
  validate({ width, height, frames, delayCs, loop });
  const px = width * height;

  const { palette } = buildPalette(frames, px);
  const needsDither = !isExactSet(frames, px);
  const map = makeMapper(palette);

  const transparent = palette.length; // the reserved slot, never a real color
  let bits = 1;
  while ((1 << bits) < transparent + 1) bits++;
  const minCode = Math.max(2, bits);

  const s = new ByteSink(1 << 14);
  s.ascii("GIF89a");
  s.u16(width); s.u16(height);
  s.byte(0x80 | 0x70 | (bits - 1)); // global table, 8-bit color, size
  s.byte(0); s.byte(0);
  for (let i = 0; i < 1 << bits; i++) {
    const c = palette[i] || [0, 0, 0];
    s.byte(c[0]); s.byte(c[1]); s.byte(c[2]);
  }
  // NETSCAPE2.0 loop extension
  s.byte(0x21); s.byte(0xff); s.byte(11); s.ascii("NETSCAPE2.0");
  s.byte(3); s.byte(1); s.u16(loop); s.byte(0);

  let prev = null;
  for (let n = 0; n < frames.length; n++) {
    const idx = indexFrame(frames[n], width, height, map, needsDither);
    // Frame 0 (or delta off): the whole picture. Later frames: only the box
    // around pixels whose palette index changed; unchanged pixels inside the
    // box become the transparent index. Disposal 1 keeps the previous screen.
    let x0 = 0, y0 = 0, w = width, h = height, data = idx;
    if (delta && prev) {
      let minX = width, minY = height, maxX = -1, maxY = -1;
      for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
        if (idx[y * width + x] !== prev[y * width + x]) {
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
      }
      if (maxX < 0) {
        x0 = 0; y0 = 0; w = 1; h = 1; data = Uint8Array.of(transparent);
      } else {
        x0 = minX; y0 = minY; w = maxX - minX + 1; h = maxY - minY + 1;
        data = new Uint8Array(w * h);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const i = (y0 + y) * width + x0 + x;
          data[y * w + x] = idx[i] === prev[i] ? transparent : idx[i];
        }
      }
    }
    prev = idx;
    // graphic control extension: disposal 1, transparent index flagged
    s.byte(0x21); s.byte(0xf9); s.byte(4); s.byte(0x05); s.u16(delayCs); s.byte(transparent); s.byte(0);
    s.byte(0x2c); s.u16(x0); s.u16(y0); s.u16(w); s.u16(h); s.byte(0);
    s.byte(minCode);
    const bytes = lzw(data, minCode);
    for (let p = 0; p < bytes.length; p += 255) {
      const len = Math.min(255, bytes.length - p);
      s.byte(len);
      s.bytes(bytes.subarray(p, p + len));
    }
    s.byte(0);
    if (typeof onProgress === "function") onProgress(n + 1, frames.length);
  }
  s.byte(0x3b);
  return s.result();
}

// Dithering is only used when the palette could not hold every color: then
// each 15-bit bin maps to its own palette entry and nothing needs hiding.
function isExactSet(frames, px) {
  const seen = new Set();
  for (const f of frames) {
    for (let i = 0; i < px; i++) {
      seen.add(key15(f[i * 4], f[i * 4 + 1], f[i * 4 + 2]));
      if (seen.size > MAX_COLORS) return false;
    }
  }
  return true;
}

// ---- size budget (R80) ---------------------------------------------------

// Rough size model, an ESTIMATE (not a measurement of the final app), for the
// encoder WITH inter-frame delta. Evidence: the conductor measured the old
// full-frame encoder in a real browser at 362x362x40 = 2.4 MB, about 0.46
// bytes/pixel/frame. On a synthetic 362x362x40 scene (static dithered glow
// background + one moving blob) delta took 0.041 vs 0.127 for full frames, so
// delta is roughly a third. 0.46 x 0.33 = 0.15; we use 0.2 to stay cautious
// because the real ghost moves more than the blob. The app still checks the
// real byte count and retries once (media-pipeline.md); re-tune from real runs.
export const BYTES_PER_PIXEL_ESTIMATE = 0.1; // measured in a real browser on 2026-11-10: 0.07 (two looks, 572 px, 40 frames, delta frames)
const MIN_SIDE = 64; // below this the ghost is unreadable

/**
 * Suggest an output size that should fit `budgetBytes`.
 * @returns {{width:number,height:number,estimatedBytes:number,fits:boolean}}
 */
export function planGifSize(sourceWidth, sourceHeight, frameCount, budgetBytes) {
  if (!isInt(sourceWidth) || sourceWidth < 1 || !isInt(sourceHeight) || sourceHeight < 1) throw new RangeError("source size must be positive integers");
  if (!isInt(frameCount) || frameCount < 1 || frameCount > MAX_FRAMES) throw new RangeError(`frameCount must be 1 to ${MAX_FRAMES}`);
  if (typeof budgetBytes !== "number" || !(budgetBytes > 0) || !Number.isFinite(budgetBytes)) throw new RangeError("budgetBytes must be a positive number");

  const estimate = (w, h) => Math.ceil(w * h * frameCount * BYTES_PER_PIXEL_ESTIMATE);
  const maxPx = Math.min(MAX_PIXELS, Math.floor(MAX_TOTAL_PIXELS / frameCount));
  const wanted = Math.min(sourceWidth * sourceHeight, maxPx, Math.floor(budgetBytes / (frameCount * BYTES_PER_PIXEL_ESTIMATE)));
  let w = sourceWidth, h = sourceHeight;
  if (sourceWidth * sourceHeight > wanted) {
    const scale = Math.sqrt(wanted / (sourceWidth * sourceHeight));
    // never go below MIN_SIDE on the short side (unless the source is smaller)
    const floor = Math.min(MIN_SIDE, sourceWidth, sourceHeight) / Math.min(sourceWidth, sourceHeight);
    const sc = Math.max(scale, floor);
    w = Math.max(1, Math.floor(sourceWidth * sc));
    h = Math.max(1, Math.floor(sourceHeight * sc));
    // rounding down can still leave us over the pixel cap only if floor won
    while (w * h > maxPx && w > 1 && h > 1) { w--; h--; }
  }
  const estimatedBytes = estimate(w, h);
  return { width: w, height: h, estimatedBytes, fits: estimatedBytes <= budgetBytes };
}
