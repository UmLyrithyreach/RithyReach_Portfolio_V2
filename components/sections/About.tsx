"use client";

// Behind the code (portfolio.md §5): the 1440x800 frame at 1:1 in cqw on the cream ground. Bottom
// up: the contour backdrop, the dark band, the casual cut-out on its parallax layer, the gradient
// melting its foot into the band, then the masthead, the intro and its button, the two bracket
// panels and the contact strip on the band. No seam: the works block above is cream too.

import { useEffect, useRef, type MouseEvent } from "react";
import Image from "next/image";
import { gate, isReducedMotion, motion, reveal, scrollTrigger, scrollToTarget, SPRINGS, type MotionHandle } from "@/lib/engine";
import { ARROW_PATH, CTA_PATH, FRAME, PARALLAX_PORTRAIT } from "@/lib/about/geometry";
import { ContourCanvas } from "@/components/shared/ContourCanvas";
import Panels, { ABOUT_STATS } from "@/components/about/Panels";
import ContactStrip from "@/components/about/ContactStrip";

const HEAD_LINES = ["behind", "the code"] as const;
const COPY =
  "You can call me Reach or Kaizen — a web development student at CADT, building full-stack apps with React, Next.js, Node.js and PostgreSQL.";

export default function About() {
  const sectionRef = useRef<HTMLElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);

  // Entrances (mode forward, enabled while the block is in view). Reduced motion: shown as is.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || isReducedMotion()) return;
    const q = (selector: string) => Array.from(section.querySelectorAll<HTMLElement>(selector));
    const one = (selector: string) => section.querySelector<HTMLElement>(selector);
    const motions: MotionHandle[] = [];

    // The text is passed so a second run (Strict Mode) never reads the split spans.
    q("[data-about-line]").forEach((line, index) => {
      motions.push(reveal(line, { by: "words", stagger: 110, delayIn: index * 130, mode: "forward", text: HEAD_LINES[index] }));
    });
    motions.push(motion(one("[data-about-stop]"), { from: { opacity: 0 }, to: { opacity: 1 }, delayIn: 130 + 110, mode: "forward" }));
    motions.push(reveal(one("[data-about-copy]"), {
      by: "words", stagger: 30, config: SPRINGS.COPY_FAST, columnGap: "0.22em", delayIn: 2 * 130 + 90, mode: "forward", text: COPY,
    }));
    motions.push(motion(one("[data-about-cta]"), {
      from: { opacity: 0, y: "0.75rem" }, to: { opacity: 1, y: 0 }, delayIn: 2 * 130 + 260, mode: "forward",
    }));

    motions.push(motion(one('[data-about-brackets="school"]'), { from: { opacity: 0 }, to: { opacity: 1 }, delayIn: 320, mode: "forward" }));
    motions.push(motion(one("[data-about-school]"), {
      from: { opacity: 0, y: "0.5rem" }, to: { opacity: 1, y: 0 }, delayIn: 410, mode: "forward",
    }));
    motions.push(motion(one('[data-about-brackets="stats"]'), { from: { opacity: 0 }, to: { opacity: 1 }, delayIn: 460, mode: "forward" }));
    // Row r: its rule draws in at 460 + r * 90, the row rises 40 later, its figure types at +120.
    q(".about-stat").forEach((stat, row) => {
      const at = 460 + row * 90;
      const rule = stat.querySelector<HTMLElement>("[data-about-stat-rule]");
      if (rule) motions.push(motion(rule, { from: { scaleX: 0 }, to: { scaleX: 1 }, delayIn: at, mode: "forward" }));
      motions.push(motion(stat.querySelector<HTMLElement>("[data-about-stat-row]"), {
        from: { opacity: 0, y: "0.5rem" }, to: { opacity: 1, y: 0 }, config: SPRINGS.ROW, delayIn: at + 40, mode: "forward",
      }));
      motions.push(reveal(stat.querySelector<HTMLElement>("[data-about-stat-figure]"), {
        by: "letters", stagger: 24, config: SPRINGS.FIGURE, columnGap: "0.25em", delayIn: at + 120, mode: "forward",
        text: ABOUT_STATS[row].figure,
      }));
    });
    return gate(section, motions);
  }, []);

  // The portrait's layer scrubs up only, 48 frame px, over the block's crossing.
  useEffect(() => {
    const section = sectionRef.current;
    const layer = layerRef.current;
    if (!section || !layer || isReducedMotion()) return;
    const lift = (PARALLAX_PORTRAIT / FRAME.width) * 100;
    const stop = scrollTrigger(section, {
      start: "top bottom",
      end: "bottom top",
      onUpdate: (progress) => {
        layer.style.top = `${(-lift * progress).toFixed(4)}cqw`;
      },
    });
    return () => {
      stop();
      layer.style.top = "";
    };
  }, []);

  const toContact = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    scrollToTarget("#contact");
  };

  return (
    <section ref={sectionRef} id="about" aria-labelledby="about-head">
      <ContourCanvas className="about-contour" colorToken="--paddock-contour" />
      <div className="about-band" aria-hidden="true" />
      <div ref={layerRef} className="about-figure-layer">
        <div className="about-figure">
          <Image
            className="about-figure-img"
            src="/image/cutout-less_professional.webp"
            alt="Reach in a cap and T-shirt"
            width={922}
            height={1100}
            sizes="(max-width: 639px) 484px, (max-width: 1023px) 96vw, 50vw"
            draggable={false}
          />
        </div>
      </div>
      <div className="about-melt" aria-hidden="true" />

      <h2 id="about-head" className="about-head">
        <span className="about-line" data-about-line>{HEAD_LINES[0]}</span>
        <span className="about-last">
          <span className="about-line" data-about-line>{HEAD_LINES[1]}</span>
          <span className="about-stop" data-about-stop aria-hidden="true">.</span>
        </span>
      </h2>

      <div className="about-intro">
        <p className="about-copy" data-about-copy>{COPY}</p>
        <a className="about-cta" data-about-cta href="#contact" onClick={toContact}>
          <svg className="about-cta-frame" viewBox="0 0 217 50" preserveAspectRatio="none" aria-hidden="true" focusable="false">
            <path className="about-cta-body" d={CTA_PATH} />
            <path className="about-cta-flood" d={CTA_PATH} />
            <path className="about-cta-outline" d={CTA_PATH} />
          </svg>
          <span className="about-cta-label">
            let&apos;s talk
            <svg className="about-cta-arrow" viewBox="0 0 13.71 10.71" aria-hidden="true" focusable="false">
              <path d={ARROW_PATH} />
            </svg>
          </span>
        </a>
      </div>

      <Panels />
      <ContactStrip />
    </section>
  );
}
