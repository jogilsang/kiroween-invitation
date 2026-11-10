// R82: every audio file has a license row (CC0 + source page). Same rule as .kiro/hooks/audio_license_check.sh.
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

const audioDir = new URL("../assets/audio/", import.meta.url).pathname;
const script = new URL("../.kiro/hooks/audio_license_check.sh", import.meta.url).pathname;
const isAudio = (n) => /\.(m4a|mp3|ogg|wav|opus|aac|flac|webm)$/i.test(n);

test("test_audio_files_have_license_rows: every shipped audio file is listed as CC0 with a source page", () => {
  const lic = readFileSync(join(audioDir, "LICENSES.md"), "utf8");
  const files = readdirSync(audioDir).filter(isAudio);
  assert.ok(files.length >= 1, "at least one track ships");
  for (const f of files) {
    const row = lic.split("\n").find((l) => l.includes("`" + f + "`"));
    assert.ok(row, `${f} has a row`);
    assert.match(row, /https:\/\//, `${f} names its source page`);
    assert.match(row, /CC0/, `${f} says CC0`);
  }
});

test("test_audio_guard_flags_unlisted_file: the hook script fails on a file with no row and passes when listed", () => {
  const dir = mkdtempSync(join(tmpdir(), "aud-"));
  try {
    writeFileSync(join(dir, "LICENSES.md"), "| `a.m4a` | x | https://example.org (CC0) | d | h |\n");
    writeFileSync(join(dir, "a.m4a"), "x");
    let r = spawnSync("bash", [script], { env: { ...process.env, AUDIO_DIR: dir } });
    assert.equal(r.status, 0);
    writeFileSync(join(dir, "b.mp3"), "x");
    r = spawnSync("bash", [script], { env: { ...process.env, AUDIO_DIR: dir } });
    assert.equal(r.status, 2);
    assert.match(String(r.stderr), /b\.mp3/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("test_audio_is_not_loaded_on_page_load: no <audio> tag and no audio fetch at startup in the HTML", () => {
  const html = readFileSync(new URL("../app/index.html", import.meta.url), "utf8");
  assert.ok(!/<audio[\s>]/i.test(html), "no audio element in the page source");
  assert.ok(!/\.m4a/.test(html), "no track URL in the page source");
});
