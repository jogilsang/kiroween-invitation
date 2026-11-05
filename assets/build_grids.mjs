// assets/build_grids.mjs — deterministic generator for part brightness grids.
// Why: the runtime engine must stay pure (no image decoding). This build step
// produces assets/grids.json once; the engine only reads it.
//
// Each part is drawn from simple analytic shapes into a fixed-size grid of
// brightness values (0..1) or null (transparent). Crisp silhouettes read best
// as ASCII. Hand-tuned, fully deterministic — no randomness, no external deps.
//
// Run: node assets/build_grids.mjs   (writes assets/grids.json)

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const W = 40; // grid width (columns)
const H = 24; // grid height (rows)

function blank() {
  return Array.from({ length: H }, () => Array.from({ length: W }, () => null));
}

// Fill an ellipse centered at (cx,cy) with radii (rx,ry) at brightness b.
function ellipse(grid, cx, cy, rx, ry, b) {
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) grid[y][x] = b;
    }
  }
}

function rect(grid, x0, y0, x1, y1, b) {
  for (let y = Math.max(0, y0); y <= Math.min(H - 1, y1); y++) {
    for (let x = Math.max(0, x0); x <= Math.min(W - 1, x1); x++) grid[y][x] = b;
  }
}

function setCell(grid, x, y, b) {
  if (x >= 0 && x < W && y >= 0 && y < H) grid[y][x] = b;
}

// --- background: faint vignette so dark theme has texture ---
function background() {
  const g = blank();
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dx = (x - W / 2) / (W / 2);
      const dy = (y - H / 2) / (H / 2);
      const d = Math.min(1, Math.sqrt(dx * dx + dy * dy));
      g[y][x] = 0.08 + 0.10 * d; // darker center, lighter edges (inverted later)
    }
  }
  return g;
}

// --- ghost body: rounded top, wavy bottom ---
function ghostBody() {
  const g = blank();
  ellipse(g, 20, 11, 9, 8, 0.7);
  rect(g, 11, 11, 29, 18, 0.7);
  // wavy bottom: three humps
  for (let x = 11; x <= 29; x++) {
    const phase = Math.floor((x - 11) / 3) % 2;
    const bottom = phase === 0 ? 19 : 17;
    for (let y = 18; y <= bottom; y++) setCell(g, x, y, 0.7);
  }
  return g;
}

// --- faces (eyes + mouth), brighter so they stand out ---
function faceMischief() {
  const g = blank();
  ellipse(g, 16, 10, 2, 2.4, 0.0); // hollow eyes (dark)
  ellipse(g, 24, 10, 2, 2.4, 0.0);
  // smirk
  for (let x = 15; x <= 25; x++) setCell(g, x, 15 + ((x % 3 === 0) ? 1 : 0), 0.0);
  return g;
}
function faceSpooky() {
  const g = blank();
  ellipse(g, 16, 10, 2.4, 3, 0.0);
  ellipse(g, 24, 10, 2.4, 3, 0.0);
  ellipse(g, 20, 15, 2.2, 2.6, 0.0); // round howling mouth
  return g;
}
function faceCute() {
  const g = blank();
  ellipse(g, 16, 10, 1.4, 1.6, 0.0);
  ellipse(g, 24, 10, 1.4, 1.6, 0.0);
  for (let x = 17; x <= 23; x++) setCell(g, x, 15, 0.0); // small smile
  setCell(g, 16, 14, 0.0); setCell(g, 24, 14, 0.0);
  return g;
}

// --- pumpkin: sits lower, bright orange-ish (single brightness) ---
function pumpkin() {
  const g = blank();
  ellipse(g, 20, 20, 10, 5, 0.85);
  rect(g, 19, 13, 20, 15, 0.5); // stem
  return g;
}

// --- decoration parts ---
function hat() {
  const g = blank();
  // witch hat cone above the head
  for (let y = 0; y <= 6; y++) {
    const half = Math.max(0, 6 - y);
    rect(g, 20 - half, y, 20 + half, y, 0.95);
  }
  rect(g, 12, 6, 28, 7, 0.95); // brim
  return g;
}
function horns() {
  const g = blank();
  for (let y = 0; y <= 5; y++) { setCell(g, 13 + y, 6 - y, 0.95); setCell(g, 27 - y, 6 - y, 0.95); }
  return g;
}
function cobweb() {
  const g = blank();
  for (let i = 0; i <= 6; i++) { setCell(g, i, i, 0.6); setCell(g, i + 1, i, 0.6); }
  for (let i = 0; i <= 6; i++) setCell(g, i, 6 - i + 6, 0.5);
  return g;
}
function bats() {
  const g = blank();
  // two little bats top-right
  for (const bx of [32, 36]) {
    setCell(g, bx, 2, 0.9); setCell(g, bx - 1, 1, 0.9); setCell(g, bx + 1, 1, 0.9);
    setCell(g, bx - 2, 2, 0.9); setCell(g, bx + 2, 2, 0.9);
  }
  return g;
}
function candle() {
  const g = blank();
  rect(g, 4, 18, 6, 22, 0.8); // candle body bottom-left
  setCell(g, 5, 16, 1.0); setCell(g, 5, 17, 0.95); // flame
  return g;
}

const grids = {
  meta: { w: W, h: H, note: "brightness 0..1 or null; built by build_grids.mjs; deterministic" },
  background: background(),
  pumpkin: pumpkin(),
  ghostBody: ghostBody(),
  faces: { mischief: faceMischief(), spooky: faceSpooky(), cute: faceCute() },
  parts: { hat: hat(), horns: horns(), cobweb: cobweb(), bats: bats(), candle: candle() },
};

const here = dirname(fileURLToPath(import.meta.url));
writeFileSync(join(here, "grids.json"), JSON.stringify(grids), "utf8");
console.log(`wrote grids.json (${W}x${H})`);
