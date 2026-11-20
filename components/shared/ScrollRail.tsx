"use client";

// "You're here": the page's scrollbar, drawn as a map rail. A dashed line down the right edge with a
// square stop per section; a pulsing target marker rides it with a chip naming the current section
// while you scroll. Drag the marker (or the line) to scroll, click a stop to jump. Fine pointers on
// md+ only; touch screens keep the native scrollbar (globals.css hides it only where this shows).
// Stops are evenly spaced (Works alone is 12 screens long), so the marker moves through each section's
// own stretch of the line at that section's pace. Per-frame work is a transform on the marker; React
// state changes only when the section changes.

import { useEffect, useRef, useState } from "react";

type Stop = { id: string; at: number };

/** Scroll offsets where each section starts, clamped to what the page can scroll to. */
let bounds: number[] = [0];

/** Scroll offset -> place on the rail (0..1), evenly per section. */
function toRail(y: number) {
  const n = bounds.length - 1;
  if (n < 1) return 0;
  for (let i = 0; i < n; i++) {
    const a = bounds[i], b = bounds[i + 1];
    if (y < b || i === n - 1) return Math.min(Math.max((i + (b > a ? (y - a) / (b - a) : 1)) / n, 0), 1);
  }
  return 1;
}

/** Place on the rail (0..1) -> scroll offset. */
function fromRail(p: number) {
  const n = bounds.length - 1;
  if (n < 1) return 0;
  const i = Math.min(Math.floor(p * n), n - 1);
  return bounds[i] + (p * n - i) * (bounds[i + 1] - bounds[i]);
}

export function ScrollRail() {
  const railRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);
  const [stops, setStops] = useState<Stop[]>([]);
  const [active, setActive] = useState("home");
  const [moving, setMoving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dark = active === "contact";

  useEffect(() => {
    const rail = railRef.current;
    const marker = markerRef.current;
    if (!rail || !marker) return;
    let raf = 0;
    let idle: ReturnType<typeof setTimeout> | undefined;
    let maxScroll = 1;
    let sections: { id: string; top: number }[] = [];

    const measure = () => {
      maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      sections = [...document.querySelectorAll<HTMLElement>(".onepage-section[data-section]")].map((el) => ({
        id: el.dataset.section ?? "",
        top: el.getBoundingClientRect().top + window.scrollY,
      }));
      // One stop per section, evenly spaced; the stretch between two stops maps to the scroll between
      // their sections' tops. The last section usually starts past maxScroll, so it sits at the end.
      bounds = sections.map((s, i) => (i === 0 ? 0 : Math.min(s.top, maxScroll)));
      const n = Math.max(sections.length - 1, 1);
      setStops(sections.map((s, i) => ({ id: s.id, at: i / n })));
      update();
    };

    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const p = toRail(y);
      marker.style.transform = `translateY(${(p * rail.clientHeight).toFixed(1)}px)`;
      const pct = Math.round(Math.min(Math.max(y / maxScroll, 0), 1) * 100);
      if (pctRef.current) pctRef.current.textContent = `${String(pct).padStart(2, "0")}%`;
      // The section whose top has passed a third of the screen.
      const line = y + window.innerHeight / 3;
      let current = sections[0]?.id ?? "home";
      for (const s of sections) if (s.top <= line) current = s.id;
      setActive(current);
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
      setMoving(true);
      clearTimeout(idle);
      idle = setTimeout(() => setMoving(false), 1200);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(idle);
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
    };
  }, []);

  // Drag along the rail: the pointer's place on the line is the place on the page.
  const scrollToPointer = (clientY: number) => {
    const rail = railRef.current;
    if (!rail) return;
    const r = rail.getBoundingClientRect();
    const p = Math.min(Math.max((clientY - r.top) / r.height, 0), 1);
    window.scrollTo({ top: fromRail(p), behavior: "instant" });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("a")) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(true);
    scrollToPointer(e.clientY);
  };

  const label = active === "home" ? "landing" : active;

  return (
    <nav
      aria-label="Page position"
      data-dark={dark || undefined}
      data-open={moving || dragging || undefined}
      className="scroll-rail"
      onPointerDown={onPointerDown}
      onPointerMove={(e) => dragging && scrollToPointer(e.clientY)}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
    >
      <div ref={railRef} className="scroll-rail-line">
        <ol role="list">
          {stops.map((s) => (
            <li key={s.id} style={{ top: `${s.at * 100}%` }} data-current={s.id === active || undefined}>
              <a href={`#${s.id}`} aria-label={`Go to ${s.id}`} aria-current={s.id === active ? "location" : undefined}>
                <span className="scroll-rail-stop" aria-hidden="true" />
                <span className="scroll-rail-name">{s.id}</span>
              </a>
            </li>
          ))}
        </ol>
        <div ref={markerRef} className="scroll-rail-marker" aria-hidden="true">
          <span className="scroll-rail-pulse" />
          <span className="scroll-rail-target" />
          <span className="scroll-rail-chip">
            <span className="scroll-rail-here">You&apos;re here</span>
            <span className="scroll-rail-where">{label}</span>
            <span ref={pctRef} className="scroll-rail-pct">00%</span>
          </span>
        </div>
      </div>
    </nav>
  );
}
