// Draws the expertise cards in public/image/expertise/<id>.webp for the tunnel in
// components/sections/Expertise.tsx, from lib/expertise.json:
//   - "service" cards: what I can do for a company (title, one-line pitch, icon, where it shows);
//   - "project" cards: a project from lib/data.ts backing the service named in its "for", its
//     screenshot framed in a browser window.
//
//   node scripts/expertise-posters.mjs
//
// Each card is laid out as HTML in headless Chromium (Playwright, already a dev dependency) in the
// site's palette and fonts, then saved as 720x900 WebP with sharp. Icons are lucide-react.

import { readFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as Lucide from "lucide-react";
import { chromium } from "@playwright/test";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public/image/expertise");
const { cards } = JSON.parse(readFileSync(join(root, "lib/expertise.json"), "utf8"));

// Projects, read from lib/data.ts so the cards never drift from it.
const dataSrc = readFileSync(join(root, "lib/data.ts"), "utf8");
const projects = Object.fromEntries(
  dataSrc
    .split(/\n\s*\{\s*\n\s*id: "/)
    .slice(1)
    .map((block) => {
      const id = block.slice(0, block.indexOf('"'));
      const field = (name) => block.match(new RegExp(`\\n\\s*${name}: "([^"]*)"`))?.[1];
      const categories = block.match(/\n\s*categories: \[([^\]]*)\]/)?.[1].match(/"([^"]+)"/g)?.map((s) => s.slice(1, -1)) ?? [];
      return [id, { id, title: field("title"), year: field("year"), image: field("image"), categories }];
    }),
);

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Site tokens (app/globals.css).
const INK = "#090a0b";
const INK_PANEL = "#0e0f14";
const CREAM = "#f5f3ee";
const GREEN = "#1fd16b";
const GREEN_DARK = "#0b7a3b";

// Services alternate cream and green; project cards are always ink, so the two kinds read apart.
const SERVICE_WAYS = [
  { bg: CREAM, fg: INK, muted: "rgb(9 10 11 / 0.55)", line: "rgb(9 10 11 / 0.14)", accent: GREEN_DARK, dot: "rgb(9 10 11 / 0.10)" },
  { bg: GREEN_DARK, fg: CREAM, muted: "rgb(245 243 238 / 0.72)", line: "rgb(245 243 238 / 0.22)", accent: "#8af0b4", dot: "rgb(245 243 238 / 0.10)" },
];
const PROJECT_WAY = { bg: INK_PANEL, fg: CREAM, muted: "rgb(245 243 238 / 0.55)", line: "rgb(245 243 238 / 0.14)", accent: GREEN, dot: "rgb(245 243 238 / 0.07)" };

const W = 720;
const H = 900;

const head = (c) => `<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600&family=JetBrains+Mono:wght@500&family=Space+Grotesk:wght@400;500&display=block" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; }
  html, body { width: ${W}px; height: ${H}px; background: ${c.bg}; color: ${c.fg}; overflow: hidden; }
  body { position: relative; font-family: "Space Grotesk", sans-serif; }
  .dots { position: absolute; inset: 0;
    background-image: radial-gradient(${c.dot} 1.6px, transparent 1.7px); background-size: 22px 22px;
    -webkit-mask-image: radial-gradient(ellipse 70% 50% at 50% 36%, #000 30%, transparent 100%); }
  .top { position: absolute; top: 44px; left: 48px; right: 48px; display: flex; justify-content: space-between;
    font: 500 21px/1 "JetBrains Mono", monospace; letter-spacing: 0.14em; text-transform: uppercase; color: ${c.muted}; }
  .top b { color: ${c.accent}; font-weight: 500; }
  .corner { position: absolute; width: 14px; height: 14px; background: ${c.fg}; top: 96px; }
  .bottom { position: absolute; left: 48px; right: 48px; bottom: 48px; }
  .name { font: 600 var(--name-size, 96px)/0.95 "Oswald", sans-serif; text-transform: uppercase; letter-spacing: -0.01em; }
  .name i { font-style: normal; color: ${c.accent}; }
  .mono { font: 500 20px/1.3 "JetBrains Mono", monospace; letter-spacing: 0.12em; text-transform: uppercase; }
</style>`;

const serviceCard = (card, n, total, c) => {
  const Icon = Lucide[card.icon];
  if (!Icon) throw new Error(`Unknown lucide icon "${card.icon}" for ${card.id}`);
  const icon = renderToStaticMarkup(createElement(Icon, { size: 168, strokeWidth: 1.35, color: c.fg }));
  const nameSize = card.title.length > 18 ? 84 : 96;
  return `${head(c)}
<style>
  .ring { position: absolute; left: 50%; top: 320px; translate: -50% -50%; border-radius: 50%; border: 1.5px solid ${c.line}; }
  .ring.a { width: 330px; height: 330px; } .ring.b { width: 470px; height: 470px; border-style: dashed; }
  .axis { position: absolute; background: ${c.line}; }
  .axis.h { left: 0; right: 0; top: 320px; height: 1.5px; } .axis.v { top: 96px; height: 400px; left: 50%; width: 1.5px; }
  .badge { position: absolute; left: 50%; top: 320px; translate: -50% -50%; width: 250px; height: 250px; border-radius: 50%;
    background: ${c.bg}; display: grid; place-items: center; }
  .pitch { margin-top: 22px; font: 400 27px/1.32 "Space Grotesk", sans-serif; color: ${c.muted}; max-width: 600px; }
  .seen { margin-top: 26px; padding-top: 18px; border-top: 1.5px solid ${c.line}; display: flex; gap: 14px; flex-wrap: wrap; color: ${c.muted}; }
  .seen b { color: ${c.accent}; font-weight: 500; }
</style></head><body>
  <div class="dots"></div>
  <div class="axis h"></div><div class="axis v"></div>
  <div class="ring b"></div><div class="ring a"></div>
  <div class="badge">${icon}</div>
  <div class="corner" style="left:48px"></div><div class="corner" style="right:48px"></div>
  <div class="top"><span>Service <b>${String(n).padStart(2, "0")}</b> / ${String(total).padStart(2, "0")}</span><span>What I can do</span></div>
  <div class="bottom">
    <div class="name" style="--name-size:${nameSize}px">${esc(card.title)}<i>.</i></div>
    <p class="pitch">${esc(card.pitch)}</p>
    <div class="seen mono"><b>Seen in</b>${card.seenIn.map(esc).join("<span>·</span>")}</div>
  </div>
</body></html>`;
};

const projectCard = (project, service, c) => {
  const img = `data:image/webp;base64,${readFileSync(join(root, "public", project.image)).toString("base64")}`;
  return `${head(c)}
<style>
  .col { position: absolute; inset: 130px 48px 48px; display: flex; flex-direction: column; gap: 34px; }
  .window { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; border-radius: 14px; overflow: hidden;
    background: #1b1d24; border: 1.5px solid ${c.line}; box-shadow: 0 30px 60px rgb(0 0 0 / 0.45); }
  .bar { flex: none; height: 40px; display: flex; align-items: center; gap: 9px; padding: 0 16px; background: #1b1d24; }
  .bar i { width: 12px; height: 12px; border-radius: 50%; background: rgb(245 243 238 / 0.22); }
  .bar i:first-child { background: ${c.accent}; }
  .shot { flex: 1; min-height: 0; width: 100%; object-fit: cover; object-position: top center; display: block; }
  .tags { margin-top: 20px; display: flex; gap: 12px; flex-wrap: wrap; }
  .tag { padding: 9px 14px; border: 1.5px solid ${c.line}; border-radius: 999px; color: ${c.muted}; }
  .tag.lit { border-color: ${c.accent}; color: ${c.accent}; }
</style></head><body>
  <div class="dots"></div>
  <div class="top"><span><b>Case in point</b></span><span>${esc(project.year)}</span></div>
  <div class="col">
    <div class="window"><div class="bar"><i></i><i></i><i></i></div><img class="shot" src="${img}" alt=""></div>
    <div>
      <div class="name" style="--name-size:${project.title.length > 16 ? 76 : 88}px">${esc(project.title)}<i>.</i></div>
      <div class="tags mono">
        <span class="tag lit">${esc(service.title)}</span>
        ${project.categories.slice(0, 2).map((cat) => `<span class="tag">${esc(cat)}</span>`).join("")}
      </div>
    </div>
  </div>
</body></html>`;
};

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const totalServices = cards.filter((c) => c.kind === "service").length;
const servicesById = Object.fromEntries(cards.filter((c) => c.kind === "service").map((c) => [c.id, c]));
let serviceIndex = 0;
for (const card of cards) {
  let html;
  let file;
  if (card.kind === "service") {
    serviceIndex += 1;
    html = serviceCard(card, serviceIndex, totalServices, SERVICE_WAYS[(serviceIndex - 1) % SERVICE_WAYS.length]);
    file = `${card.id}.webp`;
  } else {
    const project = projects[card.id];
    if (!project?.image) throw new Error(`No project "${card.id}" with an image in lib/data.ts`);
    const service = servicesById[card.for];
    if (!service) throw new Error(`Project card "${card.id}" needs "for": the id of a service card`);
    html = projectCard(project, service, PROJECT_WAY);
    file = `project-${card.id}.webp`;
  }
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const png = await page.screenshot({ type: "png" });
  await sharp(png).webp({ quality: 86 }).toFile(join(outDir, file));
  console.log("wrote", `public/image/expertise/${file}`);
}
await browser.close();
