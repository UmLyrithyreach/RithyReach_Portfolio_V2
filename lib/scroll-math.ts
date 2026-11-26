// Small helpers for scroll-driven timelines measured in viewport heights of page scroll.

/** Hermite ease of x between a and b: 0 below a, 1 above b, smooth in between. */
export const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};

/** The viewport height in px. The transforms also run once on the server, where there is no window. */
export const viewportHeight = () => (typeof window !== "undefined" ? window.innerHeight : 1);
