// R84: sound effects as pure data. No audio API, no clock, no randomness here.
// app/audio.js turns a plan into oscillators; this file only decides the numbers.

export const SFX_GAIN_CAP = 0.35; // summed gain of one effect never goes above this

// Each layer: oscillator type, start/end frequency (Hz), delay after the trigger,
// length, and gain. Attack/release are applied by the player (ATTACK/RELEASE below).
export const SFX = Object.freeze({
  // press: a soft low blob that drops in pitch
  squish: Object.freeze([
    Object.freeze({ type: "sine", freq0: 220, freq1: 90, delay: 0, dur: 0.18, gain: 0.16 }),
    Object.freeze({ type: "triangle", freq0: 330, freq1: 140, delay: 0.02, dur: 0.14, gain: 0.08 }),
  ]),
  // sticker: a short bright bubble that rises
  pop: Object.freeze([
    Object.freeze({ type: "sine", freq0: 420, freq1: 900, delay: 0, dur: 0.09, gain: 0.2 }),
    Object.freeze({ type: "triangle", freq0: 840, freq1: 1500, delay: 0.01, dur: 0.05, gain: 0.06 }),
  ]),
  // opening: a slow wooden door creak
  creak: Object.freeze([
    Object.freeze({ type: "sawtooth", freq0: 110, freq1: 190, delay: 0, dur: 0.5, gain: 0.07 }),
    Object.freeze({ type: "square", freq0: 135, freq1: 230, delay: 0.05, dur: 0.4, gain: 0.04 }),
    Object.freeze({ type: "sawtooth", freq0: 190, freq1: 120, delay: 0.5, dur: 0.35, gain: 0.06 }),
  ]),
});

export const SFX_ATTACK = 0.008; // seconds, fade in of every layer
export const SFX_RELEASE = 0.04; // seconds, fade out of every layer

const safeTime = (t) => (typeof t === "number" && Number.isFinite(t) && t >= 0 ? t : 0);

/** @returns {{type:string,freq0:number,freq1:number,t0:number,dur:number,gain:number}[]} */
export function sfxPlan(name, nowSec) {
  if (typeof name !== "string" || !Object.prototype.hasOwnProperty.call(SFX, name)) return [];
  const layers = SFX[name];
  const total = layers.reduce((a, l) => a + l.gain, 0);
  const k = total > SFX_GAIN_CAP ? SFX_GAIN_CAP / total : 1;
  const now = safeTime(nowSec);
  return layers.map((l) => ({
    type: l.type,
    freq0: l.freq0,
    freq1: l.freq1,
    t0: now + l.delay,
    dur: l.dur,
    gain: l.gain * k,
  }));
}
