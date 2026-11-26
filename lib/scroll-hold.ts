// Holds the page where it is against scrolling down, while still letting the visitor scroll up.
// Used while the intro's fallen words lie on the floor (Intro.tsx): the scene waits there on a
// timer, and scrolling down meanwhile would fly through the expertise tunnel before it is shown.
//
// Downward wheel, touch and keyboard input is swallowed in the capture phase on window, before
// Lenis (components/shared/SmoothScroll.tsx), which listens on window, or the browser sees it.
// Lenis's leftover momentum is stopped when the hold starts. Upward input passes untouched.

import { getLenis } from "@/lib/smooth-scroll";

const DOWN_KEYS = new Set(["ArrowDown", "PageDown", "End", " ", "Spacebar"]);

export interface ScrollHold {
  hold(): void;
  release(): void;
}

export function createScrollHold(): ScrollHold {
  let held = false;
  let touchY = 0;

  const swallow = (event: Event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
  };
  const onWheel = (event: WheelEvent) => {
    if (event.deltaY > 0) swallow(event);
  };
  const onTouchStart = (event: TouchEvent) => {
    touchY = event.touches[0]?.clientY ?? 0;
  };
  const onTouchMove = (event: TouchEvent) => {
    const y = event.touches[0]?.clientY ?? touchY;
    // Finger moving up = page scrolling down.
    if (y < touchY) swallow(event);
    touchY = y;
  };
  const onKey = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
    if (DOWN_KEYS.has(event.key) && !(event.key === " " && event.shiftKey)) swallow(event);
  };

  const opts: AddEventListenerOptions = { capture: true, passive: false };

  return {
    hold() {
      if (held) return;
      held = true;
      // Stop any momentum still carrying the page down.
      getLenis()?.scrollTo(window.scrollY, { immediate: true, force: true });
      window.addEventListener("wheel", onWheel, opts);
      window.addEventListener("touchstart", onTouchStart, opts);
      window.addEventListener("touchmove", onTouchMove, opts);
      window.addEventListener("keydown", onKey, opts);
    },
    release() {
      if (!held) return;
      held = false;
      window.removeEventListener("wheel", onWheel, opts);
      window.removeEventListener("touchstart", onTouchStart, opts);
      window.removeEventListener("touchmove", onTouchMove, opts);
      window.removeEventListener("keydown", onKey, opts);
    },
  };
}
