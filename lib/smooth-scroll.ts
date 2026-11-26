// The site-wide Lenis instance (created by components/shared/SmoothScroll.tsx), driven by GSAP's ticker.
// Null when reduced motion is on or before the client mounts; callers fall back to native scrolling.

import type Lenis from "lenis";

let instance: Lenis | null = null;

export const setLenis = (lenis: Lenis | null) => {
  instance = lenis;
};

export const getLenis = (): Lenis | null => instance;

/** Scroll the page to `top` px: through Lenis when it runs, natively otherwise. */
export function scrollToY(
  top: number,
  opts: { duration?: number; easing?: (t: number) => number; immediate?: boolean } = {},
): void {
  if (typeof window === "undefined") return;
  if (instance) {
    instance.scrollTo(top, { duration: opts.duration ?? 1.2, easing: opts.easing, immediate: opts.immediate, force: true });
    return;
  }
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top, behavior: opts.immediate || reduced ? "auto" : "smooth" });
}
