// Findings of the Crew's second review (docs/CREW_FINDINGS_R2.md). Tests first.
import test from "node:test";
import assert from "node:assert/strict";
import { buildIcs, parseEventDate, normalizeConfig, renderSvg, scanText, fitLength } from "../engine/index.js";

const cfg = (o) => normalizeConfig({ year: 2026, ...o }).value;

// S1: the engine must not depend on Node-only globals.
test("test_ics_works_without_node_buffer: browsers have no Buffer", () => {
  const saved = globalThis.Buffer;
  try {
    delete globalThis.Buffer;
    const t = buildIcs(cfg({ nick: "민아", event: { date: "Oct 31", time: "7 PM", place: "서울 마포구 합정동 어딘가 지하 클럽 아주 긴 이름의 장소" } }));
    assert.ok(t && t.startsWith("BEGIN:VCALENDAR"));
    for (const line of t.split("\r\n")) assert.ok(new TextEncoder().encode(line).length <= 75, line);
  } finally { globalThis.Buffer = saved; }
});

// S5: digits of every script count as digits.
test("test_scan_blocks_fullwidth_and_other_script_phone_numbers", () => {
  assert.equal(scanText("０１０-１２３４-５６７８").ok, false);
  assert.equal(scanText("٠١٠ ١٢٣٤ ٥٦٧٨").ok, false);
  assert.equal(scanText("01012345678").ok, false);
  assert.equal(scanText("Oct 31 7 PM").ok, true);
});

test("test_scan_blocks_links: a place cannot carry a clickable link", () => {
  for (const s of ["https://evil.example/a", "http://x.io", "www.evil.example", "ftp://h/x"]) assert.equal(scanText(s).ok, false, s);
  assert.equal(scanText("Seoul: Hapjeong Cafe").ok, true);
});

// S6: Korean dates and times people actually type.
test("test_ics_reads_korean_dates_and_times", () => {
  const r = (d, t) => parseEventDate(d, t, 2026);
  assert.deepEqual(r("2026년 10월 31일", "오후 7시"), { y: 2026, m: 10, d: 31, hh: 19, mm: 0, allDay: false });
  assert.equal(r("10월 31일", "오전 9시 30분").hh, 9);
  assert.equal(r("10월 31일", "오전 9시 30분").mm, 30);
  assert.equal(r("10월 31일", "19시").hh, 19);
  assert.equal(r("10월 31일", "0시"), null); // 0-12시 without 오전/오후 is ambiguous
  assert.equal(r("10월 31일", "19시 30분").mm, 30);
  assert.equal(r("10월 31일", "오후 12시").hh, 12);
  assert.equal(r("10월 31일", "오전 12시").hh, 0);
});

test("test_ics_korean_time_without_am_pm_is_not_guessed", () => {
  assert.equal(parseEventDate("10월 31일", "7시", 2026), null);
  assert.equal(parseEventDate("10월 31일", "오후 25시", 2026), null);
});

// DTSTAMP must be UTC (RFC 5545 3.8.7.2).
test("test_ics_dtstamp_is_utc: ends with Z and does not depend on the clock", () => {
  const t = buildIcs(cfg({ event: { date: "Oct 31", time: "7 PM" } }));
  assert.match(t, /\r\nDTSTAMP:\d{8}T\d{6}Z\r\n/);
  assert.equal(t, buildIcs(cfg({ event: { date: "Oct 31", time: "7 PM" } })));
});

// S7: long text must be squeezed to fit instead of leaving the frame.
test("test_fit_length_only_when_text_is_too_wide", () => {
  assert.equal(fitLength("Hello", 24, 960), undefined);
  assert.ok(fitLength("가".repeat(60), 24, 960) <= 960);
  assert.equal(fitLength("", 24, 960), undefined);
});

test("test_long_korean_event_line_is_squeezed_in_the_svg", () => {
  const svg = renderSvg(cfg({ event: { date: "가나다라마바사아자차카타파하가나", time: "가나다라마바사아자차카타", place: "가나다라마바사아자차카타파하가나다라마바사아자차카타파하가나" } }));
  const m = svg.match(/data-part="details"[^>]*textLength="(\d+)"/);
  assert.ok(m && +m[1] <= 960);
});

test("test_short_text_is_not_squeezed", () => {
  const svg = renderSvg(cfg({ nick: "Mina", event: { date: "Oct 31", time: "7 PM", place: "Seoul" } }));
  assert.ok(!svg.includes("textLength"));
});

test("test_long_korean_nick_title_is_squeezed", () => {
  const svg = renderSvg(cfg({ purpose: "recruit", nick: "가나다라마바사아자차카타파하가나다라마바사아자차" }));
  assert.ok(/textLength="\d+"/.test(svg));
});
