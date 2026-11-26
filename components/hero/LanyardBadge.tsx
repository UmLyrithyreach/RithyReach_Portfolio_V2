/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef } from "react";
import { Inter_Tight } from "next/font/google";

const interTight = Inter_Tight({ subsets: ["latin"], weight: ["600", "700", "800"], display: "swap" });

/** Transparent PNG: white strap, silver swivel clip and a clear sleeve around a blank card (582×1030 units). */
const BADGE_SRC =
  "https://images.higgs.ai/?default=1&output=webp&url=" +
  encodeURIComponent(
    "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20261111_001143_65c037e6-0768-4b12-9f17-17be132ce16b.png"
  ) +
  "&w=1200&q=85";

const CARD = {
  title: ["SOFTWARE", "ENGINEER"],
  year: "2026",
  role: "FULL STACK // WEB & MOBILE",
  rows: [
    ["NAME", "um lyrithyreach"],
    ["FOCUS", "WEB & MOBILE"],
    ["TG", "@r1thyr34ch"],
    ["EMAIL", "umlyrithyreach@gmail.com"],
  ],
};

/** Measured in the badge PNG, in badge units (the pivot is the top of the strap, at x 288). */
const SLEEVE_TOP = 475;
const SLEEVE_BOTTOM = 945;
const SLEEVE_HALF = 125;
const EASE = "cubic-bezier(.2,.8,.2,1)";

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * A lanyard ID badge hanging from the top of the hero. It drops in on its strap, settles, then sways;
 * hovering the card swings it. Dragging pulls it on an elastic; let go and it flings back to where
 * it hangs, swinging like a pendulum until it settles. Styles live in app/hero.css (.hero-badge).
 */
export function LanyardBadge() {
  const wrapRef = useRef<HTMLElement>(null);
  const scRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const hitRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const hero = wrap?.parentElement;
    const sc = scRef.current;
    const badge = badgeRef.current;
    const img = imgRef.current;
    const hit = hitRef.current;
    if (!wrap || !hero || !sc || !badge || !img || !hit) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // --- Layout: size and place the badge in the space the hero copy leaves free. -------------
    let s = 0.8; // badge scale
    let pivotX = 0; // where the top of the strap hangs, in the hero's px
    let pivotY = 0;
    let dx = 0; // how far the badge is pulled from its resting place (always springs back to 0)
    let dy = 0;

    const applyOffset = () => {
      sc.style.translate = dx || dy ? `${dx.toFixed(2)}px ${dy.toFixed(2)}px` : "";
    };

    const layout = () => {
      const hr = hero.getBoundingClientRect();
      if (!hr.width) return;
      const k = hero.offsetWidth / hr.width; // undo the hero's zoom-out scale
      const box = (sel: string) => {
        const el = hero.querySelector<HTMLElement>(sel);
        const r = el?.getBoundingClientRect();
        if (!r || !r.width) return null;
        return {
          left: (r.left - hr.left) * k,
          right: (r.right - hr.left) * k,
          top: (r.top - hr.top) * k,
          bottom: (r.bottom - hr.top) * k,
        };
      };
      const W = hero.offsetWidth;
      const H = hero.offsetHeight;
      const italic = box(".hero-headline-italic");
      const sub = box(".hero-subtitle");
      const stamp = box(".hero-stamp");
      const corner = box(".hero-corner-col");

      if (stamp && italic) {
        // Wide screens: the copy and portrait hold the left, so the badge gets the right-hand column,
        // between the headline and the stamp, from just under the top down to the corner note.
        pivotX = (italic.right + stamp.left) / 2;
        const sleeveTop = Math.max(H * 0.14, 96);
        const bottom = corner ? corner.top - 24 : H * 0.85;
        s = clamp((bottom - sleeveTop) / (SLEEVE_BOTTOM - SLEEVE_TOP), 0.5, 1.45);
        s = Math.min(s, (stamp.left - italic.right) / (SLEEVE_HALF * 2) - 0.02);
        s = Math.min(s, (W - pivotX - 12) / SLEEVE_HALF);
        pivotY = sleeveTop - SLEEVE_TOP * s;
      } else {
        // Narrow screens: the portrait sits left of centre, the badge hangs at the right below the copy.
        // Sleeve about a third of the width, so the card stays readable: ~130px on a phone, 240px on a tablet.
        s = clamp(W * 0.34, 124, 240) / (SLEEVE_HALF * 2);
        pivotX = W - 12 - SLEEVE_HALF * s;
        const sleeveTop = (sub?.bottom ?? italic?.bottom ?? H * 0.3) + 16;
        pivotY = sleeveTop - SLEEVE_TOP * s;
      }
      wrap.style.setProperty("--badge-s", s.toFixed(4));
      wrap.style.left = `${pivotX.toFixed(1)}px`;
      wrap.style.top = `${pivotY.toFixed(1)}px`;
      applyOffset();
    };
    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(hero);
    document.fonts?.ready.then(layout).catch(() => {});

    // --- Motion: drop-in, idle sway, hover swing (Web Animations API). -------------------------
    const anims: Record<string, Animation | undefined> = {};
    const play = (key: string, keyframes: Keyframe[], options: KeyframeAnimationOptions) => {
      anims[key]?.cancel();
      const a = badge.animate(keyframes, { fill: "both", easing: EASE, ...options });
      anims[key] = a;
      return a;
    };
    const sway = () => {
      if (reduce) return;
      // A sine of ±1.1deg starting from upright, so it picks up seamlessly after a drop or a fling.
      const frames = Array.from({ length: 17 }, (_, i) => ({
        transform: `rotate(${(1.1 * Math.sin((i / 16) * Math.PI * 2)).toFixed(3)}deg)`,
      }));
      play("sway", frames, { duration: 6400, iterations: Infinity, easing: "linear" });
    };

    let started = false;
    let dropping = false;
    let raf = 0;
    const reveal = () => {
      badge.classList.remove("pre");
      wrap.classList.remove("is-pre");
    };
    const start = () => {
      if (started) return;
      started = true;
      raf = requestAnimationFrame(() => {
        if (reduce) {
          reveal();
          return;
        }
        dropping = true;
        const drop = play(
          "m",
          [
            { opacity: 0, transform: "translateY(-120%) rotate(8deg)", offset: 0 },
            { opacity: 1, transform: "translateY(0) rotate(-3deg)", offset: 0.6 },
            { transform: "rotate(1.6deg)", offset: 0.8 },
            { transform: "rotate(0)", offset: 1 },
          ],
          { duration: 1500, delay: 700 }
        );
        reveal();
        drop.finished
          .then(() => {
            dropping = false;
            drop.cancel();
            if (!physicsRaf) sway();
          })
          .catch(() => {});
      });
    };

    const imgReady = img.complete
      ? Promise.resolve()
      : new Promise<void>((r) => {
          img.addEventListener("load", () => r(), { once: true });
          img.addEventListener("error", () => r(), { once: true });
        });
    Promise.race([
      Promise.all([document.fonts?.ready, imgReady]),
      new Promise((r) => setTimeout(r, 2500)),
    ]).then(start, start);
    const failsafe = setTimeout(start, 4000);

    // --- Drag and fling: the badge is pulled on an elastic, then springs home with real physics. ---
    // The pull is a damped spring (it overshoots and rings before settling). The badge itself is a
    // pendulum hanging from the moving pivot: the pivot's acceleration drives its swing, gravity and
    // a little air drag bring it back to vertical.
    const SPRING = 170; // 1/s², pull towards the resting place
    const DAMPING = 8; // 1/s, ζ ≈ 0.3: a lively overshoot
    const GRAVITY = 5200; // px/s², tuned for the on-screen size
    const AIR = 2.2; // 1/s, damping of the swing
    const SUBSTEP = 1 / 240; // fixed physics step, s, so the motion runs in real time at any frame rate
    let dragging = false;
    let grab = { x: 0, y: 0, k: 1 };
    let vx = 0; // badge velocity, px/s
    let vy = 0;
    let swing = 0; // pendulum angle, radians (positive = card swung to the right)
    let swingV = 0;
    let prevX = 0;
    let prevY = 0;
    let physicsRaf = 0;
    let lastFrame = 0;

    /** Elastic pull: follows the pointer 1:1 at first, stiffening the further it goes. */
    const rubber = (d: number, limit: number) => Math.sign(d) * limit * (1 - 1 / ((Math.abs(d) * 0.9) / limit + 1));

    /** Advance the pendulum by h seconds, given the pivot's acceleration. */
    const swingStep = (h: number, ax: number, ay: number) => {
      const L = Math.max(1, ((SLEEVE_TOP + SLEEVE_BOTTOM) / 2) * s); // pivot to the middle of the card
      const swingA = -((GRAVITY - ay) * Math.sin(swing) + ax * Math.cos(swing)) / L - AIR * swingV;
      swingV += swingA * h;
      swing = clamp(swing + swingV * h, -1.1, 1.1);
    };

    const step = (now: number) => {
      const elapsed = clamp((now - lastFrame) / 1000, 0.001, 0.1);
      lastFrame = now;
      const n = Math.ceil(elapsed / SUBSTEP);
      const h = elapsed / n;
      if (dragging) {
        // The pointer moves the badge; read its velocity and acceleration off the motion (smoothed).
        const nvx = (dx - prevX) / elapsed;
        const nvy = (dy - prevY) / elapsed;
        const ax = clamp((nvx - vx) / elapsed, -30000, 30000) * 0.5;
        const ay = clamp((nvy - vy) / elapsed, -30000, 30000) * 0.5;
        vx += (nvx - vx) * 0.5;
        vy += (nvy - vy) * 0.5;
        for (let i = 0; i < n; i++) swingStep(h, ax, ay);
      } else {
        // Released: a damped spring flings it back home (semi-implicit Euler, fixed substeps).
        for (let i = 0; i < n; i++) {
          const ax = -SPRING * dx - DAMPING * vx;
          const ay = -SPRING * dy - DAMPING * vy;
          vx += ax * h;
          vy += ay * h;
          dx += vx * h;
          dy += vy * h;
          swingStep(h, ax, ay);
        }
      }
      prevX = dx;
      prevY = dy;

      applyOffset();
      // CSS rotate is clockwise, which swings the card to the left.
      badge.style.rotate = `${((-swing * 180) / Math.PI).toFixed(3)}deg`;

      const settled =
        !dragging &&
        Math.abs(dx) < 0.3 &&
        Math.abs(dy) < 0.3 &&
        Math.hypot(vx, vy) < 4 &&
        Math.abs(swing) < 0.003 &&
        Math.abs(swingV) < 0.02;
      if (settled) {
        dx = dy = vx = vy = swing = swingV = 0;
        applyOffset();
        badge.style.rotate = "";
        physicsRaf = 0;
        if (!dropping) sway();
        return;
      }
      physicsRaf = requestAnimationFrame(step);
    };

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      hit.setPointerCapture(e.pointerId);
      const hr = hero.getBoundingClientRect();
      // Grab it mid-fling: the pull starts from wherever it is now.
      const k = hr.width ? hero.offsetWidth / hr.width : 1;
      grab = { x: e.clientX, y: e.clientY, k };
      grabOffset = { x: dx, y: dy };
      dragging = true;
      wrap.classList.add("is-dragging");
      anims.sway?.cancel();
      anims.swing?.cancel();
      if (!physicsRaf && !reduce) {
        prevX = dx;
        prevY = dy;
        vx = vy = 0;
        lastFrame = performance.now();
        physicsRaf = requestAnimationFrame(step);
      }
    };
    let grabOffset = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const rawX = grabOffset.x + (e.clientX - grab.x) * grab.k;
      const rawY = grabOffset.y + (e.clientY - grab.y) * grab.k;
      dx = rubber(rawX, hero.offsetWidth * 0.45);
      dy = rubber(rawY, hero.offsetHeight * 0.45);
      if (reduce) applyOffset();
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      wrap.classList.remove("is-dragging");
      if (reduce) {
        // No fling under reduced motion: it simply goes back.
        dx = dy = 0;
        applyOffset();
      }
    };
    const onEnter = () => {
      if (reduce || dragging || physicsRaf) return;
      play(
        "swing",
        [
          { transform: "rotate(0deg)" },
          { transform: "rotate(-6deg)" },
          { transform: "rotate(4deg)" },
          { transform: "rotate(-2deg)" },
          { transform: "rotate(0deg)" },
        ],
        { duration: 1400, easing: "ease-out", composite: "add", fill: "none" }
      );
    };
    hit.addEventListener("pointerdown", onDown);
    hit.addEventListener("pointermove", onMove);
    hit.addEventListener("pointerup", onUp);
    hit.addEventListener("pointercancel", onUp);
    hit.addEventListener("lostpointercapture", onUp);
    hit.addEventListener("pointerenter", onEnter);

    return () => {
      started = true;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(physicsRaf);
      clearTimeout(failsafe);
      ro.disconnect();
      hit.removeEventListener("pointerdown", onDown);
      hit.removeEventListener("pointermove", onMove);
      hit.removeEventListener("pointerup", onUp);
      hit.removeEventListener("pointercancel", onUp);
      hit.removeEventListener("lostpointercapture", onUp);
      hit.removeEventListener("pointerenter", onEnter);
      Object.values(anims).forEach((a) => a?.cancel());
    };
  }, []);

  return (
    <aside
      className="hero-badge is-pre"
      aria-label="ID badge"
      ref={wrapRef}
      style={{ "--badge-src": `url("${BADGE_SRC}")` } as React.CSSProperties}
    >
      <div className="hero-badge-sc" ref={scRef}>
        {/* The strap's plain top slice, stretched upwards so the strap never ends on screen when dragged down. */}
        <div className="hero-badge-strap" aria-hidden="true" />
        <div className="hero-badge-swing pre" ref={badgeRef}>
          <img ref={imgRef} src={BADGE_SRC} alt="" width={582} height={1030} decoding="async" draggable={false} />
          <div className={`hero-badge-card ${interTight.className}`}>
            <h4>
              {CARD.title[0]}
              <br />
              {CARD.title[1]}
            </h4>
            <div className="yr">{CARD.year}</div>
            <div className="role">{CARD.role}</div>
            <div className="ph" role="img" aria-label="Photo of Um Lyrithyreach" />
            {CARD.rows.map(([k, v]) => (
              <div className="row" key={k}>
                <span>{k}</span>
                <b>{v}</b>
              </div>
            ))}
          </div>
          <div className="hit" ref={hitRef} aria-hidden="true" />
        </div>
      </div>
    </aside>
  );
}
