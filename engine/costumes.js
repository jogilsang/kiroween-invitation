// engine/costumes.js — the four costumes the ghost can wear. Pure.
// Each returns an SVG fragment drawn over the ghost and CLIPPED to its body
// (clip-path="url(#ghostClip)") so nothing spills outside the sheet.
// `c` is the main color (a hex string chosen by the code); (cx, cy) is the ghost
// center, s its scale. Geometry is relative to the ghost: shoulders at y = cy-42,
// hem at y = cy+115, half width ~118.

const f = (n) => Number(n.toFixed(2));

function worn(id, inner) {
  return `<g data-part="costume-${id}" clip-path="url(#ghostClip)">${inner}</g>`;
}

// Dracula: long cape with a red lining, a high collar and a chest medallion.
export function dracula(cx, cy, s, c) {
  const L = (dx) => f(cx + dx * s);
  const T = (dy) => f(cy + dy * s);
  return worn("dracula", `
    <path d="M ${L(-130)} ${T(-40)} L ${L(-44)} ${T(-52)} L ${L(-30)} ${T(130)} L ${L(-140)} ${T(130)} Z" fill="#12040a" stroke="${c}" stroke-opacity="0.7" stroke-width="2"/>
    <path d="M ${L(130)} ${T(-40)} L ${L(44)} ${T(-52)} L ${L(30)} ${T(130)} L ${L(140)} ${T(130)} Z" fill="#12040a" stroke="${c}" stroke-opacity="0.7" stroke-width="2"/>
    <path d="M ${L(-44)} ${T(-52)} L ${L(-30)} ${T(130)} L ${L(-58)} ${T(130)} L ${L(-70)} ${T(-46)} Z" fill="${c}" opacity="0.85"/>
    <path d="M ${L(44)} ${T(-52)} L ${L(30)} ${T(130)} L ${L(58)} ${T(130)} L ${L(70)} ${T(-46)} Z" fill="${c}" opacity="0.85"/>
    <path d="M ${L(-62)} ${T(-40)} L ${L(-40)} ${T(-56)} L ${L(-4)} ${T(-38)} Z" fill="#12040a" stroke="${c}" stroke-opacity="0.8" stroke-width="2"/>
    <path d="M ${L(62)} ${T(-40)} L ${L(40)} ${T(-56)} L ${L(4)} ${T(-38)} Z" fill="#12040a" stroke="${c}" stroke-opacity="0.8" stroke-width="2"/>
    <circle cx="${L(0)}" cy="${T(10)}" r="${f(13 * s)}" fill="${c}" stroke="#12040a" stroke-width="3"/>
    <circle cx="${L(0)}" cy="${T(10)}" r="${f(5 * s)}" fill="#12040a"/>`);
}

// Mummy: overlapping bandage strips, slightly tilted, one across the forehead.
export function mummy(cx, cy, s, c) {
  const L = (dx) => f(cx + dx * s);
  const T = (dy) => f(cy + dy * s);
  const strip = (dy, h, rot) => `<rect x="${L(-150)}" y="${T(dy)}" width="${f(300 * s)}" height="${f(h * s)}" rx="${f(4 * s)}"
      transform="rotate(${rot} ${L(0)} ${T(dy + h / 2)})" fill="${c}" stroke="#2a1a10" stroke-opacity="0.55" stroke-width="2"/>`;
  return worn("mummy", [
    strip(-132, 26, -6), strip(-84, 18, 5),
    strip(-36, 30, -4), strip(6, 26, 5), strip(46, 30, -5), strip(88, 26, 4), strip(124, 30, -3),
  ].join(""));
}

// Pirate: striped shirt, a bandana across the head and an eye patch with a strap.
export function pirate(cx, cy, s, c) {
  const L = (dx) => f(cx + dx * s);
  const T = (dy) => f(cy + dy * s);
  let stripes = "";
  for (let i = 0; i < 5; i++) {
    stripes += `<rect x="${L(-150)}" y="${T(-22 + i * 30)}" width="${f(300 * s)}" height="${f(15 * s)}" fill="${c}" opacity="0.92"/>`;
  }
  return worn("pirate", `
    <rect x="${L(-150)}" y="${T(-36)}" width="${f(300 * s)}" height="${f(170 * s)}" fill="#0c1020" opacity="0.92"/>
    ${stripes}
    <path d="M ${L(-140)} ${T(-198)} L ${L(140)} ${T(-198)} L ${L(140)} ${T(-168)} L ${L(-140)} ${T(-168)} Z" fill="#8a1230"/>
    <circle cx="${L(-30)}" cy="${T(-183)}" r="${f(4 * s)}" fill="#fff" opacity="0.8"/>
    <circle cx="${L(20)}" cy="${T(-183)}" r="${f(4 * s)}" fill="#fff" opacity="0.8"/>
    <circle cx="${L(70)}" cy="${T(-183)}" r="${f(4 * s)}" fill="#fff" opacity="0.8"/>
    <path d="M ${L(-140)} ${T(-142)} L ${L(140)} ${T(-168)}" stroke="#07030c" stroke-width="${f(5 * s)}" fill="none"/>
    <ellipse cx="${L(42)}" cy="${T(-152)}" rx="${f(24 * s)}" ry="${f(22 * s)}" fill="#07030c" stroke="${c}" stroke-opacity="0.7" stroke-width="2"/>`);
}

// Skeleton: a dark vest with a spine and curved ribs in the bone color.
export function skeleton(cx, cy, s, c) {
  const L = (dx) => f(cx + dx * s);
  const T = (dy) => f(cy + dy * s);
  let ribs = "";
  for (let i = 0; i < 4; i++) {
    const y = -20 + i * 30;
    ribs += `<path d="M ${L(-4)} ${T(y)} C ${L(-34)} ${T(y - 14)} ${L(-72)} ${T(y - 6)} ${L(-86)} ${T(y + 18)}" fill="none" stroke="${c}" stroke-width="${f(6 * s)}" stroke-linecap="round"/>
    <path d="M ${L(4)} ${T(y)} C ${L(34)} ${T(y - 14)} ${L(72)} ${T(y - 6)} ${L(86)} ${T(y + 18)}" fill="none" stroke="${c}" stroke-width="${f(6 * s)}" stroke-linecap="round"/>`;
  }
  return worn("skeleton", `
    <rect x="${L(-150)}" y="${T(-44)}" width="${f(300 * s)}" height="${f(190 * s)}" fill="#0d0716" opacity="0.93"/>
    <path d="M ${L(0)} ${T(-30)} L ${L(0)} ${T(120)}" stroke="${c}" stroke-width="${f(7 * s)}" stroke-linecap="round"/>
    ${ribs}`);
}

export const COSTUME_DRAW = { dracula, mummy, pirate, skeleton };
