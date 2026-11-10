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

import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";

test("test_staged_imports_all_resolve: every relative import and worker URL in dist/ points at a staged file", () => {
  const distDir = new URL("../dist/", import.meta.url).pathname;
  const walk = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]));
  const js = walk(distDir).filter((f) => f.endsWith(".js"));
  assert.ok(js.length > 5);
  const missing = [];
  for (const f of js) {
    const src = readFileSync(f, "utf8");
    for (const m of src.matchAll(/(?:from\s+|import\s*\(\s*|new Worker\(\s*)["'](\.{1,2}\/[^"']+)["']/g)) {
      if (!existsSync(join(dirname(f), m[1]))) missing.push(`${f.replace(distDir, "")} -> ${m[1]}`);
    }
  }
  const html = readFileSync(join(distDir, "index.html"), "utf8");
  for (const m of html.matchAll(/(?:src|href)="(\.\/[^"]+)"/g)) if (!existsSync(join(distDir, m[1]))) missing.push(`index.html -> ${m[1]}`);
  assert.deepEqual(missing, []);
});
