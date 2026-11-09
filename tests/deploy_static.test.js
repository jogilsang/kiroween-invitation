// The static host must serve real robots.txt / llms.txt, not the SPA fallback page.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

execFileSync("node", ["deploy/stage.mjs"], { cwd: new URL("..", import.meta.url).pathname, stdio: "ignore" });
const dist = (f) => readFileSync(new URL(`../dist/${f}`, import.meta.url), "utf8");

test("test_robots_txt_is_valid: staged robots.txt has a User-agent group and no HTML", () => {
  const t = dist("robots.txt");
  assert.match(t, /^User-agent:\s*\*/m);
  assert.ok(!/<html/i.test(t));
});

test("test_llms_txt_has_h1: staged llms.txt is markdown with a single H1", () => {
  const t = dist("llms.txt");
  assert.equal((t.match(/^# /gm) || []).length, 1);
  assert.ok(!/<html/i.test(t));
});
