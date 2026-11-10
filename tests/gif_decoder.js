// Small reference GIF decoder for tests only (not shipped). It is written
// independently of engine/gif.js: it reads the byte layout and decodes LZW the
// textbook way, so a mistake in the encoder is not mirrored here.

export function lzwDecode(minCodeSize, data, pixelCount) {
  const clear = 1 << minCodeSize;
  const eoi = clear + 1;
  let size = minCodeSize + 1;
  let table = [];
  const reset = () => {
    table = [];
    for (let i = 0; i < clear; i++) table.push([i]);
    table.push(null, null); // clear, eoi
    size = minCodeSize + 1;
  };
  reset();
  const out = [];
  let prev = null;
  let bitBuf = 0;
  let bitCnt = 0;
  let pos = 0;
  while (out.length < pixelCount) {
    while (bitCnt < size) {
      if (pos >= data.length) throw new Error("LZW data ended early");
      bitBuf |= data[pos++] << bitCnt;
      bitCnt += 8;
    }
    const code = bitBuf & ((1 << size) - 1);
    bitBuf >>>= size;
    bitCnt -= size;
    if (code === clear) { reset(); prev = null; continue; }
    if (code === eoi) break;
    let entry;
    if (code < table.length) entry = table[code];
    else if (code === table.length && prev) entry = prev.concat(prev[0]);
    else throw new Error(`bad LZW code ${code} (table ${table.length})`);
    for (const v of entry) out.push(v);
    if (prev && table.length < 4096) {
      table.push(prev.concat(entry[0]));
      if (table.length === (1 << size) && size < 12) size++;
    }
    prev = entry;
  }
  if (out.length < pixelCount) throw new Error("LZW produced too few pixels");
  return out.slice(0, pixelCount);
}

export function parseGif(bytes) {
  const b = bytes;
  const ascii = (s, n) => String.fromCharCode(...b.slice(s, s + n));
  const res = { header: ascii(0, 6), frames: [], loop: null, trailer: false, errors: [] };
  res.width = b[6] | (b[7] << 8);
  res.height = b[8] | (b[9] << 8);
  const flags = b[10];
  let p = 13;
  res.gct = null;
  if (flags & 0x80) {
    const n = 2 << (flags & 7);
    res.gct = [];
    for (let i = 0; i < n; i++) res.gct.push([b[p + i * 3], b[p + i * 3 + 1], b[p + i * 3 + 2]]);
    p += n * 3;
  }
  const subBlocks = () => {
    const parts = [];
    while (b[p] !== 0) { parts.push(b.slice(p + 1, p + 1 + b[p])); p += 1 + b[p]; }
    p++;
    return parts;
  };
  let gce = null;
  while (p < b.length) {
    const t = b[p++];
    if (t === 0x3b) { res.trailer = p === b.length; break; }
    if (t === 0x21) {
      const label = b[p++];
      const parts = subBlocks();
      if (label === 0xf9) gce = { delay: parts[0][1] | (parts[0][2] << 8), flags: parts[0][0], transparent: (parts[0][0] & 1) ? parts[0][3] : null, disposal: (parts[0][0] >> 2) & 7 };
      if (label === 0xff && String.fromCharCode(...parts[0]) === "NETSCAPE2.0") {
        res.loop = parts[1][1] | (parts[1][2] << 8);
      }
    } else if (t === 0x2c) {
      const left = b[p] | (b[p + 1] << 8), top = b[p + 2] | (b[p + 3] << 8);
      const w = b[p + 4] | (b[p + 5] << 8), h = b[p + 6] | (b[p + 7] << 8);
      const lflags = b[p + 8];
      p += 9;
      if (lflags & 0x80) res.errors.push("unexpected local color table");
      const minCode = b[p++];
      const parts = subBlocks();
      const data = Uint8Array.from(parts.flatMap((x) => Array.from(x)));
      const indices = lzwDecode(minCode, data, w * h);
      res.frames.push({ left, top, w, h, minCode, indices, delay: gce ? gce.delay : null, transparent: gce ? gce.transparent : null, disposal: gce ? gce.disposal : 0 });
      gce = null;
    } else {
      res.errors.push(`unknown block 0x${t.toString(16)} at ${p - 1}`);
      break;
    }
  }
  return res;
}

// Composes frames onto a screen the way a viewer does: transparent pixels keep
// what was there; disposal 1 (do not dispose) keeps the result for the next
// frame. Returns one array of [r,g,b] per frame (one entry per screen pixel).
export function composeFrames(g) {
  const screen = new Array(g.width * g.height).fill(null);
  const out = [];
  for (const f of g.frames) {
    if (f.disposal !== 1 && f.disposal !== 0) throw new Error(`disposal ${f.disposal} not supported by test decoder`);
    for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
      const idx = f.indices[y * f.w + x];
      if (f.transparent !== null && idx === f.transparent) continue;
      screen[(f.top + y) * g.width + f.left + x] = g.gct[idx];
    }
    out.push(screen.map((c) => (c ? c.slice() : null)));
  }
  return out;
}
