// Colour helpers shared by the season map's two canvases.

export type Rgb = [number, number, number];

export interface SeasonPalette {
  /** The resting halftone dot, as a CSS colour (may carry alpha). */
  dot: string;
  /** The lap's accent. */
  accent: Rgb;
  /** The far end of the heat ramp: white on the dark ground, the deep green on cream. */
  white: Rgb;
  /** mix(accent, white, 0.55). */
  bright: Rgb;
}

export const mix = (a: Rgb, b: Rgb, t: number): Rgb => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
];

export const css = ([r, g, b]: Rgb) => `rgb(${r} ${g} ${b})`;
export const rgba = ([r, g, b]: Rgb, alpha: number) => `rgb(${r} ${g} ${b} / ${alpha})`;

/** A computed colour ("rgb(31, 209, 107)", "rgb(31 209 107 / 0.5)") to its channels. */
export const toRgb = (value: string): Rgb => {
  const [r = 0, g = 0, b = 0] = (value.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
  return [r, g, b];
};

/** engine.readToken, but probed inside `scope` so tokens set on the section resolve. */
export const readScopedToken = (scope: Element, name: string): string => {
  const probe = document.createElement("span");
  probe.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;color:var(${name})`;
  scope.appendChild(probe);
  const colour = getComputedStyle(probe).color;
  probe.remove();
  return colour;
};
