"use client";

// White speed streaks for the hero's exit: thin lines with fading tails that fly to the left, more
// of them, longer and faster the further the visitor scrolls (`intensity`, 0..1, from Hero.tsx).
// One canvas between the scene and the copy, so the copy stays sharp on top. The loop only runs
// while there is something to draw; at rest (intensity 0) it costs nothing.

import { useEffect, useRef } from "react";
import type { MotionValue } from "framer-motion";

interface Streak {
  x: number;
  y: number;
  len: number;
  speed: number;
  alpha: number;
  width: number;
  /** Below this intensity the streak stays hidden, so they appear gradually, not all at once. */
  threshold: number;
}

const COUNT = 160;

const spawn = (w: number, h: number, fresh: boolean): Streak => ({
  // A fresh streak starts anywhere; a recycled one re-enters past the right edge.
  x: fresh ? Math.random() * w * 1.5 : w + Math.random() * w * 0.5,
  y: Math.random() * h,
  len: 0.06 + Math.random() * 0.3,
  speed: 0.9 + Math.random() * 1.6,
  alpha: 0.12 + Math.random() * 0.55,
  width: Math.random() < 0.85 ? 1 : 2,
  threshold: Math.random() * 0.85,
});

export function HeroStreaks({ intensity }: { intensity: MotionValue<number> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let w = 0;
    let h = 0;
    let streaks: Streak[] = [];
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      streaks = Array.from({ length: COUNT }, () => spawn(w, h, true));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let raf = 0;
    let last = 0;
    let drawn = false;
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
      last = now;
      const k = intensity.get();
      ctx.clearRect(0, 0, w, h);
      if (k <= 0.001) {
        drawn = false;
        raf = 0;
        return;
      }
      for (const s of streaks) {
        // Faster and longer as the exit builds: up to about 3 screen widths a second.
        s.x -= s.speed * w * (0.4 + 2.6 * k) * dt;
        const len = s.len * w * (0.3 + 1.7 * k);
        if (s.x + len < 0) Object.assign(s, spawn(w, h, false));
        if (k < s.threshold) continue;
        const a = s.alpha * Math.min(1, (k - s.threshold) * 4);
        const g = ctx.createLinearGradient(s.x, 0, s.x + len, 0);
        g.addColorStop(0, `rgba(255,255,255,${a})`);
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(s.x, s.y, len, s.width);
      }
      drawn = true;
      raf = requestAnimationFrame(frame);
    };
    const kick = () => {
      if (!raf && (intensity.get() > 0.001 || drawn)) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    const unsubscribe = intensity.on("change", kick);
    kick();

    return () => {
      unsubscribe();
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [intensity]);

  return <canvas ref={canvasRef} className="hero-streaks" aria-hidden="true" />;
}
