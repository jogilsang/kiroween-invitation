// engine/scenes.js — backdrop silhouettes behind the fog. Pure, no randomness.
// Drawn after the background and BEFORE the fog, along the horizon (y ~ 300..500),
// so the fog softens their feet. `accent` lights windows and eyes.

const f = (n) => Number(n.toFixed(2));
const DARK = "#06020b";

function scene(id, inner) {
  return `<g data-scene="${id}" opacity="0.94">${inner}</g>`;
}

// Bare tree: trunk plus a few forked branches. (x, baseY) is the foot.
function deadTree(x, baseY, h, lean) {
  const t = (dx, dy) => `${f(x + dx)} ${f(baseY - dy)}`;
  return `<path d="M ${t(-9, 0)} L ${t(-5 + lean, h)} L ${t(5 + lean, h)} L ${t(9, 0)} Z" fill="${DARK}"/>
    <path d="M ${t(lean, h * 0.9)} L ${t(lean - 46, h + 24)} M ${t(lean, h * 0.78)} L ${t(lean + 52, h + 20)} M ${t(lean, h * 0.62)} L ${t(lean - 36, h * 0.88)} M ${t(lean - 46, h + 24)} L ${t(lean - 62, h + 14)} M ${t(lean + 52, h + 20)} L ${t(lean + 70, h + 36)}"
      stroke="${DARK}" stroke-width="6" stroke-linecap="round" fill="none"/>`;
}

function pine(x, baseY, h, w) {
  const tiers = 4;
  let d = "";
  for (let i = 0; i < tiers; i++) {
    const top = baseY - h + (h * i) / (tiers + 0.6);
    const bottom = baseY - h + (h * (i + 1.7)) / (tiers + 0.6);
    const half = (w * (i + 1.4)) / (tiers + 0.4);
    d += `<path d="M ${f(x)} ${f(top)} L ${f(x - half)} ${f(bottom)} L ${f(x + half)} ${f(bottom)} Z" fill="${DARK}"/>`;
  }
  return d;
}

function graveyard(accent) {
  const stone = (x, h, w, tilt) => `<g transform="rotate(${tilt} ${x} 500)"><path d="M ${x - w} 500 L ${x - w} ${500 - h} Q ${x} ${500 - h - w * 1.1} ${x + w} ${500 - h} L ${x + w} 500 Z" fill="${DARK}"/></g>`;
  const fence = [...Array(7)].map((_, i) => `<path d="M ${80 + i * 22} 500 L ${80 + i * 22} 452 L ${86 + i * 22} 440 L ${92 + i * 22} 452 L ${92 + i * 22} 500 Z" fill="${DARK}"/>`).join("");
  return scene("graveyard", `
    ${deadTree(960, 505, 210, 6)}
    ${stone(150, 52, 20, -6)}${stone(250, 70, 24, 5)}${stone(770, 60, 22, -4)}${stone(880, 48, 18, 7)}
    <rect x="76" y="486" width="164" height="6" fill="${DARK}"/>
    ${fence}
    <circle cx="610" cy="470" r="3" fill="${accent}" opacity="0.5"/>`);
}

function house(accent) {
  const win = (x, y) => `<rect x="${x}" y="${y}" width="16" height="22" fill="${accent}" opacity="0.9"/>`;
  return scene("house", `
    <path d="M 700 505 Q 840 440 1040 505 Z" fill="${DARK}"/>
    <rect x="760" y="372" width="160" height="124" fill="${DARK}"/>
    <path d="M 748 372 L 840 306 L 932 372 Z" fill="${DARK}"/>
    <rect x="890" y="318" width="22" height="50" fill="${DARK}"/>
    <rect x="785" y="320" width="24" height="64" fill="${DARK}"/>
    <path d="M 781 322 L 797 292 L 813 322 Z" fill="${DARK}"/>
    ${win(786, 400)}${win(836, 400)}${win(870, 430)}${win(800, 446)}
    <rect x="828" y="452" width="26" height="44" fill="${accent}" opacity="0.35"/>
    ${deadTree(722, 492, 120, -4)}`);
}

function forest(accent) {
  const eyes = (x, y) => `<circle cx="${x}" cy="${y}" r="4" fill="${accent}"/><circle cx="${x + 16}" cy="${y}" r="4" fill="${accent}"/>`;
  return scene("forest", `
    ${pine(70, 505, 250, 62)}${pine(170, 505, 180, 48)}${pine(280, 505, 120, 36)}
    ${pine(1010, 505, 260, 64)}${pine(910, 505, 190, 50)}${pine(800, 505, 130, 38)}
    ${eyes(214, 446)}${eyes(838, 462)}${eyes(120, 392)}`);
}

export const SCENE_DRAW = { graveyard, house, forest };
