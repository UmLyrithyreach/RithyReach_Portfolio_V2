// The season halftone (portfolio.md §3, season-dots engine): 8,004 dots baked once, only the lit
// ones touched per frame. Verbatim logic, typed, on closures instead of refs.

import { DOT_LATTICE, DOT_RADIUS, DOTS } from "@/lib/skills/map-dots";
import { MAP_VIEW } from "@/lib/skills/map-vector";
import { css, mix, type SeasonPalette } from "./palette";

type LightSource = "none" | "edge" | "wave";

interface DotParams {
  threshold: number;
  radius: number;
  waveSpeed: number;
  fade: number;
  source: LightSource;
}

interface Source {
  x: number;
  y: number;
  heat: number;
}

const MAX_RATIO = typeof window !== "undefined" && window.matchMedia("(hover: none) and (pointer: coarse)").matches ? 1 : 2;
const MIN_LEVEL = 0.02;
const WAVE_ANGLE = (-20 * Math.PI) / 180;
const POINTER_HEAT = 0.95;
const RETICLE_OPEN = 420;
const RETICLE_SETTLE = 900;
const SPREAD_OPEN = 0.38;
const SPREAD_SHUT = 0.09;
const RETICLE_ARM = 0.82;
const RETICLE_CORE = 54;
const POINTER_TRAIL = 0.07;
const POINTER_RISE = 0.14;
const POINTER_FALL = 0.3;
const CHEQUER_FILL = 1;
const CHEQUER_SEED = 0.7;

const approach = (from: number, to: number, dt: number, tau: number) => from + (to - from) * (1 - Math.exp(-dt / tau));
const falloff = (t: number) => {
  if (t >= 1) return 0;
  const u = 1 - t;
  return u * u;
};

/** The lattice index: a cell grid for neighbourhood lookups, and the dots sorted along the wave. */
let indexCache: ReturnType<typeof buildIndex> | null = null;
function buildIndex() {
  const { columns, rows, points, count } = DOTS;
  let minI = Infinity;
  let maxI = -Infinity;
  let minJ = Infinity;
  let maxJ = -Infinity;
  for (let i = 0; i < count; i += 1) {
    if (columns[i] < minI) minI = columns[i];
    if (columns[i] > maxI) maxI = columns[i];
    if (rows[i] < minJ) minJ = rows[i];
    if (rows[i] > maxJ) maxJ = rows[i];
  }
  const w = maxI - minI + 1;
  const h = maxJ - minJ + 1;
  const cell = new Int32Array(w * h).fill(-1);
  for (let i = 0; i < count; i += 1) cell[(rows[i] - minJ) * w + (columns[i] - minI)] = i;
  const dx = Math.cos(WAVE_ANGLE);
  const dy = Math.sin(WAVE_ANGLE);
  const projection = new Float32Array(count);
  for (let i = 0; i < count; i += 1) projection[i] = points[i * 2] * dx + points[i * 2 + 1] * dy;
  const order = Array.from({ length: count }, (_, i) => i).sort((a, b) => projection[a] - projection[b]);
  const sorted = new Int32Array(order);
  const sortedProjection = Float32Array.from(order, (i) => projection[i]);
  return {
    cell, w, h, minI, minJ, dx, dy, sorted, sortedProjection,
    projectionMin: sortedProjection[0],
    projectionMax: sortedProjection[count - 1],
  };
}

export interface SeasonDots {
  /** Re-bake the resting field at the canvas's current CSS size. */
  bake: () => void;
  /** One engine tick: decay, light, draw. */
  frame: () => void;
  /** The reticle target in map units; `on` false puts it out. */
  aim: (x: number, y: number, on: boolean) => void;
  putOut: () => void;
}

export function createSeasonDots(canvas: HTMLCanvasElement, palette: SeasonPalette): SeasonDots {
  const index = (indexCache ??= buildIndex());
  const params: DotParams = { threshold: 0.34, radius: 170, waveSpeed: 0.16, fade: 0.9, source: "none" };
  const level = new Float32Array(DOTS.count);
  const active = new Int32Array(DOTS.count);
  const inList = new Uint8Array(DOTS.count);
  let activeCount = 0;
  let spread = 0;
  const pointer: Source = { x: 0, y: 0, heat: 0 };
  const target = { x: 0, y: 0, on: false };
  const lightSource: Source | null = null;
  let phase = 0;
  let last = 0;
  let dirty = false;
  let baked: HTMLCanvasElement | null = null;

  const draw = () => {
    if (!baked || !canvas.width) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const p = params;
    const scale = canvas.width / MAP_VIEW.width;
    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.clearRect(0, 0, MAP_VIEW.width, MAP_VIEW.height);
    context.drawImage(baked, 0, 0, MAP_VIEW.width, MAP_VIEW.height);
    const { points, columns, rows } = DOTS;
    const { accent, bright, white } = palette;
    const box = DOT_RADIUS * 2 + 1;
    const span = 1 - p.threshold || 1;
    let drew = 0;
    for (let k = 0; k < activeCount; k += 1) {
      const idx = active[k];
      if (level[idx] < p.threshold) continue;
      context.clearRect(points[idx * 2] - DOT_RADIUS - 0.5, points[idx * 2 + 1] - DOT_RADIUS - 0.5, box, box);
      drew += 1;
    }
    if (!drew) return;
    for (let k = 0; k < activeCount; k += 1) {
      const idx = active[k];
      const value = level[idx];
      if (value < p.threshold) continue;
      if ((columns[idx] + rows[idx]) & 1) continue;
      const t = Math.min(1, (value - p.threshold) / span);
      const side = DOT_LATTICE.pitchX * (CHEQUER_SEED + (CHEQUER_FILL - CHEQUER_SEED) * t);
      context.fillStyle = css(value > 0.8 ? white : value > 0.5 ? bright : mix(accent, bright, value));
      context.fillRect(points[idx * 2] - side / 2, points[idx * 2 + 1] - side / 2, side, side);
    }
  };

  const bake = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    const ratio = Math.min(window.devicePixelRatio || 1, MAX_RATIO);
    const w = Math.round(width * ratio);
    const h = Math.round(height * ratio);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    baked ??= document.createElement("canvas");
    baked.width = w;
    baked.height = h;
    const context = baked.getContext("2d");
    if (!context) return;
    const scale = w / MAP_VIEW.width;
    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.clearRect(0, 0, MAP_VIEW.width, MAP_VIEW.height);
    const { points, count } = DOTS;
    context.fillStyle = palette.dot;
    context.beginPath();
    for (let i = 0; i < count; i += 1) {
      const x = points[i * 2];
      const y = points[i * 2 + 1];
      context.moveTo(x + DOT_RADIUS, y);
      context.arc(x, y, DOT_RADIUS, 0, Math.PI * 2);
    }
    context.fill();
    dirty = true;
    draw();
  };

  const light = (p: DotParams, dt: number) => {
    const { points } = DOTS;
    const radius = Math.max(1, p.radius);
    const add = (i: number, value: number) => {
      if (value <= MIN_LEVEL) return;
      if (value > level[i]) level[i] = value;
      if (!inList[i]) {
        inList[i] = 1;
        active[activeCount] = i;
        activeCount += 1;
      }
    };
    const addPoint = (source: Source, reach: number) => {
      if (source.heat <= 0.01) return;
      const { cell, w, h, minI, minJ } = index;
      const i0 = Math.floor((source.x - reach - DOT_LATTICE.originX) / DOT_LATTICE.pitchX);
      const i1 = Math.ceil((source.x + reach - DOT_LATTICE.originX) / DOT_LATTICE.pitchX);
      const j0 = Math.floor((source.y - reach - DOT_LATTICE.originY) / DOT_LATTICE.pitchY);
      const j1 = Math.ceil((source.y + reach - DOT_LATTICE.originY) / DOT_LATTICE.pitchY);
      for (let j = Math.max(minJ, j0); j <= Math.min(minJ + h - 1, j1); j += 1) {
        const row = (j - minJ) * w;
        for (let i = Math.max(minI, i0); i <= Math.min(minI + w - 1, i1); i += 1) {
          const idx = cell[row + (i - minI)];
          if (idx < 0) continue;
          const d = Math.hypot(points[idx * 2] - source.x, points[idx * 2 + 1] - source.y);
          add(idx, falloff(d / reach) * source.heat);
        }
      }
    };
    const addReticle = (source: Source) => {
      if (source.heat <= 0.01) return;
      const { cell, w, h, minI, minJ } = index;
      const ci = Math.round((source.x - DOT_LATTICE.originX) / DOT_LATTICE.pitchX);
      const cj = Math.round((source.y - DOT_LATTICE.originY) / DOT_LATTICE.pitchY);
      const arm = RETICLE_ARM * source.heat;
      const reach = RETICLE_OPEN * spread;
      if (reach > 1 && cj >= minJ && cj < minJ + h) {
        const row = (cj - minJ) * w;
        const span = Math.ceil(reach / DOT_LATTICE.pitchX);
        const from = Math.max(minI, ci - span);
        const to = Math.min(minI + w - 1, ci + span);
        for (let i = from; i <= to; i += 1) {
          const idx = cell[row + (i - minI)];
          if (idx < 0) continue;
          const d = Math.abs(points[idx * 2] - source.x);
          add(idx, (1 - d / reach) * arm);
        }
      }
      if (reach > 1 && ci >= minI && ci < minI + w) {
        const span = Math.ceil(reach / DOT_LATTICE.pitchY);
        const from = Math.max(minJ, cj - span);
        const to = Math.min(minJ + h - 1, cj + span);
        for (let j = from; j <= to; j += 1) {
          const idx = cell[(j - minJ) * w + (ci - minI)];
          if (idx < 0) continue;
          const d = Math.abs(points[idx * 2 + 1] - source.y);
          add(idx, (1 - d / reach) * arm);
        }
      }
      addPoint(source, RETICLE_CORE);
    };
    addReticle(pointer);
    if (p.source === "none") return;
    if (p.source === "edge") {
      if (lightSource) addPoint(lightSource, radius);
      return;
    }
    phase = (phase + dt * p.waveSpeed) % 1;
    const { sorted, sortedProjection, projectionMin, projectionMax } = index;
    const span = projectionMax - projectionMin + radius * 2;
    const centre = projectionMin - radius + phase * span;
    const lo = centre - radius;
    const hi = centre + radius;
    let a = 0;
    let b = sortedProjection.length;
    while (a < b) {
      const m = (a + b) >> 1;
      if (sortedProjection[m] < lo) a = m + 1;
      else b = m;
    }
    for (let k = a; k < sortedProjection.length; k += 1) {
      const projection = sortedProjection[k];
      if (projection > hi) break;
      add(sorted[k], falloff(Math.abs(projection - centre) / radius));
    }
  };

  const frame = () => {
    const now = performance.now();
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    const p = params;
    const wanted = target.on ? POINTER_HEAT : 0;
    if (pointer.heat <= 0.001 && wanted > 0) {
      pointer.x = target.x;
      pointer.y = target.y;
    } else if (dt > 0) {
      const px = pointer.x;
      const py = pointer.y;
      pointer.x = approach(px, target.x, dt, POINTER_TRAIL);
      pointer.y = approach(py, target.y, dt, POINTER_TRAIL);
      const speed = Math.hypot(pointer.x - px, pointer.y - py) / dt;
      const wantedSpread = Math.max(0, 1 - speed / RETICLE_SETTLE);
      spread = approach(spread, wantedSpread, dt, wantedSpread > spread ? SPREAD_OPEN : SPREAD_SHUT);
    }
    pointer.heat = approach(pointer.heat, wanted, dt, wanted > pointer.heat ? POINTER_RISE : POINTER_FALL);
    if (pointer.heat < 0.005) {
      pointer.heat = 0;
      spread = 0;
    }
    const decay = Math.exp(-dt / Math.max(0.05, p.fade / 3));
    let write = 0;
    for (let k = 0; k < activeCount; k += 1) {
      const idx = active[k];
      const value = level[idx] * decay;
      if (value > MIN_LEVEL) {
        level[idx] = value;
        active[write] = idx;
        write += 1;
      } else {
        level[idx] = 0;
        inList[idx] = 0;
      }
    }
    const before = activeCount;
    activeCount = write;
    light(p, dt);
    if (activeCount === 0 && before === 0 && !dirty) return;
    dirty = false;
    draw();
  };

  return {
    bake,
    frame,
    aim: (x, y, on) => {
      target.x = x;
      target.y = y;
      target.on = on;
    },
    putOut: () => {
      target.on = false;
    },
  };
}
