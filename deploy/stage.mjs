// deploy/stage.mjs — build a flat dist/ for static hosting.
// index.html at root; engine/ and assets/ alongside; rewrite ../ paths to ./.
// Deterministic, no deps. Run: node deploy/stage.mjs
import { mkdirSync, rmSync, cpSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

// copy engine (SVG engine has no external assets)
cpSync(join(root, "engine"), join(dist, "engine"), { recursive: true });

// app files to root, rewriting ../ -> ./
const indexHtml = readFileSync(join(root, "app", "index.html"), "utf8")
  .replace(/\.\/main\.js/g, "./main.js")
  .replace(/\.\/style\.css/g, "./style.css");
writeFileSync(join(dist, "index.html"), indexHtml);

// link preview image (og:image)
writeFileSync(join(dist, "og.png"), readFileSync(join(root, "app", "og.png")));

writeFileSync(join(dist, "style.css"), readFileSync(join(root, "app", "style.css"), "utf8"));

const mainJs = readFileSync(join(root, "app", "main.js"), "utf8")
  .replace(/\.\.\/engine\//g, "./engine/")
  .replace(/\.\.\/assets\//g, "./assets/");
writeFileSync(join(dist, "main.js"), mainJs);

// robots.txt / llms.txt: without them the SPA fallback would serve index.html for these paths.
writeFileSync(join(dist, "robots.txt"), "User-agent: *\nAllow: /\n");
writeFileSync(join(dist, "llms.txt"), [
  "# Kiroween Invitation",
  "",
  "> Static web app that makes a haunted Halloween invitation (SVG) and shares it as a link, image or calendar file. Built with Kiro for Kiroween 2026.",
  "",
  "- [Source code](https://github.com/jogilsang/kiroween-invitation): MIT licensed, includes the .kiro specs, steering, hooks and agents",
  ""
].join("\n"));

console.log("staged dist/ at", dist);
