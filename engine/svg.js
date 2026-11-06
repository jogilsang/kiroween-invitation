// engine/svg.js — deterministic SVG invitation renderer. Pure.
// No DOM, no network, no Math.random, no Date.now. Same config -> same bytes.
// Model says, code decides: colors, layout, glow are all code constants.

import { buildInviteText, escapeXml } from "./invite.js";
import { resolveParts } from "./compose.js";

export const CANVAS = 1080;

const PALETTES = {
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

// --- White Kiro ghost: elongated body, gaunt angular eyes, mood-driven maw ---
function ghost(cx, cy, s, rand, mood) {
  const top = cy - 250 * s;
  const halfW = 112 * s;
  const hemY = cy + 110 * s;
  const shoulderY = cy - 40 * s;
  const shoulderW = 122 * s;
  const drips = 5;
  const step = (halfW * 2) / drips;
  let hem = "";
  for (let i = 0; i < drips; i++) {
    const d = (48 + rand() * 70) * s;
    hem += ` q ${step * 0.25} ${d} ${step * 0.5} ${d * 0.45} q ${step * 0.25} ${-d} ${step * 0.5} ${-d * 0.45}`;
  }
  const body = `
    M ${cx - halfW} ${hemY}
    L ${cx - shoulderW} ${shoulderY}
    C ${cx - shoulderW - 10 * s} ${top + 40 * s}, ${cx - 70 * s} ${top}, ${cx} ${top}
    C ${cx + 70 * s} ${top}, ${cx + shoulderW + 10 * s} ${top + 40 * s}, ${cx + shoulderW} ${shoulderY}
    L ${cx + halfW} ${hemY}
    ${hem} Z`;

  const eyeY = cy - 150 * s;
  const eye = (ex, w, h, tilt) => `
    <g transform="rotate(${tilt} ${ex} ${eyeY})">
      <path d="M ${ex - w} ${eyeY - h * 0.5} L ${ex + w * 0.3} ${eyeY - h * 0.7}
               L ${ex + w} ${eyeY + h * 0.4} L ${ex - w * 0.2} ${eyeY + h * 0.7} Z" fill="#050208"/>
      <ellipse cx="${ex}" cy="${eyeY + h * 0.1}" rx="${3 * s}" ry="${7 * s}" fill="#d9b8ff" opacity="0.4"/>
    </g>`;

  const mawY = cy - 70 * s;
  let maw;
  if (mood === "screaming") {
    maw = `<ellipse cx="${cx}" cy="${mawY}" rx="${24 * s}" ry="${46 * s}" fill="#050208"/>`;
  } else if (mood === "hollow") {
    maw = `<path d="M ${cx - 24 * s} ${mawY - 16 * s} q ${24 * s} ${-10 * s} ${48 * s} 0
             q ${-6 * s} ${30 * s} ${-24 * s} ${30 * s} q ${-18 * s} 0 ${-24 * s} ${-30 * s} Z" fill="#050208"/>`;
  } else {
    maw = `<path d="M ${cx - 30 * s} ${mawY - 2 * s}
             q ${20 * s} ${26 * s} ${36 * s} ${6 * s} q ${12 * s} ${-13 * s} ${24 * s} ${4 * s}
             q ${-10 * s} ${28 * s} ${-28 * s} ${28 * s} q ${-22 * s} 0 ${-32 * s} ${-38 * s} Z" fill="#050208"/>`;
  }
  return `
    <g filter="url(#ghostGlow)">
      <path d="${body}" fill="url(#ghostFill)" stroke="#efe6ff" stroke-opacity="0.28" stroke-width="2"/>
      ${eye(cx - 42 * s, 17 * s, 46 * s, -10)}
      ${eye(cx + 42 * s, 15 * s, 40 * s, 12)}
      ${maw}
    </g>`;
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

function bats(rand) {
  let out = "";
  for (let i = 0; i < 6; i++) {
    const x = 90 + rand() * (CANVAS - 180), y = 110 + rand() * 300, s = 0.5 + rand() * 0.9;
    out += `<path transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${s.toFixed(3)})"
      d="M0 0 q -16 -14 -30 -5 q 12 -2 14 9 q 9 -11 16 -2 q 7 -9 16 2 q 2 -11 14 -9 q -14 -9 -30 5 q -7 7 -14 2 q -7 5 -16 -2 Z"
      fill="#070311" opacity="0.9"/>`;
  }
  return out;
}

// --- Headwear (hat / horns). Drawn on top of the ghost's head. Pure shapes. ---
// Ghost head top is at cy - 250*s. Tips stay below the banner text (y ~ 104).
function hat(cx, headTopY, pal) {
  const tipY = headTopY - 52;
  const brimY = headTopY + 22;
  return `<g data-part="hat">
      <path d="M ${cx - 74} ${brimY} L ${cx - 12} ${tipY + 6} Q ${cx + 8} ${tipY - 6} ${cx + 34} ${tipY + 26}
               L ${cx + 74} ${brimY} Z" fill="#0b0414" stroke="${pal.glow}" stroke-opacity="0.55" stroke-width="2"/>
      <rect x="${cx - 82}" y="${brimY - 6}" width="164" height="14" rx="7" fill="#0b0414" stroke="${pal.glow}" stroke-opacity="0.55" stroke-width="2"/>
      <rect x="${cx - 62}" y="${brimY - 22}" width="124" height="12" fill="${pal.accent}" opacity="0.85"/>
    </g>`;
}

function horns(cx, headTopY, pal) {
  const y0 = headTopY + 34;
  const side = (sign) => `<path d="M ${cx + sign * 58} ${y0}
      C ${cx + sign * 84} ${y0 - 6}, ${cx + sign * 96} ${y0 - 44}, ${cx + sign * 78} ${y0 - 84}
      C ${cx + sign * 74} ${y0 - 50}, ${cx + sign * 56} ${y0 - 30}, ${cx + sign * 34} ${y0 - 14} Z"
      fill="#12061c" stroke="${pal.glow}" stroke-opacity="0.6" stroke-width="2"/>`;
  return `<g data-part="horns">${side(-1)}${side(1)}</g>`;
}

function moon(cx, cy, r, pal) {
  return `<g filter="url(#moonGlow)">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="#e9dcff" opacity="0.92"/>
      <circle cx="${cx + r * 0.3}" cy="${cy - r * 0.12}" r="${r}" fill="${pal.bg0}" opacity="0.92"/>
    </g>`;
}

/**
 * Render the full invitation as a deterministic SVG string.
 * @param {object} cfg normalized config (from normalizeConfig().value)
 * @returns {string} an SVG document string
 */
export function renderSvg(cfg) {
  const pal = PALETTES[cfg.palette] || PALETTES.magenta;
  const strong = cfg.glow === "strong";
  const rand = rng(deriveSeed(cfg));
  const t = buildInviteText(cfg);
  const { parts } = resolveParts(cfg);
  const has = (p) => parts.includes(p);
  const W = CANVAS, H = CANVAS;

  const moonSVG = has("moon") ? moon(W - 230, 250, 96, pal) : "";
  const batsSVG = has("bats") ? bats(rand) : "";
  // Fog seed must NOT depend on decoration parts: toggling a part may not
  // reshuffle the whole fog (found by the independent Crew review).
  const fogSeed = deriveSeed({ ...cfg, ghost: { parts: [] } }) % 100;
  const ghostCy = 430, ghostS = 1.05;
  const headTopY = ghostCy - 250 * ghostS;
  const headwearSVG = has("hat") ? hat(W / 2, headTopY, pal) : has("horns") ? horns(W / 2, headTopY, pal) : "";

  const banner = escapeXml(t.meta.banner);
  const title = escapeXml(t.title);
  const sub = escapeXml(t.lines[0]);
  const foot = escapeXml(`${cfg.palette.toUpperCase()} · ${cfg.glow.toUpperCase()} GLOW · ${cfg.mood.toUpperCase()}`);
  const ariaTitle = escapeXml(`${t.title} — ${t.meta.banner}`);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Georgia, 'Times New Roman', serif" role="img" aria-label="${ariaTitle}">
  <title>${ariaTitle}</title>
  <defs>
    <radialGradient id="bg" cx="50%" cy="34%" r="80%">
      <stop offset="0%" stop-color="${pal.bg1}"/><stop offset="60%" stop-color="${pal.bg0}"/><stop offset="100%" stop-color="#030109"/>
    </radialGradient>
    <radialGradient id="ghostFill" cx="50%" cy="38%" r="72%">
      <stop offset="0%" stop-color="#ffffff"/><stop offset="62%" stop-color="#e9ddff"/><stop offset="100%" stop-color="#9f86d8"/>
    </radialGradient>
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
  <rect y="${H * 0.45}" width="${W}" height="${H * 0.55}" filter="url(#fog)" opacity="0.9"/>
  ${moonSVG}
  ${batsSVG}
  ${ghost(W / 2, ghostCy, ghostS, rand, cfg.mood)}
  ${headwearSVG}
  ${pumpkin(W / 2, 760, 1.05)}
  <rect width="${W}" height="${H}" fill="url(#vignette)"/>
  <rect width="${W}" height="${H}" filter="url(#grain)" opacity="0.5"/>
  <rect x="36" y="36" width="${W - 72}" height="${H - 72}" fill="none" stroke="${pal.glow}" stroke-opacity="0.45" stroke-width="2" rx="16"/>

  <text x="${W / 2}" y="104" text-anchor="middle" fill="${pal.accent}" font-size="28" letter-spacing="12" opacity="0.9">${banner}</text>
  <text x="${W / 2}" y="930" text-anchor="middle" fill="#ffffff" font-size="56" letter-spacing="3" font-weight="bold" filter="url(#ghostGlow)">${title}</text>
  <text x="${W / 2}" y="982" text-anchor="middle" fill="${pal.glow}" font-size="25">${sub}</text>
  <text x="${W / 2}" y="${H - 54}" text-anchor="middle" fill="#efe6ff" font-size="16" opacity="0.55" letter-spacing="3">${foot}</text>
</svg>`;
}
