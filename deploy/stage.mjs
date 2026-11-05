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

// copy engine + assets
cpSync(join(root, "engine"), join(dist, "engine"), { recursive: true });
cpSync(join(root, "assets", "grids.json"), join(dist, "assets", "grids.json"));

// app files to root, rewriting ../ -> ./
const indexHtml = readFileSync(join(root, "app", "index.html"), "utf8")
  .replace(/\.\/main\.js/g, "./main.js")
  .replace(/\.\/style\.css/g, "./style.css");
writeFileSync(join(dist, "index.html"), indexHtml);

writeFileSync(join(dist, "style.css"), readFileSync(join(root, "app", "style.css"), "utf8"));

const mainJs = readFileSync(join(root, "app", "main.js"), "utf8")
  .replace(/\.\.\/engine\//g, "./engine/")
  .replace(/\.\.\/assets\//g, "./assets/");
writeFileSync(join(dist, "main.js"), mainJs);

console.log("staged dist/ at", dist);
