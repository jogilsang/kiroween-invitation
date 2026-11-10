// R81, R83, R84: playback only. Nothing here makes sound or loads a file until enable() is called
// from a user gesture. Every outside dependency is injected so Node tests can use fakes.
// The numbers for sound effects come from engine/sfx.js (pure data).
import { sfxPlan, SFX_ATTACK, SFX_RELEASE } from "../engine/sfx.js";

export const STORAGE_KEY = "kw:sound";
export const FADE_SECONDS = 0.8;
export const DEFAULT_VOLUME = 0.5;
export const DEFAULT_TRACKS = Object.freeze({
  "spooky-waltz": "../assets/audio/spooky-waltz.m4a",
  "cute-tune": "../assets/audio/cute-tune.m4a",
  "creepy-ambient": "../assets/audio/creepy-ambient.m4a",
});

const has = (o, k) => typeof k === "string" && Object.prototype.hasOwnProperty.call(o, k);
const clamp01 = (v) => Math.min(1, Math.max(0, v));

// Browser defaults, only touched when the caller did not inject something (so never in Node tests).
const defaultCreateContext = () => new (globalThis.AudioContext || globalThis.webkitAudioContext)();
const defaultFetchBytes = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("audio fetch failed: " + res.status);
  return res.arrayBuffer();
};
const defaultStorage = () => {
  try { return globalThis.localStorage || null; } catch { return null; }
};

export function createAudioController({
  createContext = defaultCreateContext,
  fetchBytes = defaultFetchBytes,
  storage = defaultStorage(),
  tracks = DEFAULT_TRACKS,
  now = () => 0,
} = {}) {
  const firstTrack = Object.keys(tracks)[0];

  // Saved state is only a preference for the next time the user turns sound on (R81).
  function loadPrefs() {
    const prefs = { track: firstTrack, volume: DEFAULT_VOLUME };
    try {
      const raw = storage && storage.getItem(STORAGE_KEY);
      const o = raw ? JSON.parse(raw) : null;
      if (o && typeof o === "object" && !Array.isArray(o)) {
        if (has(tracks, o.track)) prefs.track = o.track;
        if (typeof o.volume === "number" && Number.isFinite(o.volume)) prefs.volume = clamp01(o.volume);
      }
    } catch { /* corrupt or blocked storage: defaults */ }
    return prefs;
  }

  const prefs = loadPrefs();
  let on = false;
  let ctx = null;
  let current = null; // { id, src, gain }
  let generation = 0; // bumps on every on/off/track change so late loads can be dropped
  const decoded = new Map(); // id -> Promise<AudioBuffer>

  const time = () => (ctx ? ctx.currentTime : now());

  function persist() {
    try {
      if (storage) storage.setItem(STORAGE_KEY, JSON.stringify({ on, track: prefs.track, volume: prefs.volume }));
    } catch { /* storage blocked: keep working */ }
  }

  function load(id) {
    if (!decoded.has(id)) {
      const p = Promise.resolve()
        .then(() => fetchBytes(tracks[id]))
        .then((bytes) => ctx.decodeAudioData(bytes));
      p.catch(() => decoded.delete(id)); // a failed load can be retried
      decoded.set(id, p);
    }
    return decoded.get(id);
  }

  function startTrack(id, buffer) {
    const gain = ctx.createGain();
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    src.connect(gain);
    gain.connect(ctx.destination);
    const t = ctx.currentTime;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(prefs.volume, t + FADE_SECONDS);
    src.start(t);
    return { id, src, gain };
  }

  function fadeOutAndStop(node) {
    const t = ctx.currentTime;
    node.gain.gain.cancelScheduledValues(t);
    node.gain.gain.setValueAtTime(node.gain.gain.value, t);
    node.gain.gain.linearRampToValueAtTime(0, t + FADE_SECONDS);
    node.src.stop(t + FADE_SECONDS);
  }

  async function enable() {
    if (on) return true;
    on = true;
    const gen = ++generation;
    try {
      if (!ctx) ctx = createContext();
      if (ctx.state === "suspended" && typeof ctx.resume === "function") await ctx.resume();
      const buffer = await load(prefs.track);
      if (gen !== generation) return false; // turned off (or switched) while loading
      current = startTrack(prefs.track, buffer);
      persist();
      return true;
    } catch {
      if (gen === generation) on = false; // could not start: stay silent and off
      return false;
    }
  }

  function disable() {
    generation++;
    const wasOn = on;
    on = false;
    if (current && ctx) {
      fadeOutAndStop(current);
      current = null;
    }
    if (wasOn) persist();
    return Promise.resolve();
  }

  async function setTrack(id) {
    if (!has(tracks, id) || id === prefs.track) return;
    prefs.track = id;
    persist();
    if (!on || !ctx) return; // not playing: the choice applies the next time sound is turned on
    const gen = ++generation;
    try {
      const buffer = await load(id);
      if (gen !== generation) return;
      const old = current;
      current = startTrack(id, buffer);
      if (old) fadeOutAndStop(old);
    } catch { /* keep the old track */ }
  }

  function setVolume(v) {
    if (typeof v !== "number" || !Number.isFinite(v)) return;
    prefs.volume = clamp01(v);
    if (current && ctx) {
      const g = current.gain.gain;
      const t = ctx.currentTime;
      g.cancelScheduledValues(t);
      g.setValueAtTime(prefs.volume, t);
    }
    persist();
  }

  function playSfx(name) {
    if (!on || !ctx) return; // silent before the user turned sound on
    for (const s of sfxPlan(name, ctx.currentTime)) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = s.type;
      osc.frequency.setValueAtTime(s.freq0, s.t0);
      osc.frequency.linearRampToValueAtTime(s.freq1, s.t0 + s.dur);
      const peak = s.gain * prefs.volume * 2; // volume 0.5 (default) plays the effect as designed
      g.gain.setValueAtTime(0, s.t0);
      g.gain.linearRampToValueAtTime(peak, s.t0 + SFX_ATTACK);
      g.gain.linearRampToValueAtTime(0, s.t0 + s.dur + SFX_RELEASE);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(s.t0);
      osc.stop(s.t0 + s.dur + SFX_RELEASE);
    }
  }

  return { isOn: () => on, enable, disable, setTrack, setVolume, playSfx };
}
