import { test } from "node:test";
import assert from "node:assert/strict";
import {
  encodeConfig, normalizeConfig, renderSvg,
  receiverView, receiverTitle, makeYourOwnUrl, countdownInfo, canNativeShare, receiverActions,
} from "../engine/index.js";

const cfg = (over = {}) => normalizeConfig({
  purpose: "join", year: 2026, nick: "Mina",
  event: { date: "Oct 31", time: "7 PM", place: "Hapjeong" }, ...over,
}).value;

test("test_receiver_view_only_for_valid_link: valid i -> receiver, none -> edit", () => {
  const c = cfg();
  const v = receiverView("?i=" + encodeConfig(c));
  assert.equal(v.mode, "receiver");
  assert.deepEqual(v.config, c);
  assert.equal(receiverView("").mode, "edit");
  assert.equal(receiverView("?x=1").mode, "edit");
  assert.equal(receiverView("?i=").mode, "edit");
});

test("test_corrupt_link_falls_back_to_editor: bad i -> edit with corrupt flag", () => {
  for (const s of ["?i=%%%", "?i=!!!!", "?i=" + "A".repeat(5)]) {
    const v = receiverView(s);
    assert.equal(v.mode, "edit", s);
    assert.equal(v.corrupt, true, s);
  }
  assert.equal(receiverView(undefined).mode, "edit");
  assert.equal(receiverView(null).mode, "edit");
});

test("test_make_your_own_url_drops_the_param", () => {
  assert.equal(makeYourOwnUrl("https://x.example", "/"), "https://x.example/");
  assert.equal(makeYourOwnUrl("https://x.example", "/app/"), "https://x.example/app/");
  assert.equal(makeYourOwnUrl("https://x.example", "/a?i=zz"), "https://x.example/a");
  assert.equal(makeYourOwnUrl(undefined, undefined), "./");
});

test("test_receiver_title_uses_normalized_nick", () => {
  const c = cfg({ nick: "<b>Evil</b>" });
  const t = receiverTitle(c);
  assert.ok(!/[<>]/.test(t), t);
  assert.ok(t.includes(c.nick));
});

test("test_receiver_title_empty_nick", () => {
  const t = receiverTitle(cfg({ nick: "" }));
  assert.match(t, /Kiroween/);
  assert.ok(!t.includes("undefined") && !t.includes("null"));
});

test("test_receiver_calendar_only_when_date_reads", () => {
  assert.equal(receiverActions(cfg()).calendar, true);
  assert.equal(receiverActions(cfg({ event: { date: "someday", time: "", place: "" } })).calendar, false);
  assert.equal(receiverActions(cfg({ event: { date: "", time: "", place: "" } })).calendar, false);
});

test("test_receiver_view_has_edit_and_make_your_own", () => {
  const a = receiverActions(cfg());
  assert.equal(a.edit, true);
  assert.equal(a.makeYourOwn, true);
});

test("test_countdown_days", () => {
  const c = cfg();
  assert.equal(countdownInfo(c, { y: 2026, m: 10, d: 25 }).days, 6);
  assert.equal(countdownInfo(c, { y: 2026, m: 10, d: 25 }).text, "6 days to go");
});

test("test_countdown_today_tomorrow", () => {
  const c = cfg();
  assert.equal(countdownInfo(c, { y: 2026, m: 10, d: 31 }).text, "Tonight");
  assert.equal(countdownInfo(c, { y: 2026, m: 10, d: 30 }).text, "Tomorrow");
  const allDay = cfg({ event: { date: "Oct 31", time: "", place: "" } });
  assert.equal(countdownInfo(allDay, { y: 2026, m: 10, d: 31 }).text, "Today");
});

test("test_countdown_hidden_for_past_or_unreadable", () => {
  assert.equal(countdownInfo(cfg(), { y: 2026, m: 11, d: 1 }), null);
  assert.equal(countdownInfo(cfg({ event: { date: "soon", time: "", place: "" } }), { y: 2026, m: 10, d: 1 }), null);
  assert.equal(countdownInfo(cfg(), null), null);
  assert.equal(countdownInfo(cfg(), { y: "x" }), null);
  assert.equal(countdownInfo(null, { y: 2026, m: 10, d: 1 }), null);
});

test("test_native_share_only_when_supported", () => {
  assert.equal(canNativeShare({ share: () => {} }), true);
  assert.equal(canNativeShare({}), false);
  assert.equal(canNativeShare({ share: "yes" }), false);
  assert.equal(canNativeShare(undefined), false);
  assert.equal(canNativeShare(null), false);
});

test("test_render_svg_unchanged_by_receiver_work: deterministic, no animation markup", () => {
  const c = cfg();
  const a = renderSvg(c), b = renderSvg(c);
  assert.equal(a, b);
  assert.ok(!/<animate|@keyframes|<style[^>]*recv/i.test(a));
});

test("test_existing_link_roundtrip_still_works", () => {
  const c = cfg({ nick: "민아" });
  const p = encodeConfig(c);
  assert.match(p, /^[A-Za-z0-9\-_]+$/);
  assert.deepEqual(receiverView("?i=" + p).config, c);
});

// Red-team round 4 gaps D-G1, D-G3, D-G4 (R61, R65)
test("test_make_your_own_url_rejects_javascript_scheme: only http(s) origins are used", () => {
  for (const o of ["javascript:alert(1)", "data:text/html,x", "file://", "null", "//evil.com", ""]) {
    assert.equal(makeYourOwnUrl(o, "/app/index.html"), "./", o);
  }
  assert.equal(makeYourOwnUrl("http://localhost:8138", "/app/index.html"), "http://localhost:8138/app/index.html");
});
test("test_make_your_own_url_strips_crlf: no control characters in the result", () => {
  for (const [o, p] of [["https://evil.com\r\nX-Injected: yes", "/app/"], ["https://x.example", "/a\r\nb"], ["https://x.example\n", "/"]]) {
    assert.doesNotMatch(makeYourOwnUrl(o, p), /[\x00-\x1f\x7f\s]/);
  }
  assert.equal(makeYourOwnUrl("https://x.example\r\n", "/app/"), "https://x.example/app/");
});
test("test_can_native_share_hostile_getter_does_not_throw: a throwing getter gives false", () => {
  assert.equal(canNativeShare({ get share() { throw new Error("boom"); } }), false);
  assert.equal(canNativeShare(new Proxy({}, { get() { throw new Error("boom"); } })), false);
});
