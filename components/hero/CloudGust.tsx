"use client";

// The cloud gust between the hero and Skills, driven by the page scroll in viewport heights (a):
// fog thickens and clouds sweep in while the hero zooms out (0 -> 0.45), full cover (0.45 -> 0.55),
// then the clouds blow outward past the camera (0.55 -> 0.9). Skills arrives a little later (hero.css).
//
// Performance: the clouds and the fog are drawn once into small bitmaps (SVG filters -> canvas ->
// blob URL) on mount. While scrolling only transform and opacity change, so the compositor does
// all the work: no live SVG filters or drop-shadows, which tiled and lagged on large layers.

import { useEffect, useState } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";

export const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};

// The transforms also run once on the server, where there is no window.
export const viewportHeight = () => (typeof window !== "undefined" ? window.innerHeight : 1);

type Puff = { x0: number; y0: number; x1: number; y1: number; size: number; delay: number; art: number };

// x/y in vw/vh: start (off screen) -> cover position. size in vmax. art: which bitmap.
const PUFFS: Puff[] = [
  { x0: -55, y0: 72, x1: 18, y1: 68, size: 95, delay: 0, art: 0 },
  { x0: 155, y0: 75, x1: 82, y1: 70, size: 95, delay: 0.02, art: 1 },
  { x0: -50, y0: 15, x1: 25, y1: 25, size: 85, delay: 0.06, art: 1 },
  { x0: 150, y0: 12, x1: 75, y1: 22, size: 85, delay: 0.08, art: 0 },
  { x0: 50, y0: 165, x1: 50, y1: 55, size: 110, delay: 0.04, art: 0 },
];

const cloudSvg = (seed: number) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-60 -60 520 540" width="520" height="540">
<defs>
<filter id="f" x="-40%" y="-40%" width="180%" height="180%">
<feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="4" seed="${seed}" result="n"/>
<feDisplacementMap in="SourceGraphic" in2="n" scale="85" xChannelSelector="R" yChannelSelector="G" result="d"/>
<feGaussianBlur in="d" stdDeviation="9" result="b"/>
<feDropShadow in="b" dx="0" dy="26" stdDeviation="24" flood-color="#544e3e" flood-opacity="0.28"/>
</filter>
<radialGradient id="g"><stop offset="0" stop-color="#fff"/><stop offset="0.6" stop-color="#fdfcf9" stop-opacity="0.96"/><stop offset="1" stop-color="#f4f2ec" stop-opacity="0"/></radialGradient>
</defs>
<g filter="url(#f)">
<ellipse cx="205" cy="275" rx="180" ry="80" fill="#cfc9bb" opacity="0.55"/>
<ellipse cx="200" cy="250" rx="175" ry="95" fill="#e4e0d5" opacity="0.7"/>
<circle cx="200" cy="205" r="125" fill="url(#g)"/>
<circle cx="120" cy="235" r="90" fill="url(#g)"/>
<circle cx="285" cy="230" r="95" fill="url(#g)"/>
<circle cx="205" cy="140" r="85" fill="url(#g)"/>
</g>
</svg>`;

const fogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="300">
<filter id="f" x="0" y="0" width="100%" height="100%">
<feTurbulence type="fractalNoise" baseFrequency="0.009" numOctaves="3" seed="31"/>
<feColorMatrix values="0 0 0 0 0.98  0 0 0 0 0.97  0 0 0 0 0.94  1.8 0 0 0 -0.45"/>
<feGaussianBlur stdDeviation="3"/>
</filter>
<rect width="100%" height="100%" filter="url(#f)"/>
</svg>`;

async function rasterize(svg: string, w: number, h: number) {
  const img = new Image();
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")?.drawImage(img, 0, 0, w, h);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
  return blob ? URL.createObjectURL(blob) : "";
}

type Art = { clouds: string[]; fog: string };
let artPromise: Promise<Art> | null = null;
const loadArt = () =>
  (artPromise ??= Promise.all([rasterize(cloudSvg(3), 520, 540), rasterize(cloudSvg(17), 520, 540), rasterize(fogSvg, 480, 300)]).then(
    ([a, b, fog]) => ({ clouds: [a, b], fog }),
  ));

function CloudPuff({ a, puff, src }: { a: MotionValue<number>; puff: Puff; src: string }) {
  const { x0, y0, x1, y1, size, delay } = puff;
  const inP = useTransform(a, (v) => smoothstep(delay, 0.45, v));
  const outP = useTransform(a, (v) => smoothstep(0.55, 0.9, v));
  const x = useTransform([inP, outP], ([i, o]: number[]) => `${x0 + (x1 - x0) * i + (x1 - 50) * 2 * o}vw`);
  const y = useTransform([inP, outP], ([i, o]: number[]) => `${y0 + (y1 - y0) * i + (y1 - 50) * 2 * o}vh`);
  const scale = useTransform([inP, outP], ([i, o]: number[]) => (0.75 + 0.45 * i) * (1 + 1.4 * o));
  const opacity = useTransform([inP, outP], ([i, o]: number[]) => Math.min(1, i * 2.2) * (1 - o));
  return (
    <motion.img
      src={src}
      alt=""
      draggable={false}
      className="absolute left-0 top-0 max-w-none will-change-transform"
      style={{
        width: `${size}vmax`,
        height: `${size}vmax`,
        marginLeft: `${-size / 2}vmax`,
        marginTop: `${-size / 2}vmax`,
        x,
        y,
        scale,
        opacity,
      }}
    />
  );
}

export function CloudGust() {
  const [art, setArt] = useState<Art | null>(null);
  useEffect(() => {
    let live = true;
    loadArt()
      .then((v) => {
        if (live) setArt(v);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  const { scrollY } = useScroll();
  const a = useTransform(scrollY, (s) => s / viewportHeight());
  const visibility = useTransform(a, (v) => (v > 0.005 && v < 0.95 ? "visible" : "hidden"));
  const veil = useTransform(a, (v) => smoothstep(0.3, 0.45, v) * (1 - smoothstep(0.55, 0.7, v)));
  const fog = useTransform(a, (v) => smoothstep(0.02, 0.35, v) * 0.85 * (1 - smoothstep(0.55, 0.85, v)));
  const fogX = useTransform(a, (v) => `${-10 * v}vw`);
  const fogScale = useTransform(a, (v) => 1.2 + 0.3 * v + 0.8 * smoothstep(0.55, 0.9, v));

  return (
    <motion.div aria-hidden="true" className="pointer-events-none fixed inset-0 z-40 overflow-hidden" style={{ visibility }}>
      {art && (
        <motion.img
          src={art.fog}
          alt=""
          draggable={false}
          className="absolute -left-[15%] -top-[15%] h-[130%] w-[130%] max-w-none will-change-transform"
          style={{ opacity: fog, x: fogX, scale: fogScale }}
        />
      )}
      <motion.div className="absolute inset-0" style={{ opacity: veil, background: "var(--background)" }} />
      {art && PUFFS.map((p, i) => <CloudPuff key={i} a={a} puff={p} src={art.clouds[p.art]} />)}
    </motion.div>
  );
}
