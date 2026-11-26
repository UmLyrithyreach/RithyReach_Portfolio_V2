"use client";

// Site-wide smooth scrolling: Lenis eases the native window scroll, GSAP's ticker drives it, and
// ScrollTrigger is kept in sync. Lenis moves window.scrollY itself, so framer-motion's useScroll,
// IntersectionObserver and plain scroll listeners keep working unchanged. Reduced motion: no Lenis.

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { setLenis } from "@/lib/smooth-scroll";

gsap.registerPlugin(ScrollTrigger);

export function SmoothScroll() {
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lenis: Lenis | null = null;
    let lockObserver: MutationObserver | null = null;
    const raf = (time: number) => lenis?.raf(time * 1000);

    const start = () => {
      if (lenis || mq.matches) return;
      lenis = new Lenis({
        autoRaf: false,
        lerp: 0.1,
        wheelMultiplier: 1,
        anchors: true, // in-page <a href="#…"> links glide too
        allowNestedScroll: true,
      });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
      setLenis(lenis);

      // The launch veil locks scrolling with html.veil-lock; pause Lenis while it is there.
      const html = document.documentElement;
      const syncLock = () => (html.classList.contains("veil-lock") ? lenis?.stop() : lenis?.start());
      lockObserver = new MutationObserver(syncLock);
      lockObserver.observe(html, { attributes: true, attributeFilter: ["class"] });
      syncLock();
      ScrollTrigger.refresh();
    };

    const stop = () => {
      lockObserver?.disconnect();
      lockObserver = null;
      gsap.ticker.remove(raf);
      lenis?.destroy();
      lenis = null;
      setLenis(null);
    };

    const onPref = () => (mq.matches ? stop() : start());
    start();
    mq.addEventListener("change", onPref);
    return () => {
      mq.removeEventListener("change", onPref);
      stop();
    };
  }, []);

  return null;
}
