"use client";

import React, { useEffect, useRef, useState } from "react";

export interface PagerSlide {
  id: string;
  label: string;
  /** Colour of the navbar over this section. */
  tone: "light" | "dark";
  /** Hero ships its own masthead, so the shared navbar stays hidden while it is on screen. */
  ownNav?: boolean;
  node: React.ReactNode;
}

/** One continuous scroll page: every section stacked in order, anchor links scroll to them. */
export function Pager({ slides }: { slides: PagerSlide[] }) {
  const [activeId, setActiveId] = useState(slides[0]?.id);
  const sectionEls = useRef<(HTMLDivElement | null)[]>([]);

  // Track which section sits under the navbar line, for the nav highlight and tone.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset.section;
          if (entry.isIntersecting && id) setActiveId(id);
        }
      },
      { rootMargin: "-56px 0px -90% 0px" },
    );
    for (const el of sectionEls.current) if (el) io.observe(el);
    return () => io.disconnect();
  }, [slides]);

  const current = slides.find((s) => s.id === activeId) ?? slides[0];
  const navHidden = !!current.ownNav;

  return (
    <div className="onepage">
      <header
        data-tone={current.tone}
        data-hidden={navHidden || undefined}
        inert={navHidden}
        className="pager-nav fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between px-6 sm:px-8 lg:px-10"
      >
        <a href="#home" aria-label="RithyReach — home" className="font-mono text-sm font-bold uppercase tracking-tight">
          <span className="text-accent">&lt;</span> RithyReach <span className="text-accent">/&gt;</span>
        </a>
        <nav aria-label="Primary" className="absolute left-1/2 hidden -translate-x-1/2 md:block">
          <ul role="list" className="flex gap-12 font-sans text-sm uppercase">
            {slides.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  aria-current={s.id === current.id ? "location" : undefined}
                  className={`transition-colors duration-150 hover:text-accent ${s.id === current.id ? "text-accent" : ""}`}
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <a href="#contact" className="font-sans text-sm font-bold uppercase transition-colors duration-150 hover:text-accent">
          [ Let&apos;s Talk → ]
        </a>
      </header>

      {slides.map((s, i) => (
        <div
          key={s.id}
          ref={(el) => {
            sectionEls.current[i] = el;
          }}
          className="onepage-section"
          data-section={s.id}
          data-nav={s.ownNav ? "own" : "shared"}
        >
          {s.node}
        </div>
      ))}
    </div>
  );
}
