// engine/svg.js — deterministic SVG invitation renderer. Pure.
// No DOM, no network, no Math.random, no Date.now. Same config -> same bytes.
// Model says, code decides: colors, layout, glow are all code constants.

import { buildInviteText, escapeXml, SWATCHES } from "./invite.js";
import { skull, cat, cobweb, candle, tombstone, crow, pumpkins } from "./assets.js";
import { COSTUME_DRAW } from "./costumes.js";
import { SCENE_DRAW } from "./scenes.js";
import { resolveParts } from "./compose.js";
import { fitAttrs } from "./fit.js";

export const CANVAS = 1080;
// Widest a line of text may be: the frame is 1008 wide, keep a margin on both sides.
const FIT_W = 940;

export const PALETTE_COLORS = {
  deeppurple: { bg0: "#0a0416", bg1: "#2a0b52", glow: "#b14bff", accent: "#ff7a18", mist: "#7b2ff7" },
  magenta:    { bg0: "#120318", bg1: "#4a0b40", glow: "#ff2ea0", accent: "#ff9d3c", mist: "#c13af0" },
  indigo:     { bg0: "#05031a", bg1: "#151563", glow: "#6c7bff", accent: "#ffc23c", mist: "#4b5bff" },
};

/**
 * Deterministic 32-bit seed from a normalized config (FNV-1a).
 * Used only for small layout jitter (fog, bats); never for colors or outcome.
 * @param {object} cfg
 * @returns {number}
 */
export function deriveSeed(cfg) {
  const s = JSON.stringify({
    p: cfg.purpose, y: cfg.year, n: cfg.nick,
    m: cfg.mood, pa: cfg.palette, g: cfg.glow,
    parts: cfg.ghost && cfg.ghost.parts,
  });
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}

// Seed from the fields that define the "look" only. Assets, tints and event text
// are deliberately excluded so toggling them never reshapes the ghost or the fog.
function baseSeed(cfg) {
  return deriveSeed({ ...cfg, ghost: { parts: [] }, tints: {}, event: {} });
}

// mulberry32 PRNG seeded from the config — deterministic positions.
function rng(seedInt) {
  let a = seedInt >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hexChan(h, ch) {
  const n = parseInt(h.slice(1), 16);
  return ([(n >> 16) & 255, (n >> 8) & 255, n & 255][ch] / 255).toFixed(3);
}

// --- Round, plump white ghost with a flat, wavy skirt (drawn here, not copied) ---
// Geometry only. `tail` are three hem sway offsets in px (all 0 at rest); they move
// only the CONTROL points of each hem wave, never the corners, so the path always
// closes at the left hem corner and stays under the body.
function ghostGeometry(cx, cy, s, rand, tail) {
  const top = cy - 250 * s;
  const halfW = 118 * s;
  const hemY = cy + 100 * s;
  const shoulderY = cy - 40 * s;
  const shoulderW = 122 * s;
  const drips = 5;
  const step = (halfW * 2) / drips;
  let hem = "";
  for (let i = 0; i < drips; i++) {
    const d = (14 + rand() * 12) * s;
    const w = tail[i % 3] * s;
    // The body path arrives at the RIGHT hem corner, so the hem must run back
    // LEFT (negative dx) and end exactly at the left corner, where Z closes it.
    hem += ` q ${-step * 0.25 + w} ${d} ${-step * 0.5} ${d * 0.45} q ${-step * 0.25 - w} ${-d} ${-step * 0.5} ${-d * 0.45}`;
  }
  const f = (n) => Number(n.toFixed(3));
  const body = `
    M ${f(cx - halfW)} ${f(hemY)}
    C ${f(cx - halfW - 20 * s)} ${f(hemY - 60 * s)}, ${f(cx - shoulderW - 8 * s)} ${f(shoulderY + 50 * s)}, ${f(cx - shoulderW)} ${f(shoulderY)}
    C ${f(cx - shoulderW - 14 * s)} ${f(top + 20 * s)}, ${f(cx - 66 * s)} ${f(top)}, ${f(cx)} ${f(top)}
    C ${f(cx + 66 * s)} ${f(top)}, ${f(cx + shoulderW + 14 * s)} ${f(top + 20 * s)}, ${f(cx + shoulderW)} ${f(shoulderY)}
    C ${f(cx + shoulderW + 8 * s)} ${f(shoulderY + 50 * s)}, ${f(cx + halfW + 20 * s)} ${f(hemY - 60 * s)}, ${f(cx + halfW)} ${f(hemY)}
    ${hem} Z`;
  const rim = `M ${f(cx + halfW)} ${f(hemY)} ${hem}`;
  return { body, rim };
}

// --- Safe, clamped numbers from a caller-supplied pose / spring (R72, R74) ---
const num = (v, d, lo, hi) => (typeof v === "number" && Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d);
const r3 = (n) => Number(n.toFixed(3));
function cleanMotion(opts) {
  const has = opts && (opts.pose || opts.spring);
  if (!has) return null;
  const p = opts.pose && typeof opts.pose === "object" ? opts.pose : {};
  const sp = opts.spring && typeof opts.spring === "object" ? opts.spring : {};
  const press = num(sp.x, 0, -1.5, 1.5);
  // Pressing squashes (shorter, wider) and keeps volume: scaleX * scaleY stays the pose's.
  const squash = 1 - 0.18 * press;
  const scaleY = Math.max(0.6, Math.min(1.5, num(p.scaleY, 1, 0.7, 1.4) * squash));
  const scaleX = Math.max(0.6, Math.min(1.5, num(p.scaleX, 1, 0.7, 1.4) / squash));
  const tw = Array.isArray(p.tailWave) ? p.tailWave : [];
  return {
    bobY: num(p.bobY, 0, -40, 40),
    scaleX, scaleY,
    tail: [0, 1, 2].map((i) => num(tw[i], 0, -30, 30)),
    blink: num(p.blink, 0, 0, 1),
    glow: num(p.glow, 1, 0.5, 1.5),
    eyeShiftX: num(p.eyeShiftX, 0, -10, 10),
  };
}
const REST_TAIL = [0, 0, 0];
const GHOST_CX = CANVAS / 2, GHOST_CY = 430, GHOST_S = 1.05;

/**
 * The ghost body outline for a pose. A live preview can set this as the `d` of
 * #ghostBody (and #ghostClipBody) instead of rebuilding the whole SVG.
 * @param {object} cfg normalized config
 * @param {object} [p] pose from engine/pose.js
 * @returns {string} SVG path data
 */
export function ghostPathD(cfg, p) {
  const m = cleanMotion({ pose: p || {} });
  return ghostGeometry(GHOST_CX, GHOST_CY, GHOST_S, rng(baseSeed(cfg) ^ 0x1111), m ? m.tail : REST_TAIL).body;
}

const rigTransform = (m, cx, hemY) =>
  `translate(0 ${r3(m.bobY)}) translate(${cx} ${hemY}) scale(${r3(m.scaleX)} ${r3(m.scaleY)}) translate(${-cx} ${-hemY})`;
const eyesTransform = (m, eyeY) =>
  `translate(${r3(m.eyeShiftX)} ${r3(eyeY * m.blink * 0.92)}) scale(1 ${r3(1 - 0.92 * m.blink)})`;

/**
 * The attributes a live preview sets on the already-rendered ghost, one call per frame,
 * instead of rebuilding the whole SVG. Same numbers as renderSvg(cfg, {pose, spring}). (R72)
 * @param {object} cfg normalized config
 * @param {object} p pose from engine/pose.js
 * @param {object} [sp] spring state from engine/spring.js
 * @returns {{rig:string, eyes:string, haloOpacity:number, bodyD:string, rimD:string}}
 */
export function poseAttrs(cfg, p, sp) {
  const m = cleanMotion({ pose: p || {}, spring: sp || {} });
  const s = GHOST_S, cy = GHOST_CY, cx = GHOST_CX;
  const g = ghostGeometry(cx, cy, s, rng(baseSeed(cfg) ^ 0x1111), m.tail);
  return {
    rig: rigTransform(m, cx, cy + 100 * s),
    eyes: eyesTransform(m, cy - 140 * s),
    haloOpacity: r3(Math.min(1, 0.8 * m.glow)),
    bodyD: g.body,
    rimD: g.rim,
  };
}

function ghost(cx, cy, s, rand, mood, m, pal) {
  const { body, rim } = ghostGeometry(cx, cy, s, rand, m ? m.tail : REST_TAIL);
  const top = cy - 250 * s;
  const hemY = cy + 100 * s;

  // Two tall oval eyes; the mood only tilts and stretches them.
  const eyeY = cy - 140 * s;
  const ry = mood === "screaming" ? 34 : mood === "hollow" ? 24 : 28;
  const eye = (ex, tilt) => `
    <g transform="rotate(${tilt} ${ex} ${eyeY})">
      <ellipse cx="${ex}" cy="${eyeY}" rx="${15 * s}" ry="${ry * s}" fill="#050208"/>
      <ellipse cx="${ex - 4 * s}" cy="${eyeY - ry * 0.4 * s}" rx="${4.5 * s}" ry="${7 * s}" fill="#ffffff" opacity="0.8"/>
    </g>`;
  const eyeT = m
    ? ` data-pose="eyes" transform="${eyesTransform(m, eyeY)}"`
    : "";

  // Moods 4-8: closed arcs, lids, round eyes. Paths only, no text.
  const ink = "#050208";
  const arc = (ex, w) => `
    <path d="M ${ex - 15 * s} ${eyeY + 6 * s} q ${15 * s} ${-26 * s} ${30 * s} 0" fill="none" stroke="${ink}" stroke-width="${w * s}" stroke-linecap="round"/>`;
  const lidded = (ex) => `
    <path d="M ${ex - 15 * s} ${eyeY} a ${15 * s} ${15 * s} 0 0 0 ${30 * s} 0 Z" fill="${ink}"/>
    <path d="M ${ex - 17 * s} ${eyeY} h ${34 * s}" stroke="${ink}" stroke-width="${4 * s}" stroke-linecap="round"/>
    <ellipse cx="${ex - 4 * s}" cy="${eyeY + 7 * s}" rx="${3 * s}" ry="${3.5 * s}" fill="#ffffff" opacity="0.7"/>`;
  const round = (ex) => `
    <ellipse cx="${ex}" cy="${eyeY}" rx="${19 * s}" ry="${34 * s}" fill="${ink}"/>
    <ellipse cx="${ex - 5 * s}" cy="${eyeY - 13 * s}" rx="${6 * s}" ry="${9 * s}" fill="#ffffff" opacity="0.85"/>`;
  const eyePair = {
    wink: () => `${eye(cx - 40 * s, -6)}${arc(cx + 40 * s, 5)}`,
    sleepy: () => `${lidded(cx - 40 * s)}${lidded(cx + 40 * s)}`,
    surprised: () => `${round(cx - 40 * s)}${round(cx + 40 * s)}`,
    joy: () => `${arc(cx - 40 * s, 6)}${arc(cx + 40 * s, 6)}`,
  }[mood];
  const eyesInner = eyePair
    ? eyePair()
    : `${eye(cx - 40 * s, -6)}
      ${eye(cx + 40 * s, 6)}`;
  const cheeks = mood === "blush"
    ? `<g data-feature="cheeks">
      <ellipse cx="${cx - 66 * s}" cy="${eyeY + 46 * s}" rx="${19 * s}" ry="${10 * s}" fill="#ff5fa2" opacity="0.5"/>
      <ellipse cx="${cx + 66 * s}" cy="${eyeY + 46 * s}" rx="${19 * s}" ry="${10 * s}" fill="#ff5fa2" opacity="0.5"/>
      </g>`
    : "";

  const mawY = cy - 72 * s;
  const mawNew = {
    wink: `<path d="M ${cx - 24 * s} ${mawY + 2 * s} q ${22 * s} ${30 * s} ${48 * s} ${-12 * s} q ${-24 * s} ${12 * s} ${-48 * s} ${12 * s} Z" fill="${ink}"/>`,
    sleepy: `<ellipse cx="${cx}" cy="${mawY + 8 * s}" rx="${9 * s}" ry="${6 * s}" fill="${ink}"/>`,
    surprised: `<ellipse cx="${cx}" cy="${mawY + 10 * s}" rx="${12 * s}" ry="${13 * s}" fill="${ink}"/>`,
    blush: `<path d="M ${cx - 18 * s} ${mawY + 2 * s} q ${18 * s} ${22 * s} ${36 * s} 0 q ${-18 * s} ${8 * s} ${-36 * s} 0 Z" fill="${ink}"/>`,
    joy: `<path d="M ${cx - 36 * s} ${mawY - 6 * s} h ${72 * s} q 0 ${40 * s} ${-36 * s} ${40 * s} q ${-36 * s} 0 ${-36 * s} ${-40 * s} Z" fill="${ink}"/>`,
  }[mood];
  let maw;
  if (mawNew) {
    maw = mawNew;
  } else if (mood === "screaming") {
    maw = `<ellipse cx="${cx}" cy="${mawY + 10 * s}" rx="${22 * s}" ry="${40 * s}" fill="#050208"/>`;
  } else if (mood === "hollow") {
    maw = `<path d="M ${cx - 22 * s} ${mawY - 12 * s} q ${22 * s} ${-9 * s} ${44 * s} 0
             q ${-6 * s} ${28 * s} ${-22 * s} ${28 * s} q ${-16 * s} 0 ${-22 * s} ${-28 * s} Z" fill="#050208"/>`;
  } else {
    maw = `<path d="M ${cx - 28 * s} ${mawY - 2 * s}
             q ${19 * s} ${24 * s} ${34 * s} ${6 * s} q ${11 * s} ${-12 * s} ${22 * s} ${4 * s}
             q ${-10 * s} ${26 * s} ${-26 * s} ${26 * s} q ${-20 * s} 0 ${-30 * s} ${-36 * s} Z" fill="#050208"/>`;
  }

  const haloA = m ? Math.min(1, 0.8 * m.glow) : 0.8;
  const rig = m
    ? ` data-pose="rig" transform="${rigTransform(m, cx, hemY)}"`
    : "";
  const svg = `
    <g id="ghostRig"${rig}>
    <ellipse id="ghostGlowLayer" cx="${cx}" cy="${cy - 50 * s}" rx="${200 * s}" ry="${250 * s}" fill="url(#ghostHalo)" opacity="${r3(haloA)}"/>
    <g filter="url(#ghostGlow)">
      <path id="ghostBody" d="${body}" fill="url(#ghostFill)" stroke="#efe6ff" stroke-opacity="0.28" stroke-width="2"/>
      <path id="ghostRimStroke" d="${body}" fill="none" stroke="url(#ghostRim)" stroke-width="5"/>
      <path id="ghostTail" d="${rim}" fill="none" stroke="#ffffff" stroke-opacity="0.35" stroke-width="3" stroke-linecap="round"/>
      <ellipse cx="${cx - 58 * s}" cy="${top + 62 * s}" rx="${36 * s}" ry="${20 * s}" transform="rotate(-32 ${cx - 58 * s} ${top + 62 * s})" fill="url(#ghostGloss)"/>
      <g id="ghostEyes"${eyeT}>
      ${eyesInner}
      </g>
      ${cheeks}${maw}
    </g>`;
  return { svg, body };
}

// --- Twisted jack-o'-pumpkin with jagged grin and inner fire glow ---
function pumpkin(cx, cy, s) {
  const lobe = (dx, rx, ry, skew) => `<ellipse cx="${cx + dx}" cy="${cy}" rx="${rx}" ry="${ry}"
    fill="url(#pumpkinFill)" transform="rotate(${skew} ${cx + dx} ${cy})"/>`;
  return `
    <g filter="url(#pumpkinGlow)">
      ${lobe(-54 * s, 40 * s, 74 * s, -8)} ${lobe(54 * s, 44 * s, 70 * s, 10)}
      ${lobe(-28 * s, 52 * s, 80 * s, -4)} ${lobe(30 * s, 50 * s, 78 * s, 5)}
      ${lobe(0, 66 * s, 84 * s, 0)}
      <path d="M ${cx - 4 * s} ${cy - 104 * s} q ${-10 * s} ${-18 * s} ${6 * s} ${-26 * s}
               q ${12 * s} ${4 * s} ${6 * s} ${22 * s} Z" fill="#3d6b2f"/>
      <g fill="url(#carveGlow)">
        <polygon points="${cx - 40 * s},${cy - 26 * s} ${cx - 10 * s},${cy - 30 * s} ${cx - 22 * s},${cy - 4 * s}"/>
        <polygon points="${cx + 42 * s},${cy - 30 * s} ${cx + 12 * s},${cy - 24 * s} ${cx + 26 * s},${cy - 2 * s}"/>
        <polygon points="${cx},${cy - 6 * s} ${cx - 8 * s},${cy + 8 * s} ${cx + 8 * s},${cy + 8 * s}"/>
        <path d="M ${cx - 52 * s} ${cy + 24 * s}
                 l ${12 * s} ${20 * s} l ${10 * s} ${-16 * s} l ${12 * s} ${22 * s}
                 l ${10 * s} ${-18 * s} l ${12 * s} ${20 * s} l ${10 * s} ${-16 * s} l ${12 * s} ${18 * s}
                 l ${8 * s} ${-14 * s} l ${-6 * s} ${26 * s} l ${-96 * s} 0 Z"/>
      </g>
    </g>`;
}

function bats(rand, c) {
  let out = "";
  for (let i = 0; i < 6; i++) {
    const x = 90 + rand() * (CANVAS - 180), y = 110 + rand() * 300, s = 0.5 + rand() * 0.9;
    out += `<path transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${s.toFixed(3)})"
      d="M0 0 q -16 -14 -30 -5 q 12 -2 14 9 q 9 -11 16 -2 q 7 -9 16 2 q 2 -11 14 -9 q -14 -9 -30 5 q -7 7 -14 2 q -7 5 -16 -2 Z"
      fill="#070311" stroke="${c}" stroke-opacity="${c === "none" ? 0 : 0.7}" stroke-width="1.6" opacity="0.9"/>`;
  }
  return `<g data-part="bats">${out}</g>`;
}

// --- Headwear (hat / horns). Drawn on top of the ghost's head. Pure shapes. ---
// Ghost head top is at cy - 250*s. Tips stay below the banner text (y ~ 104).
function hat(cx, headTopY, pal, c) {
  const tipY = headTopY - 52;
  const brimY = headTopY + 22;
  return `<g data-part="hat">
      <path d="M ${cx - 74} ${brimY} L ${cx - 12} ${tipY + 6} Q ${cx + 8} ${tipY - 6} ${cx + 34} ${tipY + 26}
               L ${cx + 74} ${brimY} Z" fill="#0b0414" stroke="${pal.glow}" stroke-opacity="0.55" stroke-width="2"/>
      <rect x="${cx - 82}" y="${brimY - 6}" width="164" height="14" rx="7" fill="#0b0414" stroke="${pal.glow}" stroke-opacity="0.55" stroke-width="2"/>
      <rect x="${cx - 62}" y="${brimY - 22}" width="124" height="12" fill="${c}" opacity="0.85"/>
    </g>`;
}

function horns(cx, headTopY, pal, c) {
  const y0 = headTopY + 34;
  const side = (sign) => `<path d="M ${cx + sign * 58} ${y0}
      C ${cx + sign * 84} ${y0 - 6}, ${cx + sign * 96} ${y0 - 44}, ${cx + sign * 78} ${y0 - 84}
      C ${cx + sign * 74} ${y0 - 50}, ${cx + sign * 56} ${y0 - 30}, ${cx + sign * 34} ${y0 - 14} Z"
      fill="#12061c" stroke="${c}" stroke-opacity="0.8" stroke-width="2"/>`;
  return `<g data-part="horns">${side(-1)}${side(1)}</g>`;
}

function moon(cx, cy, r, pal, c) {
  return `<g data-part="moon" filter="url(#moonGlow)">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}" opacity="0.92"/>
      <circle cx="${cx + r * 0.3}" cy="${cy - r * 0.12}" r="${r}" fill="${pal.bg0}" opacity="0.92"/>
    </g>`;
}

/**
 * Render the full invitation as a deterministic SVG string.
 * @param {object} cfg normalized config (from normalizeConfig().value)
 * @returns {string} an SVG document string
 */
function renderSquare(cfg, motion) {
  const pal = PALETTE_COLORS[cfg.palette] || PALETTE_COLORS.magenta;
  const strong = cfg.glow === "strong";
  // Independent seeded streams (R26): the ghost hem, the bats and the fog each
  // get their own stream derived from the stable "look" seed, so toggling any
  // asset or tint can never reshape the ghost or reshuffle the fog.
  const seed = baseSeed(cfg);
  const hemRand = rng(seed ^ 0x1111);
  const batRand = rng(seed ^ 0x2222);
  const t = buildInviteText(cfg);
  const { parts } = resolveParts(cfg);
  const has = (p) => parts.includes(p);
  const W = CANVAS, H = CANVAS;

  // Color for an asset: the chosen swatch, else that asset's default (R23).
  const DEFAULT_COLOR = {
    moon: "#e9dcff", bats: "none", hat: pal.accent, horns: pal.glow,
    skull: SWATCHES.bone, cat: SWATCHES.green, cobweb: SWATCHES.bone,
    candle: SWATCHES.orange, tombstone: SWATCHES.purple, crow: SWATCHES.blood,
    pumpkins: SWATCHES.orange,
  };
  const tints = cfg.tints || {};
  const COSTUME_COLOR = { dracula: "#9b1b30", mummy: SWATCHES.bone, pirate: "#e8e8f0", skeleton: SWATCHES.bone };
  const col = (id) => (tints[id] && SWATCHES[tints[id]]) || DEFAULT_COLOR[id];

  const moonSVG = has("moon") ? moon(W - 230, 250, 96, pal, col("moon")) : "";
  const batsSVG = has("bats") ? bats(batRand, col("bats")) : "";
  const fogSeed = seed % 100;
  const ghostCy = 430, ghostS = 1.05;
  const headTopY = ghostCy - 250 * ghostS;
  const headwearSVG = has("hat") ? hat(W / 2, headTopY, pal, col("hat"))
    : has("horns") ? horns(W / 2, headTopY, pal, col("horns")) : "";

  // Ghost first: we need its body path for the costume clip (R30).
  const ghostParts = ghost(W / 2, ghostCy, ghostS, hemRand, cfg.mood, motion, pal);
  const costumeId = cfg.costume && cfg.costume !== "none" ? cfg.costume : null;
  const costumeSVG = costumeId
    ? COSTUME_DRAW[costumeId](W / 2, ghostCy, ghostS, (tints[costumeId] && SWATCHES[tints[costumeId]]) || COSTUME_COLOR[costumeId])
    : "";
  const sceneDraw = SCENE_DRAW[cfg.scene];
  const sceneSVG = sceneDraw ? sceneDraw(pal.accent) : "";

  // Props: fixed slots chosen so nothing overlaps the ghost, the pumpkin or the text.
  const propsSVG = [
    has("cobweb") ? cobweb(36, 36, 1, col("cobweb")) : "",
    has("crow") ? crow(190, 395, 1, col("crow")) : "",
    has("cat") ? cat(230, 745, 1.1, col("cat")) : "",
    has("skull") ? skull(372, 815, 0.9, col("skull")) : "",
    has("candle") ? candle(715, 790, 1, col("candle")) : "",
    has("tombstone") ? tombstone(838, 725, 1.1, col("tombstone")) : "",
    has("pumpkins") ? pumpkins(948, 852, 0.8, col("pumpkins")) : "",
  ].join("\n  ");

  const banner = escapeXml(t.meta.banner);
  const title = escapeXml(t.title);
  const sub = escapeXml(t.lines[0]);
  const foot = escapeXml(`${cfg.palette.toUpperCase()} · ${cfg.glow.toUpperCase()} GLOW · ${cfg.mood.toUpperCase()}`);
  const ariaTitle = escapeXml(`${t.title} — ${t.meta.banner}`);
  // Event line (R24): replaces the style footer when present.
  const details = t.meta.details;
  const detailsSVG = details
    ? `<text data-part="details" x="${W / 2}" y="${H - 50}" text-anchor="middle" fill="#efe6ff" font-size="24" letter-spacing="1"${fitAttrs(details, 24, FIT_W, 1)}>${escapeXml(details)}</text>`
    : `<text x="${W / 2}" y="${H - 54}" text-anchor="middle" fill="#efe6ff" font-size="16" opacity="0.55" letter-spacing="3">${foot}</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Georgia, 'Times New Roman', serif" role="img" aria-label="${ariaTitle}">
  <title>${ariaTitle}</title>
  <defs>
    <radialGradient id="bg" cx="50%" cy="34%" r="80%">
      <stop offset="0%" stop-color="${pal.bg1}"/><stop offset="60%" stop-color="${pal.bg0}"/><stop offset="100%" stop-color="#030109"/>
    </radialGradient>
    <radialGradient id="ghostFill" cx="50%" cy="38%" r="72%">
      <stop offset="0%" stop-color="#ffffff"/><stop offset="62%" stop-color="#e9ddff"/><stop offset="100%" stop-color="#9f86d8"/>
    </radialGradient>
    <radialGradient id="ghostHalo" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${pal.glow}" stop-opacity="0.32"/><stop offset="100%" stop-color="${pal.glow}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="ghostGloss" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.85"/><stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="ghostRim" x1="0" y1="0" x2="1" y2="0">
      <stop offset="55%" stop-color="#d9c4ff" stop-opacity="0"/><stop offset="100%" stop-color="#d9c4ff" stop-opacity="0.85"/>
    </linearGradient>
    <radialGradient id="pumpkinFill" cx="46%" cy="36%" r="74%">
      <stop offset="0%" stop-color="${pal.accent}"/><stop offset="100%" stop-color="#8f3608"/>
    </radialGradient>
    <radialGradient id="carveGlow" cx="50%" cy="50%" r="60%">
      <stop offset="0%" stop-color="#fff2c2"/><stop offset="45%" stop-color="${pal.accent}"/><stop offset="100%" stop-color="#1a0b10"/>
    </radialGradient>
    <radialGradient id="vignette" cx="50%" cy="46%" r="70%">
      <stop offset="60%" stop-color="#000000" stop-opacity="0"/><stop offset="100%" stop-color="#000000" stop-opacity="0.7"/>
    </radialGradient>
    <filter id="ghostGlow" x="-70%" y="-70%" width="240%" height="240%">
      <feGaussianBlur stdDeviation="${strong ? 30 : 16}" result="b"/>
      <feColorMatrix in="b" type="matrix" values="0 0 0 0 ${hexChan(pal.glow,0)}  0 0 0 0 ${hexChan(pal.glow,1)}  0 0 0 0 ${hexChan(pal.glow,2)}  0 0 0 1 0" result="g"/>
      <feMerge><feMergeNode in="g"/><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="pumpkinGlow" x="-70%" y="-70%" width="240%" height="240%">
      <feGaussianBlur stdDeviation="${strong ? 20 : 11}" result="b"/>
      <feColorMatrix in="b" type="matrix" values="0 0 0 0 1  0 0 0 0 0.5  0 0 0 0 0.08  0 0 0 0.95 0" result="g"/>
      <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    ${costumeId ? `<clipPath id="ghostClip"><path id="ghostClipBody" d="${ghostParts.body}"/></clipPath>` : ""}
    <filter id="propGlow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="${strong ? 9 : 5}" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="moonGlow" x="-90%" y="-90%" width="280%" height="280%">
      <feGaussianBlur stdDeviation="22"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="fog" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves="3" seed="${fogSeed}" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 ${hexChan(pal.mist,0)}  0 0 0 0 ${hexChan(pal.mist,1)}  0 0 0 0 ${hexChan(pal.mist,2)}  0 0 0 ${strong ? 0.5 : 0.32} 0"/>
    </filter>
    <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.05 0"/></filter>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${sceneSVG}
  <rect y="${H * 0.45}" width="${W}" height="${H * 0.55}" filter="url(#fog)" opacity="0.9"/>
  ${moonSVG}
  ${batsSVG}
  ${propsSVG}
  ${ghostParts.svg}
  ${costumeSVG}
  ${headwearSVG}
  </g>
  ${pumpkin(W / 2, 760, 1.05)}
  <rect width="${W}" height="${H}" fill="url(#vignette)"/>
  <rect width="${W}" height="${H}" filter="url(#grain)" opacity="0.5"/>
  <rect x="36" y="36" width="${W - 72}" height="${H - 72}" fill="none" stroke="${pal.glow}" stroke-opacity="0.45" stroke-width="2" rx="16"/>

  <text x="${W / 2}" y="104" text-anchor="middle" fill="${pal.accent}" font-size="28" letter-spacing="12" opacity="0.9">${banner}</text>
  <text x="${W / 2}" y="930" text-anchor="middle" fill="#ffffff" font-size="56" letter-spacing="3" font-weight="bold" filter="url(#ghostGlow)"${fitAttrs(t.title, 56, FIT_W, 3)}>${title}</text>
  <text x="${W / 2}" y="982" text-anchor="middle" fill="${pal.glow}" font-size="25"${fitAttrs(t.lines[0], 25, FIT_W)}>${sub}</text>
  ${detailsSVG}
</svg>`;
}

// ---------------------------------------------------------------------------
// Export sizes (R34, R35). The square artwork is never cropped or rescaled; the
// story and wide formats place it, whole, in the middle of a larger canvas whose
// remaining space is filled with a palette-matched backdrop.
// ---------------------------------------------------------------------------
export const FORMATS = ["square", "story", "wide"];
const SIZES = { square: [1080, 1080], story: [1080, 1920], wide: [1920, 1080] };

/** @param {string} format @returns {{width:number,height:number}} */
export function formatSize(format) {
  const own = typeof format === "string" && Object.hasOwn(SIZES, format);
  const [width, height] = own ? SIZES[format] : SIZES.square;
  return { width, height };
}

/**
 * Render the invitation as a deterministic SVG string.
 * @param {object} cfg normalized config
 * @param {{format?: string, pose?: object, spring?: {x:number,v:number}}} [opts]
 *   format: square (default) | story | wide. pose (engine/pose.js) and spring
 *   (engine/spring.js) are optional; without them the output has no motion transforms.
 * @returns {string}
 */
export function renderSvg(cfg, opts = {}) {
  const square = renderSquare(cfg, cleanMotion(opts));
  const format = opts && FORMATS.includes(opts.format) ? opts.format : "square";
  if (format === "square") return square;

  const { width: W, height: H } = formatSize(format);
  const pal = PALETTE_COLORS[cfg.palette] || PALETTE_COLORS.magenta;
  const x = (W - CANVAS) / 2;
  const y = (H - CANVAS) / 2;
  // Nested artwork keeps its own ids; the backdrop uses a "bk-" prefix so they never collide.
  const nested = square.replace(/^<svg [^>]*>/, (open) =>
    open
      .replace(/ role="img" aria-label="[^"]*"/, "")
      .replace(/^<svg /, `<svg data-artwork="square" x="${x}" y="${y}" `));
  const fogSeed = baseSeed(cfg) % 100;
  const strong = cfg.glow === "strong";
  const label = escapeXml(`${buildInviteText(cfg).title} — ${buildInviteText(cfg).meta.banner}`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Georgia, 'Times New Roman', serif" role="img" aria-label="${label}">
  <title>${label}</title>
  <defs>
    <radialGradient id="bk-bg" cx="50%" cy="50%" r="75%">
      <stop offset="0%" stop-color="${pal.bg1}"/><stop offset="62%" stop-color="${pal.bg0}"/><stop offset="100%" stop-color="#030109"/>
    </radialGradient>
    <filter id="bk-fog" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.01 0.016" numOctaves="3" seed="${fogSeed}" result="n"/>
      <feColorMatrix in="n" type="matrix" values="0 0 0 0 ${hexChan(pal.mist, 0)}  0 0 0 0 ${hexChan(pal.mist, 1)}  0 0 0 0 ${hexChan(pal.mist, 2)}  0 0 0 ${strong ? 0.42 : 0.28} 0"/>
    </filter>
    <filter id="bk-blur" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="16"/></filter>
    <mask id="bk-feather" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">
      <rect x="${x + 22}" y="${y + 22}" width="${CANVAS - 44}" height="${CANVAS - 44}" rx="28" fill="#ffffff" filter="url(#bk-blur)"/>
    </mask>
    <radialGradient id="bk-vignette" cx="50%" cy="50%" r="72%">
      <stop offset="55%" stop-color="#000000" stop-opacity="0"/><stop offset="100%" stop-color="#000000" stop-opacity="0.75"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bk-bg)"/>
  <rect width="${W}" height="${H}" filter="url(#bk-fog)" opacity="0.85"/>
  <g mask="url(#bk-feather)">${nested}</g>
  <rect width="${W}" height="${H}" fill="url(#bk-vignette)" pointer-events="none"/>
</svg>`;
}
