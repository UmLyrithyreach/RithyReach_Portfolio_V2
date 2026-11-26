"use client";

// The "expand to view" section shell shared by Expertise, Works and the rest.
//   1. Expand: as the section scrolls in (its top from the bottom of the viewport to the top), a
//      centred dark box grows from its starting shape to fill the screen, and the element marked
//      [data-expand-heading] inside it scales from 0.6 to 1. GSAP ScrollTrigger, scrubbed, ease none.
//      The box keeps its 2.4rem corners while growing and squares them off (border gone) as it lands.
//   2. Pin: the stage is sticky for `pinScreens` viewport heights; `progress` runs 0 -> 1 across
//      that stretch and drives the section's own animation (children receive it).
// Each section passes its own starting shape, so the box hints at what's inside, and a tone:
// sections alternate dark and light, each box growing out of the previous section's colour.
// Reduced motion: no expand and no pin; the box is full size and progress stays at 0.
// Palette and layout: globals.css, "expand sections".

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { useMotionValue, type MotionValue } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";

gsap.registerPlugin(ScrollTrigger);

/** A box size: any CSS length GSAP can tween to px ("75%", "60%", "35vw"). */
export interface BoxSize {
  width: string;
  height: string;
}

export interface ExpandSectionProps {
  id: string;
  labelledBy: string;
  className?: string;
  /** How long the stage stays pinned after the expand, in viewport heights of scroll. */
  pinScreens: number;
  /** "dark": a #262626 box growing out of the cream page; "light": a cream box growing out of dark. */
  tone: "dark" | "light";
  /** The starting shape at 1024px and up, and below it. */
  from: { wide: BoxSize; narrow: BoxSize };
  children: (progress: MotionValue<number>) => ReactNode;
}

export function ExpandSection({ id, labelledBy, className = "", tone, pinScreens, from, children }: ExpandSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const progress = useMotionValue(0);
  const reduceMotion = usePrefersReducedMotion();
  const { wide, narrow } = from;
  // Primitive deps, so a caller passing a fresh object each render doesn't rebuild the triggers.
  const [ww, wh, nw, nh] = [wide.width, wide.height, narrow.width, narrow.height];

  useEffect(() => {
    const section = sectionRef.current;
    const box = boxRef.current;
    if (reduceMotion || !section || !box) return;

    const borderColor = getComputedStyle(box).getPropertyValue("--xp-border").trim() || "#404040";
    const ctx = gsap.context(() => {
      const heading = box.querySelector("[data-expand-heading]");
      const mm = gsap.matchMedia();
      mm.add({ isWide: "(min-width: 1024px)", isNarrow: "(max-width: 1023.98px)" }, (c) => {
        const start = c.conditions?.isWide ? { width: ww, height: wh } : { width: nw, height: nh };
        const expand = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: section, start: "top bottom", end: "top top", scrub: true },
        });
        expand.fromTo(box, { width: start.width, height: start.height }, { width: "100%", height: "100%", duration: 1 }, 0);
        if (heading) expand.fromTo(heading, { scale: 0.6 }, { scale: 1, duration: 1 }, 0);
        // Rounded while it grows; square (and borderless) once it fills the screen.
        // The border's colour comes from the tone (globals.css); it fades out as the corners square off.
        expand.fromTo(
          box,
          { borderRadius: "2.4rem", borderColor: borderColor },
          { borderRadius: "0rem", borderColor: "transparent", duration: 0.15 },
          0.85,
        );
      });

      // The pin: the stage is sticky for the rest of the section; this maps that stretch to 0..1.
      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => progress.set(self.progress),
      });
    }, section);

    // Page heights above are in dvh, so they change when a phone's browser toolbar shows or hides.
    // ScrollTrigger ignores those small resizes on touch devices; re-measure once they settle.
    let refreshTimer = 0;
    const onViewportResize = () => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 200);
    };
    window.visualViewport?.addEventListener("resize", onViewportResize);

    return () => {
      window.visualViewport?.removeEventListener("resize", onViewportResize);
      window.clearTimeout(refreshTimer);
      ctx.revert();
    };
  }, [reduceMotion, progress, ww, wh, nw, nh]);

  const style = {
    "--expand-h": `${(pinScreens + 1) * 100}dvh`,
    "--expand-from-w": wide.width,
    "--expand-from-h": wide.height,
    "--expand-from-w-narrow": narrow.width,
    "--expand-from-h-narrow": narrow.height,
  } as CSSProperties;

  return (
    <section ref={sectionRef} id={id} aria-labelledby={labelledBy} className={`expand-section expand-section--${tone} ${className}`} style={style}>
      <div className="expand-stage">
        <div ref={boxRef} className="expand-box">
          {children(progress)}
        </div>
      </div>
    </section>
  );
}
