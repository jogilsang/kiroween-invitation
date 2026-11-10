import test from "node:test";
import assert from "node:assert/strict";
import { validateEncodeMessage, handleEncode } from "../app/gif_worker.js";
import { MAX_FRAMES, planGifSize } from "../engine/gif.js";
import { parseGif } from "./gif_decoder.js";

const frameBuf = (w, h, v = 7) => new Uint8Array(w * h * 4).fill(v).buffer;
const good = () => ({ type: "encode", width: 4, height: 3, frames: [frameBuf(4, 3), frameBuf(4, 3, 200)], delayCs: 5 });

test("test_gif_worker_message_validation", () => {
  assert.equal(validateEncodeMessage(good()).ok, true);
  const bad = (patch, label) => {
    const r = validateEncodeMessage({ ...good(), ...patch });
    assert.equal(r.ok, false, label);
    assert.equal(typeof r.reason, "string", label);
  };
  for (const m of [null, undefined, 5, "encode", []]) assert.equal(validateEncodeMessage(m).ok, false);
  bad({ type: "other" }, "unknown type");
  bad({ width: 0 }, "width");
  bad({ height: 2.5 }, "height");
  bad({ frames: [] }, "no frames");
  bad({ frames: "x" }, "frames not array");
  bad({ frames: [new Uint8Array(48)] }, "view instead of ArrayBuffer");
  bad({ frames: [frameBuf(4, 3), frameBuf(2, 2)] }, "length mismatch");
  bad({ frames: Array.from({ length: MAX_FRAMES + 1 }, () => frameBuf(4, 3)) }, "too many");
  bad({ delayCs: 0 }, "delay");
  bad({ delayCs: "5" }, "delay type");

  // handleEncode: progress per frame, then done with a real GIF
  const out = [];
  handleEncode(good(), (m) => out.push(m));
  assert.deepEqual(out.filter((m) => m.type === "progress").map((m) => [m.done, m.total]), [[1, 2], [2, 2]]);
  const done = out.at(-1);
  assert.equal(done.type, "done");
  assert.equal(parseGif(done.bytes).frames.length, 2);

  // invalid message gives an error message and never throws
  const errs = [];
  assert.doesNotThrow(() => handleEncode({ type: "encode", width: 0 }, (m) => errs.push(m)));
  assert.equal(errs.length, 1);
  assert.equal(errs[0].type, "error");
  assert.equal(typeof errs[0].message, "string");
});

test("test_plan_gif_size_shrinks_when_over_budget", () => {
  const fits = planGifSize(400, 400, 20, 100_000_000);
  assert.deepEqual([fits.width, fits.height, fits.fits], [400, 400, true]);

  const small = planGifSize(1080, 1080, 40, 2_500_000);
  assert.equal(small.fits, true);
  assert.ok(small.width < 1080 && small.height < 1080);
  assert.ok(small.estimatedBytes <= 2_500_000);
  assert.ok(Math.abs(small.width / small.height - 1) < 0.02, "aspect ratio kept");

  // with inter-frame delta the app's measured 362x362x40 case is planned as fitting
  const app = planGifSize(362, 362, 40, 2_500_000);
  assert.deepEqual([app.width, app.height, app.fits], [362, 362, true]);

  // same inputs, same answer; smaller budget never gives a bigger size
  assert.deepEqual(planGifSize(1080, 1080, 40, 2_500_000), small);
  const tinier = planGifSize(1080, 1080, 40, 500_000);
  assert.ok(tinier.width <= small.width);

  // impossible budget: says it does not fit instead of going below the floor
  const hopeless = planGifSize(1080, 1080, 64, 1000);
  assert.equal(hopeless.fits, false);
  assert.ok(hopeless.width >= 1 && hopeless.height >= 1);

  // a source over the per-frame pixel cap is always shrunk under it
  const huge = planGifSize(4000, 4000, 1, 1e12);
  assert.ok(huge.width * huge.height <= 1_000_000);

  for (const args of [[0, 10, 1, 10], [10, 10, 0, 10], [10, 10, 1, 0], [1.5, 10, 1, 10], [10, 10, 65, 10]]) {
    assert.throws(() => planGifSize(...args), RangeError);
  }
});
