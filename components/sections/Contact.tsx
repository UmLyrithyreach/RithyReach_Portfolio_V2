"use client";

// Let's build together (portfolio.md §6), the page's sign-off: a green page edge round a
// near-black panel inset 16 frame px that holds the white contour backdrop. The suit-and-tie
// cut-out stands on the section (not in the panel) so its jacket covers the edge at the foot, and
// rides back into place as the page bottoms out. The wordmark, masthead, nav column and foot row
// sit on the section in frame-relative coordinates. No seam: the green edge draws the join.

import { useEffect, useRef } from "react";
import Image from "next/image";
import { gate, isReducedMotion, motion, reveal, scrollTrigger, SPRINGS, type MotionHandle } from "@/lib/engine";
import { FRAME, PARALLAX_FIGURE } from "@/lib/footer/geometry";
import { ContourCanvas } from "@/components/shared/ContourCanvas";
import FooterNav, { FOOTER_NAV } from "@/components/footer/FooterNav";
import FooterFoot from "@/components/footer/FooterFoot";

const HEAD_LINES = ["let's build", "together"] as const;
const NAV_DELAY = 260;
const NAV_STAGGER = 80;
const FOOT_DELAY = 640;

export default function Contact() {
  const sectionRef = useRef<HTMLElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);

  // Entrances (mode forward, enabled while the block is in view). Reduced motion: shown as is.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || isReducedMotion()) return;
    const q = (selector: string) => Array.from(section.querySelectorAll<HTMLElement>(selector));
    const motions: MotionHandle[] = [];

    motions.push(motion(section.querySelector<HTMLElement>("[data-footer-logo]"), {
      from: { opacity: 0 }, to: { opacity: 1 }, delayIn: 120, mode: "forward",
    }));
    // The text is passed so a second run (Strict Mode) never reads the split spans.
    q("[data-footer-line]").forEach((line, index) => {
      motions.push(reveal(line, { by: "words", stagger: 110, delayIn: index * 130, mode: "forward", text: HEAD_LINES[index] }));
    });
    motions.push(motion(section.querySelector<HTMLElement>("[data-footer-stop]"), {
      from: { opacity: 0 }, to: { opacity: 1 }, delayIn: 130 + 110, mode: "forward",
    }));
    q("[data-footer-nav]").forEach((label, index) => {
      motions.push(reveal(label, {
        by: "letters", stagger: 22, config: SPRINGS.ROW, columnGap: "0.2em",
        delayIn: NAV_DELAY + index * NAV_STAGGER, mode: "forward", text: FOOTER_NAV[index],
      }));
      label.style.flexWrap = "nowrap";
    });
    q("[data-footer-foot]").forEach((el, index) => {
      motions.push(motion(el, {
        from: { opacity: 0, y: "0.75rem" }, to: { opacity: 1, y: 0 }, delayIn: FOOT_DELAY + index * 80, mode: "forward",
      }));
    });
    return gate(section, motions);
  }, []);

  // The figure's layer: 60 frame px down to 0 over "top bottom" -> "bottom bottom", the moment the
  // page reaches its end, so the resting frame is exact. Reduced motion: it rests in place.
  useEffect(() => {
    const section = sectionRef.current;
    const layer = layerRef.current;
    if (!section || !layer || isReducedMotion()) return;
    const drop = (PARALLAX_FIGURE / FRAME.width) * 100;
    const stop = scrollTrigger(section, {
      start: "top bottom",
      end: "bottom bottom",
      onUpdate: (progress) => {
        layer.style.top = `${(drop * (1 - progress)).toFixed(4)}cqw`;
      },
    });
    return () => {
      stop();
      layer.style.top = "";
    };
  }, []);

  return (
    <section ref={sectionRef} id="contact" data-footer aria-labelledby="contact-head">
      <div className="footer-panel" aria-hidden="true">
        <ContourCanvas className="footer-contour" colorToken="--footer-contour" />
      </div>

      <div className="footer-figure">
        <div ref={layerRef} className="footer-figure-layer">
          <div className="footer-frame">
            <Image
              className="footer-portrait"
              src="/image/cutout-professional.webp"
              alt="Reach in a suit and tie"
              width={922}
              height={1100}
              sizes="(max-width: 639px) 1px, (max-width: 1023px) 56vw, 40vw"
              draggable={false}
            />
          </div>
        </div>
      </div>

      <p className="footer-logo" data-footer-logo role="img" aria-label="RithyReach">
        &lt; RithyReach /&gt;
      </p>

      <h2 id="contact-head" className="footer-head">
        <span className="footer-line" data-footer-line>{HEAD_LINES[0]}</span>
        <span className="footer-last">
          <span className="footer-line" data-footer-line>{HEAD_LINES[1]}</span>
          <span className="footer-stop" data-footer-stop aria-hidden="true">.</span>
        </span>
      </h2>

      <FooterNav />
      <FooterFoot />
    </section>
  );
}
