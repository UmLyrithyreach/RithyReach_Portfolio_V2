// The motion engine: one rAF ticker, react-spring's solver, scroll triggers, the text engine.

import { scrollToY } from "@/lib/smooth-scroll";

export const SPRINGS = Object.freeze({
  REVEAL: { tension: 90, friction: 26 },
  ROW: { tension: 170, friction: 24 },
  ITEM: { tension: 170, friction: 24 },
  SHEET: { tension: 190, friction: 26 },
  FIGURE: { tension: 200, friction: 24 },
  TYPE: { tension: 210, friction: 24 },
  YEAR: { tension: 190, friction: 24 },
  COPY: { tension: 110, friction: 26 },
  COPY_FAST: { tension: 150, friction: 24 },
  NAME: { tension: 190, friction: 24 },
  VEIL: { tension: 70, friction: 24 },
  CLEAR: { tension: 140, friction: 26 },
  LABEL: { tension: 110, friction: 26 },
  PROGRESS_WAIT: { tension: 10, friction: 30 },
  PROGRESS_READY: { tension: 170, friction: 26 },
  YEAR_SETTLE: { tension: 32, friction: 26 },
  TRIGGER: { tension: 140, friction: 30 },
});

export const isReducedMotion = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

export const getMQ = () => {
  if (typeof window === "undefined") {
    const dummy = { matches: false, addEventListener: () => {}, removeEventListener: () => {} } as unknown as MediaQueryList;
    return {
      sm: dummy,
      md: dummy,
      lg: dummy,
      xl: dummy,
      short: dummy,
      coarse: dummy,
      hoverNone: dummy,
      hover: dummy,
    };
  }
  return {
    sm: window.matchMedia("(min-width: 640px)"),
    md: window.matchMedia("(min-width: 768px)"),
    lg: window.matchMedia("(min-width: 1024px)"),
    xl: window.matchMedia("(min-width: 1280px)"),
    short: window.matchMedia("(max-height: 500px)"),
    coarse: window.matchMedia("(hover: none) and (pointer: coarse)"),
    hoverNone: window.matchMedia("(hover: none)"),
    hover: window.matchMedia("(hover: hover)"),
  };
};

export interface TickerSubscriber {
  callback: (time: number) => void;
  getFramerate: () => number;
  last: number;
}

export const ticker = (() => {
  const subscribers = new Set<TickerSubscriber>();
  let frame = 0;
  const loop = (time: number) => {
    frame = requestAnimationFrame(loop);
    for (const subscriber of [...subscribers]) {
      if (!subscribers.has(subscriber)) continue;
      if (time - subscriber.last > subscriber.getFramerate()) {
        subscriber.last = time;
        subscriber.callback(time);
      }
    }
  };
  return {
    subscribe(callback: (time: number) => void, getFramerate: () => number = () => 0) {
      if (typeof window === "undefined") return () => {};
      const subscriber: TickerSubscriber = { callback, getFramerate, last: -Infinity };
      subscribers.add(subscriber);
      if (subscribers.size === 1) frame = requestAnimationFrame(loop);
      return () => {
        if (subscribers.delete(subscriber) && subscribers.size === 0) {
          cancelAnimationFrame(frame);
          frame = 0;
        }
      };
    },
  };
})();

export function scrollToTarget(target: string | HTMLElement): void {
  if (typeof window === "undefined") return;
  const targetId = typeof target === "string" ? target : `#${target.id}`;

  if (targetId === "#home" || targetId === "#" || targetId === "") {
    scrollToY(0);
    return;
  }

  if (targetId === "#skills") {
    const stack = document.querySelector("[data-stack]");
    const layer0 = stack?.querySelector("[data-stack-layer]");
    if (stack && layer0) {
      const top = stack.getBoundingClientRect().top + window.scrollY + (layer0 as HTMLElement).offsetHeight;
      scrollToY(top);
      return;
    }
  }

  const el = typeof target === "string" ? document.querySelector(target) : target;
  if (!el) return;

  const layer = el.closest("[data-stack-layer]");
  let top = 0;
  if (layer && layer.parentElement) {
    top = layer.parentElement.getBoundingClientRect().top + window.scrollY;
    for (let sibling = layer.previousElementSibling; sibling; sibling = sibling.previousElementSibling) {
      top += (sibling as HTMLElement).offsetHeight;
    }
    for (let node = el as HTMLElement | null; node && node !== layer && layer.contains(node); node = node.offsetParent as HTMLElement | null) {
      top += node.offsetTop;
    }
  } else {
    const navOffset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    top = el.getBoundingClientRect().top + window.scrollY - navOffset;
  }

  scrollToY(top);
}

export function readToken(name: string): string {
  if (typeof document === "undefined") return "";
  const probe = document.createElement("span");
  probe.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;color:var(${name})`;
  document.body.appendChild(probe);
  const colour = getComputedStyle(probe).color;
  probe.remove();
  return colour;
}

export function px1440(v: number): string {
  return `${((v / 1440) * 100).toFixed(4)}cqw`;
}

export interface SpringConfig {
  tension?: number;
  friction?: number;
  duration?: number;
  easing?: (t: number) => number;
}

export class Spring {
  value: number;
  velocity = 0;
  atRest = true;
  config: SpringConfig;
  target: number;
  from: number;
  elapsed = 0;
  precision = 0.01;
  pending: { target: number; config?: SpringConfig; at: number } | null = null;
  listeners = new Set<(val: number) => void>();
  unsubscribe: (() => void) | null = null;

  constructor(value = 0, config: SpringConfig = { tension: 170, friction: 26 }) {
    this.value = value;
    this.config = config;
    this.target = value;
    this.from = value;
  }

  set(target: number, { delay = 0, config }: { delay?: number; config?: SpringConfig } = {}) {
    const update = { target, config };
    if (delay > 0) {
      this.pending = { ...update, at: performance.now() + delay };
      this.wake();
    } else {
      this.pending = null;
      this.retarget(update);
    }
  }

  onChange(cb: (val: number) => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  retarget({ target, config }: { target: number; config?: SpringConfig }) {
    if (config) this.config = config;
    this.target = target;
    this.from = this.value;
    this.elapsed = 0;
    this.precision = Math.abs(target - this.value) <= 1 ? 0.001 : 0.01;
    if (target === this.value && this.velocity === 0) {
      this.atRest = true;
      return;
    }
    this.atRest = false;
    this.wake();
  }

  wake() {
    if (this.unsubscribe) return;
    let last = performance.now();
    this.unsubscribe = ticker.subscribe((time) => {
      const dt = Math.max(0, time - last);
      last = time;
      if (this.pending && time >= this.pending.at) {
        this.retarget(this.pending);
        this.pending = null;
      }
      if (!this.atRest) this.advance(dt);
      if (this.atRest && !this.pending) {
        if (this.unsubscribe) {
          this.unsubscribe();
          this.unsubscribe = null;
        }
      }
    });
  }

  advance(dt: number): boolean {
    if (this.atRest) return true;
    dt = Math.min(dt, 64);
    const { tension = 170, friction = 26, duration, easing = (t) => t } = this.config;
    if (duration !== undefined) {
      this.elapsed += dt;
      const k = duration > 0 ? Math.min(1, this.elapsed / duration) : 1;
      const next = this.from + (this.target - this.from) * easing(k);
      this.velocity = dt > 0 ? (next - this.value) / dt : 0;
      this.value = next;
      if (k >= 1) this.settle();
    } else {
      const restVelocity = this.precision / 10;
      let { value, velocity } = this;
      let finished = false;
      for (let n = 0; n < Math.ceil(dt); n += 1) {
        if (Math.abs(velocity) <= restVelocity && Math.abs(this.target - value) <= this.precision) {
          finished = true;
          break;
        }
        const springForce = -tension * 0.000001 * (value - this.target);
        const dampingForce = -friction * 0.001 * velocity;
        velocity += springForce + dampingForce;
        value += velocity;
      }
      this.value = value;
      this.velocity = velocity;
      if (finished || (Math.abs(velocity) <= restVelocity && Math.abs(this.target - value) <= this.precision)) {
        this.settle();
      }
    }
    for (const cb of [...this.listeners]) cb(this.value);
    return this.atRest;
  }

  settle() {
    this.value = this.target;
    this.velocity = 0;
    this.atRest = true;
  }
}

export interface MotionTrackState {
  opacity?: number;
  x?: number | string;
  y?: number | string;
  scale?: number;
  scaleX?: number;
  scaleY?: number;
  rotate?: number | string;
}

export interface MotionOptions {
  from?: MotionTrackState;
  to?: MotionTrackState;
  config?: SpringConfig;
  delayIn?: number;
  mode?: "forward" | "once" | "always";
  anchor?: HTMLElement;
}

export interface MotionHandle {
  setEnabled: (on: boolean) => void;
  enable: () => void;
  disable: () => void;
}

export function motion(
  el: HTMLElement | null,
  {
    from = {},
    to = {},
    config = SPRINGS.REVEAL,
    delayIn = 0,
    mode = "forward",
    anchor = el ?? undefined,
  }: MotionOptions = {}
): MotionHandle {
  if (!el) {
    return { setEnabled: () => {}, enable: () => {}, disable: () => {} };
  }

  const IDENTITY: Record<string, number> = {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    scaleX: 1,
    scaleY: 1,
    rotate: 0,
  };

  const parse = (value: number | string | undefined, unit: string) => {
    if (typeof value === "number") return { n: value, unit };
    const match = /^(-?[\d.]+)([a-z%]*)$/i.exec(String(value ?? "").trim());
    return { n: match ? parseFloat(match[1]) : 0, unit: match && match[2] ? match[2] : unit };
  };

  const tracks = Object.keys(IDENTITY)
    .filter((key) => key in from || key in to)
    .map((key) => {
      const fallback = key === "x" || key === "y" ? "px" : key === "rotate" ? "deg" : "";
      const fromVal = (from as Record<string, number | string | undefined>)[key];
      const toVal = (to as Record<string, number | string | undefined>)[key];
      const a = parse(key in from ? fromVal : IDENTITY[key], fallback);
      const b = parse(key in to ? toVal : IDENTITY[key], fallback);
      const unit = a.n === 0 && typeof fromVal !== "string" ? b.unit : a.unit;
      return { key, a: a.n, b: b.n, unit };
    });

  const moves = tracks.some((track) => track.key !== "opacity");
  const apply = (p: number) => {
    const v: Record<string, { n: number; unit: string }> = {};
    for (const { key, a, b, unit } of tracks) v[key] = { n: a + (b - a) * p, unit };
    if (v.opacity) el.style.opacity = `${v.opacity.n}`;
    if (!moves) return;
    const parts: string[] = [];
    if ((v.x && v.x.n !== 0) || (v.y && v.y.n !== 0)) {
      parts.push(`translate(${v.x ? v.x.n + v.x.unit : "0px"}, ${v.y ? v.y.n + v.y.unit : "0px"})`);
    }
    if (v.rotate && v.rotate.n !== 0) parts.push(`rotate(${v.rotate.n}${v.rotate.unit})`);
    for (const key of ["scale", "scaleX", "scaleY"]) {
      if (v[key] && v[key].n !== 1) parts.push(`${key}(${v[key].n})`);
    }
    el.style.transform = parts.join(" ");
  };

  const spring = new Spring(0, config);
  spring.onChange(apply);
  apply(0);

  let enabled = false;
  let played = false;
  let goal = 0;

  const update = () => {
    let active = enabled || (mode === "once" && played);
    if (!active && mode === "forward" && goal === 1 && anchor && anchor.getBoundingClientRect().top <= 0) {
      active = true;
    }
    const next = active ? 1 : 0;
    if (next === goal) return;
    goal = next;
    spring.set(goal, { delay: goal === 1 ? delayIn : 0, config });
  };

  const setEnabled = (on: boolean) => {
    on = Boolean(on);
    if (on === enabled) return;
    enabled = on;
    if (on) played = true;
    update();
  };

  return { setEnabled, enable: () => setEnabled(true), disable: () => setEnabled(false) };
}

export interface RevealOptions {
  by?: "words" | "letters";
  stagger?: number;
  config?: SpringConfig;
  delayIn?: number;
  mode?: "forward" | "once" | "always";
  columnGap?: string;
  text?: string;
}

export function reveal(
  el: HTMLElement | null,
  {
    by = "words",
    stagger = 110,
    config = SPRINGS.REVEAL,
    delayIn = 0,
    mode = "forward",
    columnGap = "0.3em",
    text = el?.textContent || "",
  }: RevealOptions = {}
): MotionHandle {
  if (!el) {
    return { setEnabled: () => {}, enable: () => {}, disable: () => {} };
  }

  const states =
    by === "letters"
      ? { from: { opacity: 0, y: "0.3em" }, to: { opacity: 1, y: "0em" } }
      : { from: { opacity: 0, y: "0.35em" }, to: { opacity: 1, y: "0em" } };
  const plain = text.trim().replace(/\s+/g, " ");
  el.textContent = "";
  el.style.display = "flex";
  el.style.flexWrap = "wrap";
  el.style.columnGap = columnGap;

  const copy = document.createElement("span");
  copy.className = "vh";
  copy.textContent = plain;
  el.appendChild(copy);

  const span = (parent: HTMLElement, content: string) => {
    const node = document.createElement("span");
    node.style.display = "inline-block";
    node.textContent = content;
    parent.appendChild(node);
    return node;
  };

  const units: HTMLElement[] = [];
  for (const word of plain ? plain.split(" ") : []) {
    if (by === "letters") {
      const holder = span(el, "");
      holder.setAttribute("aria-hidden", "true");
      holder.style.whiteSpace = "nowrap";
      for (const letter of word) units.push(span(holder, letter));
    } else {
      const unit = span(el, word);
      unit.setAttribute("aria-hidden", "true");
      units.push(unit);
    }
  }

  const motions = units.map((unit, i) =>
    motion(unit, { ...states, config, delayIn: delayIn + i * stagger, mode, anchor: el })
  );

  const setEnabled = (on: boolean) => {
    for (const m of motions) m.setEnabled(on);
  };
  return { setEnabled, enable: () => setEnabled(true), disable: () => setEnabled(false) };
}

export function gate(
  el: HTMLElement | null,
  motions: MotionHandle | MotionHandle[],
  { rootMargin = "0px", once = false } = {}
): () => void {
  if (!el || typeof IntersectionObserver === "undefined") return () => {};
  const list = Array.isArray(motions) ? motions : [motions];
  const observer = new IntersectionObserver(
    (entries) => {
      const inView = entries[entries.length - 1].isIntersecting;
      if (inView) {
        for (const m of list) m.enable();
        if (once) observer.disconnect();
      } else if (!once) {
        for (const m of list) m.disable();
      }
    },
    { rootMargin }
  );
  observer.observe(el);
  return () => observer.disconnect();
}

export function onHandover(cb: () => void): void {
  if (typeof document === "undefined") return;
  if (document.documentElement.hasAttribute("data-handed-over")) cb();
  else document.addEventListener("handover", () => cb(), { once: true });
}

export function fireHandover(): void {
  if (typeof document === "undefined") return;
  if (document.documentElement.hasAttribute("data-handed-over")) return;
  document.documentElement.setAttribute("data-handed-over", "");
  document.dispatchEvent(new Event("handover"));
}

export interface ScrollTriggerOptions {
  start?: string;
  end?: string;
  onUpdate?: (progress: number, smoothed: number) => void;
  config?: SpringConfig;
}

export function scrollTrigger(
  el: HTMLElement,
  {
    start = "top bottom",
    end = "bottom top",
    onUpdate = () => {},
    config = SPRINGS.TRIGGER,
  }: ScrollTriggerOptions = {}
): () => void {
  if (typeof window === "undefined") return () => {};
  const startKey = start.trim().replace(/\s+/, "_");
  const endKey = end.trim().replace(/\s+/, "_");
  const measure = () => {
    const bb = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const poses: Record<string, number> = {
      top_top: bb.top,
      center_top: bb.top + bb.height / 2,
      bottom_top: bb.bottom,
      top_bottom: bb.top - vh,
      center_bottom: bb.top + bb.height / 2 - vh,
      bottom_bottom: bb.bottom - vh,
      top_center: bb.top - vh / 2,
      center_center: bb.top + bb.height / 2 - vh / 2,
      bottom_center: bb.bottom - vh / 2,
    };
    const scrollStart = poses[startKey];
    const scrollEnd = poses[endKey];
    if (scrollStart === undefined || scrollEnd === undefined) return 0;
    const length = Math.abs(scrollStart - scrollEnd);
    if (length === 0) return scrollStart <= 0 ? 1 : 0;
    return Math.min(Math.max(0, 1 - (scrollStart + length) / length), 1);
  };

  let progress = measure();
  const smoothed = new Spring(progress, config);
  const offChange = smoothed.onChange((value) => onUpdate(progress, value));
  onUpdate(progress, progress);

  const stopLoop = loopInView(
    el,
    () => {
      const next = measure();
      if (next === progress) return;
      progress = next;
      smoothed.set(progress, { config });
      onUpdate(progress, smoothed.value);
    },
    () => 10
  );

  return () => {
    stopLoop();
    offChange();
  };
}

export function loopInView(
  el: HTMLElement,
  cb: (time: number) => void,
  getFramerate: () => number = () => 0
): () => void {
  if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") {
    return () => {};
  }
  const FRAMES_AFTER = 10;
  let inView = false;
  let framesLeft = 0;
  let unsubscribe: (() => void) | null = null;

  const tick = (time: number) => {
    if (!inView && framesLeft-- <= 0) {
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
      return;
    }
    cb(time);
  };

  const observer = new IntersectionObserver((entries) => {
    inView = entries[entries.length - 1].isIntersecting;
    if (inView && !unsubscribe) unsubscribe = ticker.subscribe(tick, getFramerate);
    if (!inView) framesLeft = FRAMES_AFTER;
  });
  observer.observe(el);

  return () => {
    observer.disconnect();
    if (unsubscribe) unsubscribe();
    unsubscribe = null;
  };
}

export function showAssetError(urlOrMessage: unknown): void {
  if (typeof document === "undefined") return;
  const message = urlOrMessage instanceof Error ? urlOrMessage.message : String(urlOrMessage);
  console.error("Asset error:", urlOrMessage);
  const banner = document.querySelector("[data-asset-errors]") as HTMLElement | null;
  if (!banner) return;
  const line = document.createElement("div");
  line.textContent = /^(https?:|\/|\.\/|data:)/.test(message) ? `Failed to load ${message}` : message;
  banner.appendChild(line);
  banner.hidden = false;
}
