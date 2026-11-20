"use client";

// One timeline row (portfolio.md §4): plate, number and copy, each on its own parallax layer that
// moves on `top`, never a transform. The number rides its plate's figure. Reduced motion: shown as is.

import { useEffect, useRef, type CSSProperties } from "react";
import { gate, isReducedMotion, motion, reveal, scrollTrigger, SPRINGS, type MotionHandle } from "@/lib/engine";
import type { WorksRow } from "@/lib/works/entries";
import { PARALLAX, px } from "@/lib/works/timeline-geometry";
import TimelinePlate from "./TimelinePlate";

const PLATE_SIZES = {
  centre: "(min-width: 1024px) 50vw, 82vw",
  side: "(min-width: 1024px) 24vw, 82vw",
} as const;

const LINK_PROPS = { target: "_blank", rel: "noopener" } as const;

export default function TimelineRow({ row }: { row: WorksRow }) {
  const rowRef = useRef<HTMLElement>(null);
  const { project, frame, align, copyWidth, alt, meta } = row;

  useEffect(() => {
    const el = rowRef.current;
    if (!el || isReducedMotion()) return;
    const q = (selector: string) => el.querySelector<HTMLElement>(selector)!;
    const plateBox = q("[data-works-plate-box]");
    const platePar = q("[data-works-plate-par]");
    const numberEl = q("[data-works-number]");
    const numberPar = q("[data-works-num-par]");
    const copyPar = q("[data-works-copy-par]");
    const img = q("[data-works-img]");
    const plateTravel = PARALLAX.plate[frame];

    // Three layers on the row's whole crossing: +travel → −travel, through the design position as
    // the row passes the middle of the screen.
    const stopRow = scrollTrigger(el, {
      start: "top bottom",
      end: "bottom top",
      onUpdate: (progress) => {
        const k = 1 - 2 * progress;
        const plateTop = px(plateTravel * k);
        platePar.style.top = plateTop;
        numberPar.style.top = plateTop;
        copyPar.style.top = px(PARALLAX.copy * k);
      },
    });

    // In-plate travel: the photograph's 110% overscan, pinned to the top, slides -10% → 0%.
    const stopSlot = scrollTrigger(plateBox, {
      start: "top bottom",
      end: "top center",
      onUpdate: (progress) => {
        img.style.top = `${-10 + 10 * progress}%`;
      },
    });

    // The number assembles letter by letter (the text is passed so a second run never reads the
    // split spans); a centre row's settles to 40% after a 2200ms hold. The copy rises at +220.
    const motions: MotionHandle[] = [
      reveal(q("[data-works-num]"), {
        by: "letters", stagger: 26, config: SPRINGS.YEAR, mode: "forward", text: project.number,
      }),
      motion(q("[data-works-copy-rise]"), {
        from: { opacity: 0, y: "0.75rem" }, to: { opacity: 1, y: 0 }, config: SPRINGS.COPY, delayIn: 220, mode: "forward",
      }),
    ];
    if (frame === "centre") {
      motions.push(motion(numberEl, {
        from: { opacity: 1 }, to: { opacity: 0.4 }, config: SPRINGS.YEAR_SETTLE, delayIn: 2200, mode: "once",
      }));
    }
    const stopGate = gate(el, motions, { rootMargin: "0% 0% -25% 0%", once: true });

    return () => {
      stopRow();
      stopSlot();
      stopGate();
    };
  }, [frame, project.number]);

  const href = project.live ?? project.code ?? "";
  const label = `${project.title} — ${project.live ? "open live site" : "view code"}`;
  const style = copyWidth ? ({ "--copy-w": px(copyWidth) } as CSSProperties) : undefined;

  return (
    <article
      ref={rowRef}
      className="works-row"
      data-testid="project-card"
      data-frame={frame}
      data-align={align}
      style={style}
    >
      <div className="works-plate-box" data-works-plate-box>
        <div className="works-plate-par" data-works-plate-par>
          <TimelinePlate
            href={href}
            label={label}
            noteId={`works-tab-${project.number}`}
            src={project.image}
            alt={alt}
            sizes={PLATE_SIZES[frame]}
          />
        </div>
      </div>
      <div className="works-number" data-works-number aria-hidden="true">
        <div className="works-num-par" data-works-num-par>
          <span className="works-num" data-works-num>{project.number}</span>
        </div>
      </div>
      <div className="works-copy">
        <div className="works-copy-par" data-works-copy-par>
          <div className="works-copy-rise" data-works-copy-rise>
            <h3 className="works-title">{project.title}</h3>
            <p className="works-text">{project.description}</p>
            <p className="works-meta">{meta}</p>
            <p className="works-links">
              {project.live && (
                <a href={project.live} data-testid="project-live" {...LINK_PROPS}>
                  live<span aria-hidden="true"> ↗</span>
                  <span className="vh"> — {project.title} (opens in a new tab)</span>
                </a>
              )}
              {project.code && (
                <a href={project.code} data-testid="project-code" {...LINK_PROPS}>
                  code<span aria-hidden="true"> ↗</span>
                  <span className="vh"> — {project.title} (opens in a new tab)</span>
                </a>
              )}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
