// engine/fit.js — decide when a line of text must be squeezed to stay inside the frame. Pure.
// There is no font measuring in the engine (no DOM), so this ESTIMATES the width from the
// character class. It errs on the wide side, so a borderline line is squeezed a little
// rather than left to cross the frame.

const WIDE = /[\p{Script=Hangul}\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\uFF00-\uFFEF]/u;

/**
 * @param {string} text
 * @param {number} fontSize px
 * @param {number} maxWidth px
 * @param {number} [letterSpacing] px added after every character
 * @returns {number|undefined} the width to force (SVG textLength) or undefined if it fits
 */
export function fitLength(text, fontSize, maxWidth, letterSpacing = 0) {
  if (typeof text !== "string" || text === "") return undefined;
  let em = 0;
  let n = 0;
  for (const ch of text) {
    em += WIDE.test(ch) ? 1 : /[A-Z0-9]/.test(ch) ? 0.66 : 0.52;
    n++;
  }
  const est = em * fontSize + letterSpacing * n;
  return est > maxWidth ? Math.floor(maxWidth) : undefined;
}

/** SVG attributes that squeeze a line to maxWidth, or an empty string when it fits. */
export function fitAttrs(text, fontSize, maxWidth, letterSpacing = 0) {
  const w = fitLength(text, fontSize, maxWidth, letterSpacing);
  return w === undefined ? "" : ` textLength="${w}" lengthAdjust="spacingAndGlyphs"`;
}
