// R81, R83: sound only after a gesture, files load only when turned on. All outside deps are injected fakes.
import test from "node:test";
import assert from "node:assert/strict";
import { createAudioController, DEFAULT_TRACKS, STORAGE_KEY } from "../app/audio.js";

function fakes(saved) {
  const log = { fetches: [], contexts: 0, sources: [], oscs: [], gains: [], decodes: 0 };
  let time = 0;
  const mkParam = (v = 0) => ({
    value: v,
    events: [],
    cancelScheduledValues() {},
    setValueAtTime(x, t) { this.events.push(["set", x, t]); this.value = x; },
    linearRampToValueAtTime(x, t) { this.events.push(["ramp", x, t]); },
  });
  const ctx = {
    state: "suspended",
    get currentTime() { return time; },
    destination: {},
    resume() { this.state = "running"; log.resumed = true; return Promise.resolve(); },
    createGain() {
      const g = { gain: mkParam(1), connect() {}, disconnect() {} };
      log.gains.push(g);
      return g;
    },
    createBufferSource() {
      const s = { buffer: null, loop: false, started: [], stopped: [], connect() {}, disconnect() {},
        start(t) { this.started.push(t); }, stop(t) { this.stopped.push(t); } };
      log.sources.push(s);
      return s;
    },
    createOscillator() {
      const o = { type: "", frequency: mkParam(0), started: [], stopped: [], connect() {}, disconnect() {},
        start(t) { this.started.push(t); }, stop(t) { this.stopped.push(t); } };
      log.oscs.push(o);
      return o;
    },
    decodeAudioData(bytes) { log.decodes++; return Promise.resolve({ bytes }); },
  };
  const store = new Map();
  if (saved !== undefined) store.set(STORAGE_KEY, saved);
  const storage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
  };
  const deps = {
    createContext: () => { log.contexts++; return ctx; },
    fetchBytes: async (url) => { log.fetches.push(url); return new Uint8Array([1, 2, 3]); },
    storage,
    now: () => time,
  };
  return { deps, log, store, ctx, advance: (s) => { time += s; } };
}

test("test_music_off_by_default: a fresh controller is off and silent", () => {
  const f = fakes();
  const a = createAudioController(f.deps);
  assert.equal(a.isOn(), false);
  assert.equal(f.log.contexts, 0);
  assert.equal(f.log.sources.length, 0);
  assert.deepEqual(Object.keys(DEFAULT_TRACKS), ["spooky-waltz", "cute-tune", "creepy-ambient"]);
  assert.equal(DEFAULT_TRACKS["cute-tune"], "../assets/audio/cute-tune.m4a");
});

test("test_no_fetch_before_enable: nothing is fetched, decoded or created until enable()", async () => {
  const f = fakes();
  const a = createAudioController(f.deps);
  a.setVolume(0.3);
  a.setTrack("cute-tune");
  a.playSfx("pop"); // no gesture-enabled context yet: must stay silent
  assert.equal(f.log.fetches.length, 0);
  assert.equal(f.log.contexts, 0);
  assert.equal(f.log.oscs.length, 0);
});

test("test_enable_fetches_once_and_plays_loop: fetch+decode once, loop, 0.8s fade in", async () => {
  const f = fakes();
  const a = createAudioController(f.deps);
  await a.enable();
  assert.equal(a.isOn(), true);
  assert.equal(f.log.contexts, 1);
  assert.equal(f.log.resumed, true);
  assert.deepEqual(f.log.fetches, ["../assets/audio/spooky-waltz.m4a"]);
  assert.equal(f.log.decodes, 1);
  const src = f.log.sources[0];
  assert.equal(src.loop, true);
  assert.equal(src.started.length, 1);
  const ramp = f.log.gains.flatMap((g) => g.gain.events).find((e) => e[0] === "ramp" && e[1] === 0.5);
  assert.ok(ramp, "ramps up to default volume 0.5");
  assert.ok(Math.abs(ramp[2] - 0.8) < 1e-9, "over 0.8 s");
  await a.disable();
  await a.enable(); // second turn-on reuses the decoded track
  assert.equal(f.log.fetches.length, 1);
  assert.equal(f.log.decodes, 1);
});

test("test_disable_fades_and_stops: 0.8s fade out then the source stops", async () => {
  const f = fakes();
  const a = createAudioController(f.deps);
  await a.enable();
  f.advance(10);
  const p = a.disable();
  assert.equal(a.isOn(), false);
  const src = f.log.sources[0];
  const outRamp = f.log.gains.flatMap((g) => g.gain.events).find((e) => e[0] === "ramp" && e[1] === 0 && e[2] > 10);
  assert.ok(outRamp && Math.abs(outRamp[2] - 10.8) < 1e-9);
  await p;
  assert.equal(src.stopped.length, 1);
  assert.ok(Math.abs(src.stopped[0] - 10.8) < 0.05);
  const saved = JSON.parse(f.store.get(STORAGE_KEY));
  assert.equal(saved.on, false);
});

test("test_saved_on_does_not_autoplay: saved on=true is only a preference", async () => {
  const f = fakes(JSON.stringify({ on: true, track: "creepy-ambient", volume: 0.2 }));
  const a = createAudioController(f.deps);
  assert.equal(a.isOn(), false);
  assert.equal(f.log.contexts, 0);
  assert.equal(f.log.fetches.length, 0);
  await a.enable();
  assert.deepEqual(f.log.fetches, ["../assets/audio/creepy-ambient.m4a"]);
  const ramp = f.log.gains.flatMap((g) => g.gain.events).find((e) => e[0] === "ramp" && e[1] === 0.2);
  assert.ok(ramp, "uses saved volume");
});

test("test_corrupt_saved_state_falls_back: bad JSON, wrong types, unknown track, throwing storage", async () => {
  const bad = ["{nope", "null", "5", '"x"', JSON.stringify({ on: "yes", track: "evil", volume: 9 }),
    JSON.stringify({ track: "__proto__", volume: -3 }), JSON.stringify({ volume: "loud" })];
  for (const s of bad) {
    const f = fakes(s);
    const a = createAudioController(f.deps);
    assert.equal(a.isOn(), false, s);
    await a.enable();
    const url = f.log.fetches[0];
    assert.ok(Object.values(DEFAULT_TRACKS).includes(url), `${s} -> ${url}`);
    const g = f.log.gains.flatMap((x) => x.gain.events).filter((e) => e[0] === "ramp").map((e) => e[1]);
    assert.ok(g.every((v) => v >= 0 && v <= 1), s);
  }
  const f = fakes();
  f.deps.storage = { getItem() { throw new Error("denied"); }, setItem() { throw new Error("denied"); } };
  const a = createAudioController(f.deps);
  await a.enable(); // must not throw
  assert.equal(a.isOn(), true);
});

test("test_set_track_switches_and_persists: crossfade, fetch only the new track, saved", async () => {
  const f = fakes();
  const a = createAudioController(f.deps);
  await a.enable();
  await a.setTrack("cute-tune");
  assert.deepEqual(f.log.fetches, ["../assets/audio/spooky-waltz.m4a", "../assets/audio/cute-tune.m4a"]);
  assert.equal(f.log.sources.length, 2);
  assert.equal(f.log.sources[1].loop, true);
  assert.equal(JSON.parse(f.store.get(STORAGE_KEY)).track, "cute-tune");
  await a.setTrack("not-a-track"); // ignored
  assert.equal(f.log.fetches.length, 2);
  a.setVolume(7);
  assert.equal(JSON.parse(f.store.get(STORAGE_KEY)).volume, 1);
  // sfx works once on, via oscillators
  a.playSfx("pop");
  assert.ok(f.log.oscs.length >= 1);
});
