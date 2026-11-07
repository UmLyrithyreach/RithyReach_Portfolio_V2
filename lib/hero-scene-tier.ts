// Tier: prompt/portfolio.md line 804

const CAP_60 = 1000 / 60 - 2;

export interface SceneTier {
  name: "mobile" | "tablet" | "desktop";
  mobile: boolean;
  coarsePointer: boolean;
  reducedMotion: boolean;
  maxDpr: number;
  frameInterval: number;
  pointerEnabled: boolean;
  antialias: boolean;
  trailSamples: number;
  outline: boolean;
  reveal: boolean;
  freeze: boolean;
}

const isEnergySaver = (): boolean => {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as unknown as { connection?: { saveData?: boolean }; deviceMemory?: number };
  return Boolean(nav.connection?.saveData) || (nav.deviceMemory ?? 8) <= 2;
};

export const getSceneTier = (): SceneTier => {
  if (typeof window === "undefined") {
    return {
      name: "desktop",
      mobile: false,
      coarsePointer: false,
      reducedMotion: false,
      maxDpr: 1.5,
      frameInterval: 0,
      pointerEnabled: true,
      antialias: true,
      trailSamples: 72,
      outline: true,
      reveal: true,
      freeze: false,
    };
  }

  const coarse = window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  const width = window.innerWidth;
  const name: "mobile" | "tablet" | "desktop" =
    width < 768 || (coarse && width < 1024) ? "mobile" : coarse || width < 1280 ? "tablet" : "desktop";
  const mobile = name === "mobile";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const saver = isEnergySaver();

  return {
    name,
    mobile,
    coarsePointer: coarse,
    reducedMotion,
    maxDpr: mobile ? 1 : name === "tablet" ? 1.25 : 1.5,
    frameInterval: name === "desktop" ? 0 : CAP_60,
    pointerEnabled: !coarse && !reducedMotion,
    antialias: name === "desktop",
    trailSamples: mobile ? 28 : name === "tablet" ? 44 : 72,
    outline: !mobile,
    reveal: !mobile,
    freeze: reducedMotion || (mobile && saver),
  };
};
