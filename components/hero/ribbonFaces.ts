// The eight faces of the hero ribbon (lib/hero-ribbon.ts), drawn once into canvases: four projects
// from the Works section, four skill groups from Skills. Same material as the cards they replace —
// paper, ink, hairline, a serif title, mono labels, screenshots in black and white.

import { projects, skills, skillLevelLabel, type SkillCategory } from "@/lib/data";

// 2.1 : 1.32, the card's proportions.
export const FACE_W = 1024;
export const FACE_H = 644;

const PAPER = "#fcfbf8";
const INK = "#141413";
const INK_MUTED = "#57564f";
const INK_SUBTLE = "#8a8982";
const PAD = 64;

type FaceSpec = { kind: "work"; projectId: string } | { kind: "stack"; category: SkillCategory; index: string };

// Work and stack alternate, so two screenshots never sit side by side on the rail.
const FACES: FaceSpec[] = [
  { kind: "work", projectId: "asip-redesign" },
  { kind: "stack", category: "Frontend", index: "01" },
  { kind: "work", projectId: "samki-digital-market" },
  { kind: "stack", category: "Backend", index: "02" },
  { kind: "work", projectId: "automata-simulation" },
  { kind: "stack", category: "Database", index: "03" },
  { kind: "work", projectId: "khodkquiz" },
  { kind: "stack", category: "Styling", index: "04" },
];

type Fonts = { mono: string; sans: string; serif: string };

/** The two strongest skills in a category, and the best level among them. */
function stackSummary(category: SkillCategory) {
  const top = skills
    .filter((sk) => sk.category === category)
    .sort((a, b) => b.level - a.level)
    .slice(0, 2);
  const level = top[0]?.level ?? 0;
  return { names: top.map((sk) => sk.name), level, label: skillLevelLabel(level) };
}

/** Canvas letter-spacing is not in every browser, so lay the letters out by hand. */
function spaced(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, tracking: number, align: "left" | "right" = "left") {
  const width = [...text].reduce((sum, ch) => sum + ctx.measureText(ch).width + tracking, -tracking);
  let cx = align === "right" ? x - width : x;
  for (const ch of text) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + tracking;
  }
  return width;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawStack(ctx: CanvasRenderingContext2D, f: Fonts, spec: Extract<FaceSpec, { kind: "stack" }>) {
  const { names, level, label } = stackSummary(spec.category);

  // Eyebrow: index, rule, category.
  ctx.textBaseline = "alphabetic";
  ctx.font = `500 26px ${f.mono}`;
  ctx.fillStyle = INK_SUBTLE;
  const indexW = spaced(ctx, spec.index, PAD, 104, 1.6);
  ctx.globalAlpha = 0.6;
  ctx.fillRect(PAD + indexW + 22, 95, 56, 2);
  ctx.globalAlpha = 1;
  spaced(ctx, spec.category.toUpperCase(), PAD + indexW + 22 + 56 + 22, 104, 1.6);

  // Title: up to two names, the "&" in italic.
  let size = 124;
  const widest = () => {
    ctx.font = `400 ${size}px ${f.serif}`;
    return Math.max(...names.map((n, i) => ctx.measureText(i > 0 ? `& ${n}` : n).width));
  };
  while (size > 56 && widest() > FACE_W - PAD * 2) size -= 4;
  ctx.fillStyle = INK;
  names.forEach((name, i) => {
    const y = 290 + i * size * 1.12;
    ctx.font = `400 ${size}px ${f.serif}`;
    if (i > 0) {
      ctx.fillStyle = INK_MUTED;
      ctx.font = `italic 400 ${size}px ${f.serif}`;
      ctx.fillText("& ", PAD, y);
      const w = ctx.measureText("& ").width;
      ctx.fillStyle = INK;
      ctx.font = `400 ${size}px ${f.serif}`;
      ctx.fillText(name, PAD + w, y);
    } else {
      ctx.fillText(name, PAD, y);
    }
  });

  // Level meter and label.
  ctx.font = `500 26px ${f.mono}`;
  ctx.fillStyle = INK_SUBTLE;
  const labelW = spaced(ctx, label.toUpperCase(), FACE_W - PAD, 566, 1.6, "right");
  const trackX = PAD;
  const trackW = FACE_W - PAD * 2 - labelW - 32;
  ctx.fillStyle = "rgba(20, 20, 19, 0.08)";
  ctx.fillRect(trackX, 556, trackW, 5);
  ctx.fillStyle = INK;
  ctx.fillRect(trackX, 556, (trackW * level) / 100, 5);
}

function drawWork(ctx: CanvasRenderingContext2D, f: Fonts, spec: Extract<FaceSpec, { kind: "work" }>, shot: HTMLImageElement | null) {
  const project = projects.find((p) => p.id === spec.projectId);
  if (!project) return;

  // Screenshot, cover-fitted from the top, in black and white.
  const sx = 28;
  const sy = 28;
  const sw = FACE_W - 56;
  const sh = 484;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(sx, sy, sw, sh, 8);
  ctx.clip();
  ctx.fillStyle = "rgba(20, 20, 19, 0.08)";
  ctx.fillRect(sx, sy, sw, sh);
  if (shot) {
    const scale = Math.max(sw / shot.naturalWidth, sh / shot.naturalHeight);
    const dw = shot.naturalWidth * scale;
    const dh = shot.naturalHeight * scale;
    ctx.drawImage(shot, sx + (sw - dw) / 2, sy, dw, dh);
    const px = ctx.getImageData(sx, sy, sw, sh);
    const d = px.data;
    for (let i = 0; i < d.length; i += 4) {
      const lum = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
      const v = Math.min(255, Math.max(0, (lum / 255 - 0.5) * 1.05 * 255 + 127.5));
      d[i] = d[i + 1] = d[i + 2] = v;
    }
    ctx.putImageData(px, sx, sy);
  }
  ctx.restore();

  // Caption: number, title, year.
  ctx.textBaseline = "alphabetic";
  ctx.font = `500 25px ${f.mono}`;
  ctx.fillStyle = INK_SUBTLE;
  const numW = spaced(ctx, project.number, 44, 590, 1.6);
  const yearW = (() => {
    ctx.font = `500 25px ${f.mono}`;
    return spaced(ctx, project.year, FACE_W - 44, 590, 1.6, "right");
  })();
  ctx.font = `500 40px ${f.sans}`;
  ctx.fillStyle = INK;
  let title = project.title;
  const room = FACE_W - 44 - yearW - 28 - (44 + numW + 24);
  while (title.length > 3 && ctx.measureText(title).width > room) title = title.slice(0, -2) + "…";
  ctx.fillText(title, 44 + numW + 24, 591);
}

/**
 * Draw the eight faces. Resolves once the fonts and screenshots are in, so every face is finished
 * before the ribbon uploads it. `host` supplies the page's font stacks.
 */
export async function buildRibbonFaces(host: HTMLElement): Promise<HTMLCanvasElement[]> {
  const cs = getComputedStyle(host);
  const fonts: Fonts = {
    mono: cs.getPropertyValue("--font-mono").trim() || "ui-monospace, monospace",
    sans: cs.getPropertyValue("--font-sans").trim() || "system-ui, sans-serif",
    serif: `${cs.getPropertyValue("--font-playfair").trim() || "Georgia"}, Georgia, serif`,
  };

  const shots = new Map<string, Promise<HTMLImageElement | null>>();
  for (const spec of FACES) {
    if (spec.kind !== "work") continue;
    const project = projects.find((p) => p.id === spec.projectId);
    if (project) shots.set(spec.projectId, loadImage(project.image));
  }

  // Canvas text only uses a font that has loaded, so ask for each one by name first.
  await Promise.all(
    [`500 26px ${fonts.mono}`, `500 40px ${fonts.sans}`, `400 64px ${fonts.serif}`, `italic 400 64px ${fonts.serif}`].map((font) =>
      document.fonts.load(font).catch(() => []),
    ),
  );

  const out: HTMLCanvasElement[] = [];
  for (const spec of FACES) {
    const canvas = document.createElement("canvas");
    canvas.width = FACE_W;
    canvas.height = FACE_H;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, FACE_W, FACE_H);
    if (spec.kind === "stack") drawStack(ctx, fonts, spec);
    else drawWork(ctx, fonts, spec, (await shots.get(spec.projectId)) ?? null);
    out.push(canvas);
  }
  return out;
}
