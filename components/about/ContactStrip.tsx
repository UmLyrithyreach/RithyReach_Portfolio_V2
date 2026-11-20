"use client";

// The contact strip on the dark band (portfolio.md §5): four dashed connectors crawling toward the
// preferred channel, a marker over each card, five channel cards, and the accent bracket around the
// preferred one. Its entrance is gated on the strip entering view (once); below sm it is a three-up
// grid of email, telegram and discord.

import { useEffect, useRef, type CSSProperties } from "react";
import { gate, isReducedMotion, loopInView, motion, SPRINGS, type MotionHandle } from "@/lib/engine";
import { STRIP, STRIP_CHANNELS } from "@/lib/about/strip";
import Brackets from "@/components/about/Brackets";

const preferredCentre = STRIP_CHANNELS.find((c) => c.preferred)?.centre ?? 720;

/** A break opportunity before an address's "@", where a wrapped handle reads best. */
const breakAtSign = (handle: string) => {
  const at = handle.indexOf("@");
  return at > 0 ? <>{handle.slice(0, at)}<wbr />{handle.slice(at)}</> : handle;
};

type Vars = CSSProperties & Record<`--${string}`, string | number>;

export default function ContactStrip() {
  const stripRef = useRef<HTMLDivElement>(null);
  const pulseRef = useRef<SVGCircleElement>(null);

  // Entrances: connectors at 560 + i*90, cards at 560 + i*90 (name +110), markers +60, bracket after.
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip || isReducedMotion()) return;
    const q = (selector: string) => Array.from(strip.querySelectorAll<HTMLElement>(selector));
    const motions: MotionHandle[] = [];
    q(".about-link").forEach((link, index) => {
      motions.push(motion(link, { from: { scaleX: 0 }, to: { scaleX: 1 }, delayIn: 560 + index * 90, mode: "forward" }));
    });
    q(".about-mark").forEach((mark, index) => {
      motions.push(motion(mark, { from: { opacity: 0 }, to: { opacity: 1 }, delayIn: 560 + index * 90 + 60, mode: "forward" }));
    });
    q(".about-card").forEach((card, index) => {
      const at = 560 + index * 90;
      motions.push(motion(card, { from: { opacity: 0, y: "0.5rem" }, to: { opacity: 1, y: 0 }, delayIn: at, mode: "forward" }));
      motions.push(motion(card.querySelector<HTMLElement>(".about-card-platform"), {
        from: { opacity: 0, y: "0.3em" }, to: { opacity: 1, y: "0em" }, config: SPRINGS.NAME, delayIn: at + 110, mode: "forward",
      }));
    });
    motions.push(motion(q(".about-live")[0], {
      from: { opacity: 0 }, to: { opacity: 1 }, delayIn: 560 + 5 * 90, mode: "forward",
    }));
    // The spec's -20% foot margin never admits the strip when the block is parked under the navbar
    // (the band is ~19% of a 1440x900 screen); -10% still waits for it to be well into view.
    return gate(strip, motions, { rootMargin: "0% 0% -10% 0%", once: true });
  }, []);

  // The pulse on the preferred marker: r = 5.5 + v * 5.5 * 3.4, opacity 0.5 (1 - v)^2, v 0 -> 1
  // every 3200ms, ease-out quad. Paused off screen; still under reduced motion.
  useEffect(() => {
    const pulse = pulseRef.current;
    const mark = pulse?.closest<HTMLElement>(".about-mark");
    if (!pulse || !mark || isReducedMotion()) return;
    let elapsed = 0;
    let previous: number | null = null;
    return loopInView(mark, (time) => {
      if (previous !== null) elapsed += Math.min(64, Math.max(0, time - previous));
      previous = time;
      const k = (elapsed % STRIP.pulseMs) / STRIP.pulseMs;
      const v = 1 - (1 - k) * (1 - k);
      pulse.setAttribute("r", (5.5 + v * 5.5 * 3.4).toFixed(3));
      pulse.style.opacity = (0.5 * (1 - v) * (1 - v)).toFixed(4);
    });
  }, []);

  return (
    <div ref={stripRef} className="about-strip">
      <div className="about-links" aria-hidden="true">
        {STRIP.links.map(({ x, width }) => (
          <span
            key={x}
            className="about-link"
            data-crawl={x < preferredCentre ? "right" : "left"}
            style={{ "--x": x, "--w": width } as Vars}
          />
        ))}
      </div>
      <div className="about-marks" aria-hidden="true">
        {STRIP_CHANNELS.map((channel) => (
          <span key={channel.platform} className="about-mark" style={{ "--c": channel.centre } as Vars}>
            {channel.marker === "pref" ? (
              <span className="about-mark-word">pref</span>
            ) : (
              <svg viewBox={`0 0 ${STRIP.dot} ${STRIP.dot}`} focusable="false">
                {channel.preferred ? (
                  <>
                    <circle ref={pulseRef} className="about-mark-pulse" cx="5.5" cy="5.5" r="5.5" />
                    <circle className="about-mark-dot" cx="5.5" cy="5.5" r="5.5" />
                  </>
                ) : (
                  <circle className="about-mark-ring" cx="5.5" cy="5.5" r="5" />
                )}
              </svg>
            )}
          </span>
        ))}
      </div>
      <ul className="about-cards" role="list" aria-label="Contact channels">
        {STRIP_CHANNELS.map((channel) => {
          const external = !channel.href.startsWith("mailto:");
          const vars: Vars = { "--x": channel.x, "--w": channel.width };
          if (channel.phoneOrder >= 0) vars["--phone-order"] = channel.phoneOrder;
          return (
            <li
              key={channel.platform}
              className="about-card"
              data-preferred={channel.preferred || undefined}
              data-phone={channel.phoneOrder >= 0 || undefined}
              style={vars}
            >
              <a href={channel.href} {...(external ? { target: "_blank", rel: "noopener" } : {})}>
                <span className="about-card-descriptor">{channel.descriptor}</span>
                <span className="about-card-platform">{channel.platform}</span>
                <span className="about-card-handle">{breakAtSign(channel.handle)}</span>
                {external && <span className="vh">(opens in a new tab)</span>}
              </a>
            </li>
          );
        })}
      </ul>
      <Brackets className="about-live" dataKey="live" />
    </div>
  );
}
