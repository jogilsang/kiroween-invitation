// deploy/make_og.mjs — build app/og.png (1200x630) for link previews. Social crawlers do not
// read SVG, so the preview image has to be a PNG. Uses the engine + headless Chrome, no deps.
// Run: node deploy/make_og.mjs [presetId]   (CHROME env var overrides the Chrome path)
import { writeFileSync, mkdtempSync, rmSync, existsSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { normalizeConfig, renderSvg, applyPreset } from "../engine/index.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "app", "og.png");
const W = 1200, H = 630;
const chrome = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const preset = process.argv[2] || "vampire-ball";

const cfg = applyPreset(normalizeConfig({ purpose: "join", year: 2026, nick: "" }).value, preset);
// Wide art is 1920x1080 with the square invitation in the middle. Scale to the full OG height
// so the whole invitation shows, and let the dark backdrop fill the two side strips.
const svg = renderSvg(cfg, { format: "wide" });
const dir = mkdtempSync(join(tmpdir(), "og-"));
try {
  writeFileSync(join(dir, "a.svg"), svg);
  writeFileSync(join(dir, "og.html"), `<!doctype html><meta charset="utf-8"><style>
html,body{margin:0;width:${W}px;height:${H}px;background:#05020a;overflow:hidden}
.bg{position:absolute;left:0;top:50%;width:${W}px;height:auto;transform:translateY(-50%) scale(1.15);filter:blur(14px) brightness(.8)}
.fg{position:absolute;left:50%;top:0;height:${H}px;width:auto;transform:translateX(-50%)}</style>
<img class="bg" src="a.svg"><img class="fg" src="a.svg">`);
  execFileSync(chrome, ["--headless=new", "--disable-gpu", "--hide-scrollbars", `--window-size=${W},${H}`,
    "--virtual-time-budget=4000", `--screenshot=${out}`, pathToFileURL(join(dir, "og.html")).href], { stdio: "ignore" });
} finally { rmSync(dir, { recursive: true, force: true }); }
if (!existsSync(out) || statSync(out).size < 5000) throw new Error("og.png was not created");
console.log("wrote", out, statSync(out).size, "bytes");
