"use client";

import React, { useEffect, useRef } from "react";
import { initLenis, scrollToTarget } from "@/lib/engine";

interface StickyStackProps {
  hero: React.ReactNode;
  skills: React.ReactNode;
  works: React.ReactNode;
}

export function StickyStack({ hero, skills, works }: StickyStackProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initLenis();

    // 1. Root font scale above 1920
    const updateRootFont = () => {
      document.documentElement.style.fontSize =
        window.innerWidth > 1920 ? `${(16 * window.innerWidth) / 1920}px` : "";
    };
    updateRootFont();
    window.addEventListener("resize", updateRootFont);

    // 2. Global in-page a[href^="#"] clicks
    const onAnchorClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest('a[href^="#"]');
      if (!link) return;
      const href = link.getAttribute("href");
      if (!href) return;
      event.preventDefault();
      requestAnimationFrame(() => scrollToTarget(href));
    };
    document.addEventListener("click", onAnchorClick);

    // 3. Sticky recede rAF listener + extra top calculation
    const stackEl = containerRef.current;
    if (!stackEl) return;

    const layers = Array.from(stackEl.querySelectorAll<HTMLElement>(":scope > [data-stack-layer]"));
    const pinned = layers
      .map((layer, i) => ({
        layer,
        inner: layer.querySelector<HTMLElement>(":scope > [data-stack-inner]"),
        shade: layer.querySelector<HTMLElement>(":scope > [data-stack-shade]"),
        next: layers[i + 1] || stackEl.querySelector<HTMLElement>(":scope > .stack-last"),
      }))
      .filter((item): item is { layer: HTMLElement; inner: HTMLElement; shade: HTMLElement; next: HTMLElement } =>
        Boolean(item.inner && item.shade && item.next)
      );

    const updateLayerTops = () => {
      const vh = window.innerHeight;
      for (const { layer, inner } of pinned) {
        const extra = Math.max(0, inner.offsetHeight - vh);
        layer.style.top = extra > 0 ? `-${extra}px` : "0px";
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      updateLayerTops();
      scheduleApply();
    });

    for (const { inner } of pinned) {
      resizeObserver.observe(inner);
    }

    const RECEDE_SCALE = 0.9;
    const RECEDE_SHADE = 0.55;
    const phone = window.matchMedia("(max-width: 639px)");

    const apply = () => {
      const view = window.innerHeight || 1;
      const shrink = phone.matches ? 0 : 1 - RECEDE_SCALE;
      for (const { inner, shade, next } of pinned) {
        const p = Math.min(1, Math.max(0, 1 - next.getBoundingClientRect().top / view));
        inner.style.transform = p > 0 && shrink > 0 ? `scale(${1 - shrink * p})` : "";
        inner.style.willChange = p > 0 && shrink > 0 ? "transform" : "";
        shade.style.opacity = `${RECEDE_SHADE * p}`;
        inner.style.visibility = p >= 1 ? "hidden" : "visible";
      }
    };

    let frame = 0;
    const scheduleApply = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        apply();
      });
    };

    window.addEventListener("scroll", scheduleApply, { passive: true });
    window.addEventListener("resize", () => {
      updateLayerTops();
      scheduleApply();
    });
    phone.addEventListener("change", scheduleApply);

    updateLayerTops();
    apply();

    return () => {
      window.removeEventListener("resize", updateRootFont);
      document.documentElement.style.fontSize = "";
      document.removeEventListener("click", onAnchorClick);
      resizeObserver.disconnect();
      window.removeEventListener("scroll", scheduleApply);
      window.removeEventListener("resize", scheduleApply);
      phone.removeEventListener("change", scheduleApply);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="stack" data-stack ref={containerRef}>
      <div className="stack-layer" data-stack-layer style={{ zIndex: 0 }}>
        <div className="stack-inner" data-stack-inner>
          {hero}
        </div>
        <div className="stack-shade" data-stack-shade aria-hidden="true" />
      </div>
      <div className="stack-layer" data-stack-layer style={{ zIndex: 10 }}>
        <div className="stack-inner" data-stack-inner>
          {skills}
        </div>
        <div className="stack-shade" data-stack-shade aria-hidden="true" />
      </div>
      <div className="stack-last" style={{ position: "relative", zIndex: 20 }}>
        {works}
      </div>
    </div>
  );
}
