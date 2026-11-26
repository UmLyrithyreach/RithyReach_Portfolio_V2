"use client";

// The hand-off from the hero to the intro, driven by the page scroll in viewport heights (a).
// Once the hero's copy starts to fade, one giant line, "HELLO I'M REACH", sweeps across the screen
// from the right edge until it has gone off the left (0.3 -> 1). It is drawn in white with
// mix-blend-mode: difference, so it reads light over the dark hero video and dark over the cream
// intro without switching colour. Under it a short cream veil (0.4 -> 0.66) hides the hero fading
// out and the intro sliding in from the right (Intro.tsx, hero.css).
// Only transform and opacity change while scrolling. Not rendered under reduced motion (Hero.tsx).

import { motion, useScroll, useTransform } from "framer-motion";
import { smoothstep, viewportHeight } from "@/lib/scroll-math";

export const HELLO = "Hello I'm Reach";

export function HelloSweep() {
  const { scrollY } = useScroll();
  const a = useTransform(scrollY, (s) => s / viewportHeight());
  const visibility = useTransform(a, (v) => (v > 0.3 && v < 1.02 ? "visible" : "hidden"));
  const veil = useTransform(a, (v) => smoothstep(0.4, 0.48, v) * (1 - smoothstep(0.52, 0.66, v)));
  // From its left edge at the right of the screen to its right edge past the left of the screen,
  // at a steady pace (it is scroll-locked, so easing would only feel like drag).
  const x = useTransform(a, (v) => `calc(${-Math.min(Math.max((v - 0.3) / 0.7, 0), 1)} * (100vw + 100%))`);

  return (
    <>
      <motion.div aria-hidden="true" className="hello-sweep-veil" style={{ opacity: veil, visibility }} />
      {/* The blend sits on this layer, so the words blend with the page itself (an inner blend would
          only see this layer's own transparent backdrop and render plain white). */}
      <motion.div aria-hidden="true" className="hello-sweep" style={{ visibility }}>
        <motion.p className="hello-sweep-line" style={{ x }}>
          {HELLO}
        </motion.p>
      </motion.div>
    </>
  );
}
