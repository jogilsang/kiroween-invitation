// engine/assets.js — Halloween prop shapes. Pure: each function returns an SVG
// fragment string for a fixed position. No DOM, no randomness. Every asset
// takes its main color `c` (a hex string chosen by the code, never by the user)
// and is wrapped in <g data-part="id"> so it is addressable and testable.

const f = (n) => Number(n.toFixed(2));

function wrap(id, x, y, s, inner, glow = true) {
  return `<g data-part="${id}" transform="translate(${f(x)} ${f(y)}) scale(${s})"${glow ? ' filter="url(#propGlow)"' : ""}>${inner}</g>`;
}

// --- skull: bone-colored by default; the tint recolors the whole skull ---
export function skull(x, y, s, c) {
  return wrap("skull", x, y, s, `
    <path d="M -34 6 C -40 -34 -18 -52 0 -52 C 18 -52 40 -34 34 6 L 24 14 L 24 30 L -24 30 L -24 14 Z"
          fill="${c}" stroke="#1a0b10" stroke-width="2"/>
    <ellipse cx="-14" cy="-8" rx="9" ry="11" fill="#050208"/>
    <ellipse cx="14" cy="-8" rx="9" ry="11" fill="#050208"/>
    <path d="M 0 6 l -5 11 h 10 z" fill="#050208"/>
    <path d="M -16 30 v-12 M -8 30 v-12 M 0 30 v-12 M 8 30 v-12 M 16 30 v-12" stroke="#050208" stroke-width="2"/>`);
}

// --- black cat: dark silhouette; the tint colors the eyes and the rim light ---
export function cat(x, y, s, c) {
  return wrap("cat", x, y, s, `
    <path d="M 36 56 C 80 56 84 10 66 -4" fill="none" stroke="#07030c" stroke-width="10" stroke-linecap="round"/>
    <path d="M -38 60 C -48 10 -30 -14 -18 -22 L -26 -60 L -8 -42 L 8 -42 L 26 -60 L 18 -22 C 30 -14 48 10 38 60 Z"
          fill="#07030c" stroke="${c}" stroke-opacity="0.7" stroke-width="2"/>
    <ellipse cx="-9" cy="-30" rx="5" ry="7.5" fill="${c}"/>
    <ellipse cx="9" cy="-30" rx="5" ry="7.5" fill="${c}"/>
    <rect x="-10" y="-36" width="2" height="12" fill="#07030c"/>
    <rect x="8" y="-36" width="2" height="12" fill="#07030c"/>`);
}

// --- cobweb: top-left corner fan, built from fixed geometry ---
export function cobweb(x, y, s, c) {
  const R = 210;
  const rays = [0, 22.5, 45, 67.5, 90];
  const pt = (r, deg) => [f(r * Math.cos((deg * Math.PI) / 180)), f(r * Math.sin((deg * Math.PI) / 180))];
  let d = "";
  for (const a of rays) { const [px, py] = pt(R, a); d += `M 0 0 L ${px} ${py} `; }
  for (const r of [55, 105, 155, 200]) {
    for (let i = 0; i < rays.length - 1; i++) {
      const [x0, y0] = pt(r, rays[i]);
      const [x1, y1] = pt(r, rays[i + 1]);
      const [cx, cy] = pt(r * 0.88, (rays[i] + rays[i + 1]) / 2);
      d += `M ${x0} ${y0} Q ${cx} ${cy} ${x1} ${y1} `;
    }
  }
  return wrap("cobweb", x, y, s,
    `<path d="${d}" fill="none" stroke="${c}" stroke-opacity="0.7" stroke-width="1.6" stroke-linecap="round"/>`, false);
}

// --- candle: cream wax, glowing flame in the tint color ---
export function candle(x, y, s, c) {
  return wrap("candle", x, y, s, `
    <ellipse cx="0" cy="32" rx="26" ry="7" fill="#1a1124" stroke="${c}" stroke-opacity="0.6"/>
    <rect x="-14" y="-40" width="28" height="70" rx="6" fill="#e8dcc0"/>
    <path d="M -14 -34 q 6 16 10 2 q 4 18 10 4 q 4 -10 8 8 L 14 -40 L -14 -40 Z" fill="#f4ead2"/>
    <rect x="-1" y="-50" width="2" height="10" fill="#2a1a10"/>
    <path d="M 0 -90 C 13 -70 15 -58 0 -49 C -15 -58 -13 -70 0 -90 Z" fill="${c}"/>
    <ellipse cx="0" cy="-62" rx="4" ry="9" fill="#fff6d0"/>`);
}

// --- tombstone: dark stone, the tint draws the edge and the inscription ---
export function tombstone(x, y, s, c) {
  return wrap("tombstone", x, y, s, `
    <ellipse cx="0" cy="70" rx="62" ry="10" fill="#0b0414"/>
    <path d="M -44 70 L -44 -20 C -44 -62 44 -62 44 -20 L 44 70 Z" fill="#150c1f" stroke="${c}" stroke-width="3"/>
    <text x="0" y="-6" text-anchor="middle" fill="${c}" font-size="30" font-weight="bold" font-family="Georgia, serif">RIP</text>
    <path d="M -22 36 l 10 -10 l 8 12 l 10 -14" fill="none" stroke="${c}" stroke-opacity="0.5" stroke-width="2"/>`);
}

// --- crow on a branch: dark body, the tint colors the eye and the rim ---
export function crow(x, y, s, c) {
  return wrap("crow", x, y, s, `
    <path d="M -100 44 C -50 38 20 46 100 30" fill="none" stroke="#120a1a" stroke-width="8" stroke-linecap="round"/>
    <path d="M -10 36 L -10 46 M 12 36 L 12 46" stroke="#07030c" stroke-width="3"/>
    <ellipse cx="2" cy="6" rx="46" ry="27" transform="rotate(-8 2 6)" fill="#07030c" stroke="${c}" stroke-opacity="0.6" stroke-width="2"/>
    <polygon points="40,10 92,30 74,14 96,10 70,2" fill="#07030c"/>
    <circle cx="-34" cy="-22" r="17" fill="#07030c" stroke="${c}" stroke-opacity="0.6" stroke-width="2"/>
    <polygon points="-48,-26 -80,-16 -48,-12" fill="#2a1a10"/>
    <circle cx="-36" cy="-27" r="4" fill="${c}"/>`);
}

// --- mini pumpkin patch: three small pumpkins in the tint color ---
export function pumpkins(x, y, s, c) {
  const one = (dx, dy, r) => `
    <ellipse cx="${dx}" cy="${dy}" rx="${r}" ry="${f(r * 0.82)}" fill="${c}" stroke="#4a1a05" stroke-width="2"/>
    <path d="M ${dx - f(r * 0.45)} ${dy - f(r * 0.7)} q ${f(r * 0.45)} ${f(r * 0.5)} ${f(r * 0.9)} 0" fill="none" stroke="#4a1a05" stroke-width="2"/>
    <rect x="${dx - 3}" y="${dy - f(r * 0.82) - 10}" width="6" height="12" rx="2" fill="#3d6b2f"/>
    <polygon points="${dx - f(r * 0.5)},${dy - 4} ${dx - f(r * 0.15)},${dy - 4} ${dx - f(r * 0.32)},${dy + 8}" fill="#1a0b10"/>
    <polygon points="${dx + f(r * 0.5)},${dy - 4} ${dx + f(r * 0.15)},${dy - 4} ${dx + f(r * 0.32)},${dy + 8}" fill="#1a0b10"/>
    <path d="M ${dx - f(r * 0.45)} ${dy + 12} l ${f(r * 0.2)} 8 l ${f(r * 0.25)} -7 l ${f(r * 0.25)} 7 l ${f(r * 0.2)} -8" fill="none" stroke="#1a0b10" stroke-width="3" stroke-linejoin="round"/>`;
  return wrap("pumpkins", x, y, s, one(-52, 6, 30) + one(10, 0, 40) + one(62, 10, 26));
}
