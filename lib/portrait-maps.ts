import {
  CanvasTexture,
  SRGBColorSpace,
  LinearMipmapLinearFilter,
  DataTexture,
  RedFormat,
  UnsignedByteType,
  RepeatWrapping,
  LinearFilter,
} from "three";
import { showAssetError } from "./engine";

export interface PortraitFrame {
  size: number;
  eyeMid: [number, number];
  eyeGap: number;
}

export type EyeCoordinates = [[number, number], [number, number]];

export const PORTRAIT_FRAME: PortraitFrame = { size: 2048, eyeMid: [1024, 900], eyeGap: 200 };

export const EYES: { professional: EyeCoordinates; less_professional: EyeCoordinates } = {
  professional: [
    [439, 644],
    [596, 642],
  ],
  less_professional: [
    [500, 369],
    [674, 369],
  ],
};

export interface PortraitMapSet {
  diffuse: CanvasTexture;
  alpha: CanvasTexture;
  depth: CanvasTexture;
  normal: CanvasTexture;
  cutout: HTMLCanvasElement;
  cutoutUrl: string;
}

export async function portraitMaps(url: string, eyes: EyeCoordinates): Promise<PortraitMapSet> {
  function eyeTransform(eyeCoords: EyeCoordinates, frame: PortraitFrame) {
    const [[lx, ly], [rx, ry]] = eyeCoords;
    const scale = frame.eyeGap / Math.hypot(rx - lx, ry - ly);
    const angle = -Math.atan2(ry - ly, rx - lx);
    const a = scale * Math.cos(angle);
    const b = scale * Math.sin(angle);
    const c = -b;
    const d = a;
    const mx = (lx + rx) / 2;
    const my = (ly + ry) / 2;
    return { a, b, c, d, e: frame.eyeMid[0] - (a * mx + c * my), f: frame.eyeMid[1] - (b * mx + d * my) };
  }

  const blur = (src: Float32Array, w: number, h: number, sigma: number): Float32Array => {
    const ideal = Math.sqrt(4 * sigma * sigma + 1);
    let wl = Math.floor(ideal);
    if (wl % 2 === 0) wl--;
    const m = Math.round((12 * sigma * sigma - 3 * wl * wl - 12 * wl - 9) / (-4 * wl - 4));
    const boxH = (from: Float32Array, to: Float32Array, r: number) => {
      const norm = 1 / (2 * r + 1);
      for (let y = 0; y < h; y++) {
        const row = y * w;
        let acc = 0;
        for (let k = -r; k <= r; k++) acc += from[row + Math.min(w - 1, Math.max(0, k))];
        for (let x = 0; x < w; x++) {
          to[row + x] = acc * norm;
          acc += from[row + Math.min(w - 1, x + r + 1)] - from[row + Math.max(0, x - r)];
        }
      }
    };
    const boxV = (from: Float32Array, to: Float32Array, r: number) => {
      const norm = 1 / (2 * r + 1);
      const acc = new Float64Array(w);
      for (let k = -r; k <= r; k++) {
        const row = Math.min(h - 1, Math.max(0, k)) * w;
        for (let x = 0; x < w; x++) acc[x] += from[row + x];
      }
      for (let y = 0; y < h; y++) {
        const row = y * w;
        const add = Math.min(h - 1, y + r + 1) * w;
        const sub = Math.max(0, y - r) * w;
        for (let x = 0; x < w; x++) {
          to[row + x] = acc[x] * norm;
          acc[x] += from[add + x] - from[sub + x];
        }
      }
    };
    const a = Float32Array.from(src);
    const b = new Float32Array(w * h);
    for (let pass = 0; pass < 3; pass++) {
      const r = ((pass < m ? wl : wl + 2) - 1) / 2;
      boxH(a, b, r);
      boxV(b, a, r);
    }
    return a;
  };

  const smoothstep = (e0: number, e1: number, x: number) => {
    const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
    return t * t * (3 - 2 * t);
  };

  const makeCanvas = (size: number) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    return canvas;
  };

  const texture = (canvas: HTMLCanvasElement, srgb = false) => {
    const map = new CanvasTexture(canvas);
    if (srgb) map.colorSpace = SRGBColorSpace;
    map.minFilter = LinearMipmapLinearFilter;
    map.generateMipmaps = true;
    return map;
  };

  const breathe = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

  const S = PORTRAIT_FRAME.size;
  const N = S * S;

  // 1. Frame
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });

  const diffuseCanvas = makeCanvas(S);
  const ctx = diffuseCanvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("2d context unavailable");
  const t = eyeTransform(eyes, PORTRAIT_FRAME);
  ctx.imageSmoothingQuality = "high";
  ctx.setTransform(t.a, t.b, t.c, t.d, t.e, t.f);
  ctx.drawImage(image, 0, 0);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const framed = ctx.getImageData(0, 0, S, S);
  const px = framed.data;
  await breathe();

  // 2. Alpha: flood ground
  const passable = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    const o = i * 4;
    const r = px[o],
      g = px[o + 1],
      b = px[o + 2];
    passable[i] =
      px[o + 3] < 128 || (r >= 232 && g >= 232 && b >= 232 && Math.max(r, g, b) - Math.min(r, g, b) <= 18) ? 1 : 0;
  }

  const GAP = 4;
  const morph = (src: Uint8Array, keep: number) => {
    const prefix = new Int32Array(S + 1);
    const pass = (from: Uint8Array, to: Uint8Array, step: number, lineStep: number) => {
      for (let line = 0; line < S; line++) {
        const base = line * lineStep;
        for (let j = 0; j < S; j++) prefix[j + 1] = prefix[j] + (from[base + j * step] !== keep ? 1 : 0);
        for (let j = 0; j < S; j++) {
          const lo = j - GAP < 0 ? 0 : j - GAP;
          const hi = j + GAP + 1 > S ? S : j + GAP + 1;
          to[base + j * step] = prefix[hi] - prefix[lo] > 0 ? 1 - keep : keep;
        }
      }
    };
    const tmp = new Uint8Array(N);
    const out = new Uint8Array(N);
    pass(src, tmp, 1, S);
    pass(tmp, out, S, 1);
    return out;
  };

  const narrow = morph(passable, 1);
  const reached = new Uint8Array(N);
  const stack = new Int32Array(N);
  let sp = 0;
  const visit = (i: number) => {
    if (reached[i] || !narrow[i]) return;
    reached[i] = 1;
    stack[sp++] = i;
  };
  for (let x = 0; x < S; x++) visit(x);
  for (let y = 0; y < S; y++) {
    visit(y * S);
    visit(y * S + S - 1);
  }
  while (sp > 0) {
    const i = stack[--sp];
    const x = i % S;
    if (x > 0) visit(i - 1);
    if (x < S - 1) visit(i + 1);
    if (i >= S) visit(i - S);
    if (i < N - S) visit(i + S);
  }
  const grown = morph(reached, 0);
  const hard = new Float32Array(N);
  for (let i = 0; i < N; i++) hard[i] = grown[i] && passable[i] ? 0 : 1;

  const inner = morph(Uint8Array.from(hard, (v) => (v ? 1 : 0)), 1);
  for (let i = 0; i < N; i++) {
    if (!hard[i] || inner[i]) continue;
    const o = i * 4;
    hard[i] = 1 - smoothstep(170, 232, Math.min(px[o], px[o + 1], px[o + 2]));
  }
  const mask = blur(hard, S, S, 1.5);
  for (let i = 0; i < N; i++) mask[i] = smoothstep(0.35, 0.65, mask[i]);

  // Difference matte for hair
  {
    const fgBin = new Uint8Array(N);
    for (let i = 0; i < N; i++) fgBin[i] = grown[i] && passable[i] ? 0 : 1;
    let core = fgBin;
    for (let k = 0; k < 3; k++) core = morph(core, 1);
    const reach = morph(fgBin, 0);
    const HAIR_LUM = 40;
    const lastRow = Math.min(S, Math.round(PORTRAIT_FRAME.eyeMid[1] + PORTRAIT_FRAME.eyeGap));
    for (let i = 0; i < lastRow * S; i++) {
      const o = i * 4;
      if (!reach[i] || core[i] || px[o + 3] === 0) continue;
      const r = px[o],
        g = px[o + 1],
        b = px[o + 2];
      if (Math.max(r, g, b) - Math.min(r, g, b) > 28) continue;
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const a = Math.min(1, Math.max(0, (255 - lum) / (255 - HAIR_LUM)));
      mask[i] = Math.min(mask[i], a);
      const inv = 1 / Math.max(a, 0.05);
      px[o] = Math.min(255, Math.max(0, Math.round((r - (1 - a) * 255) * inv)));
      px[o + 1] = Math.min(255, Math.max(0, Math.round((g - (1 - a) * 255) * inv)));
      px[o + 2] = Math.min(255, Math.max(0, Math.round((b - (1 - a) * 255) * inv)));
    }
  }

  // Soft side edges
  {
    const det = t.a * t.a + t.b * t.b;
    const srcW = image.naturalWidth;
    const fade = 0.07 * srcW;
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const sx = (t.a * (x + 0.5 - t.e) + t.b * (y + 0.5 - t.f)) / det;
        mask[y * S + x] *= smoothstep(0, fade, Math.min(sx, srcW - sx));
      }
    }
  }
  await breathe();

  const alphaCanvas = makeCanvas(S);
  const alphaCtx = alphaCanvas.getContext("2d");
  if (!alphaCtx) throw new Error("alpha canvas context unavailable");
  const alphaData = alphaCtx.createImageData(S, S);

  const cutout = makeCanvas(S);
  const cutoutCtx = cutout.getContext("2d");
  if (!cutoutCtx) throw new Error("cutout canvas context unavailable");
  const cutoutData = cutoutCtx.createImageData(S, S);

  for (let i = 0; i < N; i++) {
    const o = i * 4;
    const m = mask[i];
    alphaData.data[o] = alphaData.data[o + 1] = alphaData.data[o + 2] = Math.round(m * 255);
    alphaData.data[o + 3] = 255;
    cutoutData.data[o] = px[o];
    cutoutData.data[o + 1] = px[o + 1];
    cutoutData.data[o + 2] = px[o + 2];
    cutoutData.data[o + 3] = Math.round(m * px[o + 3]);
  }
  alphaCtx.putImageData(alphaData, 0, 0);
  cutoutCtx.putImageData(cutoutData, 0, 0);
  ctx.putImageData(framed, 0, 0);
  await breathe();

  // 4. Depth at 512²
  const D = 512;
  const k = S / D;
  const small = new Float32Array(D * D);
  for (let y = 0; y < D; y++) {
    for (let x = 0; x < D; x++) {
      let acc = 0;
      for (let j = 0; j < k; j++) {
        const row = (y * k + j) * S + x * k;
        for (let i = 0; i < k; i++) acc += mask[row + i];
      }
      small[y * D + x] = acc / (k * k);
    }
  }
  const blurred = blur(small, D, D, 24);
  const gap = PORTRAIT_FRAME.eyeGap / k;
  const cx = PORTRAIT_FRAME.eyeMid[0] / k;
  const cy = PORTRAIT_FRAME.eyeMid[1] / k + 0.18 * gap;
  const rx = 1.15 * gap;
  const ry = 1.6 * gap;
  const depth = new Float32Array(D * D);
  for (let y = 0; y < D; y++) {
    for (let x = 0; x < D; x++) {
      const i = y * D + x;
      if (small[i] <= 0) continue;
      const dx = (x + 0.5 - cx) / rx;
      const dy = (y + 0.5 - cy) / ry;
      const v = 0.15 + 0.6 * blurred[i] + 0.25 * Math.exp(-(dx * dx + dy * dy));
      depth[i] = Math.min(1, Math.max(0, v));
    }
  }
  const depthCanvas = makeCanvas(D);
  const depthCtx = depthCanvas.getContext("2d");
  if (!depthCtx) throw new Error("depth canvas context unavailable");
  const depthData = depthCtx.createImageData(D, D);
  for (let i = 0; i < D * D; i++) {
    const o = i * 4;
    depthData.data[o] = depthData.data[o + 1] = depthData.data[o + 2] = Math.round(depth[i] * 255);
    depthData.data[o + 3] = 255;
  }
  depthCtx.putImageData(depthData, 0, 0);

  // 5. Normal
  const at = (x: number, y: number) => depth[(y < 0 ? 0 : y >= D ? D - 1 : y) * D + (x < 0 ? 0 : x >= D ? D - 1 : x)];
  const normalCanvas = makeCanvas(D);
  const normalCtx = normalCanvas.getContext("2d");
  if (!normalCtx) throw new Error("normal canvas context unavailable");
  const normalData = normalCtx.createImageData(D, D);
  for (let y = 0; y < D; y++) {
    for (let x = 0; x < D; x++) {
      const gx =
        at(x + 1, y - 1) +
        2 * at(x + 1, y) +
        at(x + 1, y + 1) -
        (at(x - 1, y - 1) + 2 * at(x - 1, y) + at(x - 1, y + 1));
      const gyDown =
        at(x - 1, y + 1) +
        2 * at(x, y + 1) +
        at(x + 1, y + 1) -
        (at(x - 1, y - 1) + 2 * at(x, y - 1) + at(x + 1, y - 1));
      const nx = -gx * 6;
      const ny = gyDown * 6;
      const len = Math.hypot(nx, ny, 1);
      const o = (y * D + x) * 4;
      normalData.data[o] = Math.round(((nx / len) * 0.5 + 0.5) * 255);
      normalData.data[o + 1] = Math.round(((ny / len) * 0.5 + 0.5) * 255);
      normalData.data[o + 2] = Math.round(((1 / len) * 0.5 + 0.5) * 255);
      normalData.data[o + 3] = 255;
    }
  }
  normalCtx.putImageData(normalData, 0, 0);

  const cutoutUrl = await new Promise<string>((resolve, reject) =>
    cutout.toBlob(
      (blob) => (blob ? resolve(URL.createObjectURL(blob)) : reject(new Error(`could not encode ${url}`))),
      "image/webp",
      0.9
    )
  );

  return {
    diffuse: texture(diffuseCanvas, true),
    alpha: texture(alphaCanvas),
    depth: texture(depthCanvas),
    normal: texture(normalCanvas),
    cutout,
    cutoutUrl,
  };
}

export function makeNoise(): DataTexture {
  const SIZE = 512;
  const SEED = 1337;
  const BASE_CELLS = 8;
  const hash = (x: number, y: number, octave: number) => {
    let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(octave + SEED, 2147483647);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967295;
  };
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const field = new Float32Array(SIZE * SIZE);
  let min = Infinity;
  let max = -Infinity;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      let value = 0;
      let amplitude = 1;
      let cells = BASE_CELLS;
      for (let octave = 0; octave < 4; octave++) {
        const fx = (x / SIZE) * cells;
        const fy = (y / SIZE) * cells;
        const x0 = Math.floor(fx);
        const y0 = Math.floor(fy);
        const tx = fade(fx - x0);
        const ty = fade(fy - y0);
        const xa = x0 % cells,
          xb = (x0 + 1) % cells;
        const ya = y0 % cells,
          yb = (y0 + 1) % cells;
        const top = hash(xa, ya, octave) + (hash(xb, ya, octave) - hash(xa, ya, octave)) * tx;
        const bottom = hash(xa, yb, octave) + (hash(xb, yb, octave) - hash(xa, yb, octave)) * tx;
        value += (top + (bottom - top) * ty) * amplitude;
        amplitude *= 0.5;
        cells *= 2;
      }
      field[y * SIZE + x] = value;
      if (value < min) min = value;
      if (value > max) max = value;
    }
  }
  const data = new Uint8Array(SIZE * SIZE);
  const range = Math.max(max - min, 1e-6);
  for (let i = 0; i < data.length; i++) data[i] = Math.round(((field[i] - min) / range) * 255);
  const noise = new DataTexture(data, SIZE, SIZE, RedFormat, UnsignedByteType);
  noise.wrapS = RepeatWrapping;
  noise.wrapT = RepeatWrapping;
  noise.minFilter = LinearFilter;
  noise.magFilter = LinearFilter;
  noise.needsUpdate = true;
  return noise;
}

let portraitsPromise: Promise<{ pro: PortraitMapSet; alt: PortraitMapSet }> | null = null;

export function getPortraitsReady(): Promise<{ pro: PortraitMapSet; alt: PortraitMapSet }> {
  if (typeof window === "undefined") {
    return new Promise(() => {});
  }
  if (!portraitsPromise) {
    let reportedFile = false;
    const load = (url: string, eyes: EyeCoordinates) =>
      portraitMaps(url, eyes).catch((error) => {
        if (location.protocol === "file:") {
          if (!reportedFile) showAssetError("serve this folder over HTTP: `python3 -m http.server`");
          reportedFile = true;
        } else {
          showAssetError(url);
        }
        throw error;
      });
    portraitsPromise = Promise.all([
      load("/image/professional.png", EYES.professional),
      load("/image/less_professional.png", EYES.less_professional),
    ]).then(([pro, alt]) => ({ pro, alt }));
  }
  return portraitsPromise;
}
