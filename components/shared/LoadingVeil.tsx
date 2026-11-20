"use client";

import { useEffect, useRef, useState } from "react";

const MIN_MS = 700; // long enough to read as intentional, never a flash
const MAX_MS = 6000; // backstop: a stuck asset never traps the reader behind the veil

/**
 * The launch veil: the </> glyph fills while the hero's assets load, then the veil lifts.
 * Server-rendered, so it covers the page from the first paint; the heavy first frames
 * (hydration, WebGL setup, image decode) happen behind it instead of as visible jank.
 */
export function LoadingVeil() {
  const ref = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const veil = ref.current;
    if (!veil) return;
    const start = performance.now();
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const pageLoaded =
      document.readyState === "complete"
        ? Promise.resolve()
        : new Promise<void>((resolve) => window.addEventListener("load", () => resolve(), { once: true }));
    const portrait = document.querySelector<HTMLImageElement>(".hero-portrait-img");
    const ready = Promise.all([
      pageLoaded,
      document.fonts?.ready ?? Promise.resolve(),
      portrait?.decode().catch(() => {}) ?? Promise.resolve(),
    ]).then(
      // Two frames so the hero has painted once before it is revealed.
      () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))),
    );
    const backstop = new Promise<void>((r) => timers.push(setTimeout(r, MAX_MS)));

    Promise.race([ready, backstop]).then(() => {
      if (cancelled) return;
      const wait = Math.max(0, MIN_MS - (performance.now() - start));
      timers.push(
        setTimeout(() => {
          veil.dataset.state = "done"; // fill completes, then the veil fades (CSS)
          const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
          timers.push(setTimeout(() => setGone(true), reduced ? 50 : 1100));
        }, wait),
      );
    });

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, []);

  if (gone) return null;

  return (
    <div ref={ref} className="site-veil" role="status" aria-label="Loading Reach's portfolio" data-state="loading">
      <div className="site-veil-content">
        <div className="site-veil-glyph" aria-hidden="true">
          <span className="site-veil-ghost" />
          <span className="site-veil-fill" />
        </div>
        <p className="site-veil-name" aria-hidden="true">
          um lyrithyreach
        </p>
      </div>
      <div className="site-veil-meter" aria-hidden="true">
        <span className="site-veil-meter-fill" />
      </div>
    </div>
  );
}
