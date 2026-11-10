// app/motion.js — draws the living ghost. UI only: every number comes from the engine
// (pose(t), the spring, poseAttrs). This file owns the clock (requestAnimationFrame) and
// the DOM writes; the engine never reads time. (R70-R74, steering/motion.md)
import { pose, createSpring, stepSpring, poseAttrs } from "../engine/index.js";

const IDS = ["ghostRig", "ghostEyes", "ghostGlowLayer", "ghostBody", "ghostRimStroke", "ghostTail", "ghostClipBody"];
const PRESS_MIN_MS = 140; // a quick tap still shows a visible squash

/**
 * @param {{ getCfg: () => object, onPress?: () => void }} opts
 * @returns {{ attach: (el: Element) => void, detach: (el: Element) => void, setReduced: (b: boolean) => void }}
 */
export function createMotion({ getCfg, onPress }) {
  const targets = new Map(); // container -> { nodes, spring, input, pressUntil }
  let reduced = false;
  let raf = 0;
  let last = 0;

  const read = (el) => {
    const nodes = {};
    for (const id of IDS) nodes[id] = el.querySelector("#" + id);
    return nodes;
  };

  function frame(ts) {
    raf = 0;
    if (reduced || targets.size === 0) return;
    if (document.hidden) { last = 0; raf = requestAnimationFrame(frame); return; }
    const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0;
    last = ts;
    const cfg = getCfg();
    const p = pose(ts / 1000, cfg);
    for (const [el, st] of targets) {
      if (!el.isConnected) continue;
      // pressed: squash (1); dragging down squashes more, dragging up stretches (-1..1)
      const input = st.held ? Math.max(-1, Math.min(1, 0.6 + st.dy / 120)) : ts < st.pressUntil ? 1 : 0;
      // the engine clamps dt to 1/30 per call, so a slow frame is stepped in pieces
      let n = Math.max(1, Math.ceil(dt * 30));
      for (let i = 0; i < n; i++) st.spring = stepSpring(st.spring, input, dt / n);
      const a = poseAttrs(cfg, p, st.spring);
      const n_ = st.nodes;
      if (n_.ghostRig) n_.ghostRig.setAttribute("transform", a.rig);
      if (n_.ghostEyes) n_.ghostEyes.setAttribute("transform", a.eyes);
      if (n_.ghostGlowLayer) n_.ghostGlowLayer.setAttribute("opacity", String(a.haloOpacity));
      for (const id of ["ghostBody", "ghostRimStroke", "ghostClipBody"]) if (n_[id]) n_[id].setAttribute("d", a.bodyD);
      if (n_.ghostTail) n_.ghostTail.setAttribute("d", a.rimD);
    }
    raf = requestAnimationFrame(frame);
  }

  function start() { if (!raf && !reduced && targets.size) raf = requestAnimationFrame(frame); }

  function attach(el) {
    const prev = targets.get(el);
    const st = prev || { nodes: {}, spring: createSpring(), held: false, pressUntil: 0, dy: 0, y0: 0 };
    st.nodes = read(el); // the SVG is rebuilt on every render, so look the nodes up again
    if (!prev) {
      const down = (e) => {
        if (!e.target.closest || !e.target.closest("#ghostRig")) return;
        st.held = true;
        st.y0 = e.clientY; st.dy = 0;
        st.pressUntil = performance.now() + PRESS_MIN_MS;
        if (onPress) onPress();
        if (typeof navigator.vibrate === "function") navigator.vibrate(10);
      };
      const move = (e) => { if (st.held) st.dy = e.clientY - st.y0; };
      const up = () => { st.held = false; st.dy = 0; };
      el.addEventListener("pointerdown", down);
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerup", up);
      el.addEventListener("pointerleave", up);
      el.addEventListener("pointercancel", up);
      st.cleanup = () => {
        el.removeEventListener("pointerdown", down);
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerup", up);
        el.removeEventListener("pointerleave", up);
        el.removeEventListener("pointercancel", up);
      };
      targets.set(el, st);
    }
    start();
  }

  function detach(el) {
    const st = targets.get(el);
    if (st && st.cleanup) st.cleanup();
    targets.delete(el);
  }

  function setReduced(b) {
    reduced = !!b;
    if (reduced && raf) { cancelAnimationFrame(raf); raf = 0; }
    if (!reduced) { last = 0; start(); }
  }

  return { attach, detach, setReduced };
}
