// Calendar file (R36-R38).
import { test } from "node:test";
import assert from "node:assert/strict";
import fc from "fast-check";
import { normalizeConfig, parseEventDate, buildIcs, foldIcsLine } from "../engine/index.js";

const cfg = (event, over = {}) => normalizeConfig({
  purpose: "join", year: 2026, nick: "Mina", event, ...over,
}).value;

test("test_parse_event_date_formats: every supported date shape reads as Oct 31 2026", () => {
  for (const d of ["Oct 31", "October 31", "31 Oct", "Oct 31st", "10/31", "10.31", "2026-10-31", "10월 31일", "10월31일", "oct 31"]) {
    const r = parseEventDate(d, "", 2026);
    assert.deepEqual([r?.y, r?.m, r?.d], [2026, 10, 31], `date "${d}"`);
    assert.equal(r.allDay, true);
  }
});

test("test_parse_event_time_formats: times read correctly; none means all-day", () => {
  const t = (x) => { const r = parseEventDate("Oct 31", x, 2026); return r && [r.hh, r.mm, r.allDay]; };
  assert.deepEqual(t("7:00 PM"), [19, 0, false]);
  assert.deepEqual(t("7 PM"), [19, 0, false]);
  assert.deepEqual(t("7:30pm"), [19, 30, false]);
  assert.deepEqual(t("19:00"), [19, 0, false]);
  assert.deepEqual(t("12:00 AM"), [0, 0, false]);
  assert.deepEqual(t("12:30 PM"), [12, 30, false]);
  assert.deepEqual(t(""), [0, 0, true]);
});

test("test_date_carrying_its_own_year_wins: the year in the text overrides the config year", () => {
  assert.equal(parseEventDate("2027-10-31", "", 2026).y, 2027);
});

test("test_unreadable_dates_give_nothing: no guessing", () => {
  for (const bad of ["", "soon", "Halloween", "next friday", "31", "Octember 5", "10", "99/99", null, undefined, 5]) {
    assert.equal(parseEventDate(bad, "7 PM", 2026), null, `date ${JSON.stringify(bad)}`);
  }
  assert.equal(parseEventDate("Oct 31", "evening", 2026), null, "an unreadable time is not guessed either");
  assert.equal(parseEventDate("Oct 31", "25:00", 2026), null);
  assert.equal(parseEventDate("Oct 31", "13 PM", 2026), null);
});

test("test_impossible_dates_rejected: Feb 30, month 13, day 0, and Feb 29 on a non-leap year", () => {
  for (const bad of ["Feb 30", "2/30", "13/1", "10/0", "Apr 31", "Feb 29"]) assert.equal(parseEventDate(bad, "", 2026), null, bad);
  assert.ok(parseEventDate("Feb 29", "", 2028), "2028 is a leap year");
});

test("test_ics_structure: a readable event gives a well-formed iCalendar", () => {
  const ics = buildIcs(cfg({ date: "Oct 31", time: "7:00 PM", place: "Seoul Jamsil" }));
  assert.ok(ics, "must produce text");
  assert.ok(ics.startsWith("BEGIN:VCALENDAR\r\n") && ics.endsWith("END:VCALENDAR\r\n"));
  for (const need of ["VERSION:2.0", "PRODID:", "BEGIN:VEVENT", "END:VEVENT", "UID:", "DTSTAMP:", "DTSTART:20261031T190000", "DTEND:20261031T210000", "LOCATION:Seoul Jamsil", "SUMMARY:"]) {
    assert.ok(ics.includes(need), `missing ${need}`);
  }
  assert.ok(!/\n(?<!\r\n)/.test(ics.replace(/\r\n/g, "")), "only CRLF line endings");
  assert.equal(ics.split("\r\n").filter((l) => l.startsWith("BEGIN:VEVENT")).length, 1);
});

test("test_ics_all_day: no time means a date-only all-day event", () => {
  const ics = buildIcs(cfg({ date: "Oct 31", place: "Seoul" }));
  assert.ok(ics.includes("DTSTART;VALUE=DATE:20261031") && ics.includes("DTEND;VALUE=DATE:20261101"));
});

test("test_ics_is_deterministic: same config -> identical text, different config -> different UID", () => {
  const a = buildIcs(cfg({ date: "Oct 31", time: "7 PM" })), b = buildIcs(cfg({ date: "Oct 31", time: "7 PM" }));
  assert.equal(a, b);
  const uid = (x) => x.match(/UID:(\S+)/)[1];
  assert.notEqual(uid(a), uid(buildIcs(cfg({ date: "Nov 1", time: "7 PM" }))));
});

test("test_ics_line_folding: no line exceeds 75 octets, even with Korean text", () => {
  const ics = buildIcs(cfg({ date: "Oct 31", time: "7 PM", place: "서울 송파구 올림픽로 300 롯데월드타워 지하 1층" }, { nick: "민아민아민아민아민아민아민아민아" }));
  for (const line of ics.split("\r\n")) assert.ok(Buffer.byteLength(line, "utf8") <= 75, `too long: ${line.length} chars / ${Buffer.byteLength(line)} bytes`);
  // unfolding (CRLF + space) must restore the full text
  const unfolded = ics.replace(/\r\n /g, "");
  assert.ok(unfolded.includes("서울 송파구 올림픽로 300 롯데월드타워 지하 1층"));
});

test("test_ics_cannot_be_injected: no user text can add or end calendar lines", () => {
  // the engine sanitizes already, so also feed raw hostile values straight to buildIcs
  const hostile = { ...cfg({ date: "Oct 31", time: "7 PM" }), nick: "x\r\nEND:VEVENT\r\nBEGIN:VEVENT\r\nSUMMARY:evil", event: { date: "Oct 31", time: "7 PM", place: "a\r\nATTENDEE:mailto:evil@x.com\nDESCRIPTION:hi;,\\" } };
  const ics = buildIcs(hostile);
  const lines = ics.split("\r\n").map((l) => l.replace(/^ /, ""));
  assert.equal(lines.filter((l) => l === "BEGIN:VEVENT").length, 1);
  assert.equal(lines.filter((l) => l === "END:VEVENT").length, 1);
  assert.ok(!lines.some((l) => l.startsWith("ATTENDEE")), "no injected ATTENDEE line");
  assert.ok(!lines.some((l) => l === "SUMMARY:evil"));
});

test("test_ics_unreadable_event_gives_null: the app can disable the button", () => {
  assert.equal(buildIcs(cfg({ date: "soon" })), null);
  assert.equal(buildIcs(cfg({})), null);
});

test("pbt: ics for any event text is null or a clean calendar", () => {
  fc.assert(fc.property(fc.string(), fc.string(), fc.string(), (date, time, place) => {
    const out = buildIcs(cfg({ date, time, place }));
    if (out === null) return true;
    const lines = out.split("\r\n");
    return out.startsWith("BEGIN:VCALENDAR\r\n") && out.endsWith("END:VCALENDAR\r\n")
      && lines.filter((l) => l === "BEGIN:VEVENT").length === 1
      && lines.every((l) => Buffer.byteLength(l, "utf8") <= 75);
  }), { numRuns: 300 });
});

// Folding is only reached by long lines, which normal (length-limited) input never
// produces, so it is tested directly. (A mutation test showed the earlier folding
// test passed even with folding switched off.)
test("test_fold_splits_long_lines_at_75_octets: ASCII", () => {
  const out = foldIcsLine("X:" + "a".repeat(200)).split("\r\n");
  assert.ok(out.length >= 3, "a 202-byte line must be split");
  for (const l of out) assert.ok(Buffer.byteLength(l, "utf8") <= 75);
  assert.ok(out.slice(1).every((l) => l.startsWith(" ")), "continuations start with a space");
  assert.equal(out.join("").replace(/\s/g, ""), "X:" + "a".repeat(200));
});

test("test_fold_never_splits_a_multibyte_character: Korean at the boundary", () => {
  for (let pad = 0; pad < 6; pad++) {          // shift the boundary across a 3-byte letter
    const text = "S:" + "x".repeat(pad) + "가나다라마바사아자차카타파하".repeat(8);
    const out = foldIcsLine(text).split("\r\n");
    for (const l of out) {
      assert.ok(Buffer.byteLength(l, "utf8") <= 75, `pad ${pad}: ${Buffer.byteLength(l)} bytes`);
      assert.equal(l, l.toWellFormed(), "no broken character");
    }
    assert.equal(out.map((l, i) => (i ? l.slice(1) : l)).join(""), text, "unfolding restores the text");
  }
});

test("test_fold_leaves_short_lines_alone", () => {
  assert.equal(foldIcsLine("SUMMARY:hi"), "SUMMARY:hi");
});
