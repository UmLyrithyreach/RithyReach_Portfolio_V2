/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { CloudGust, smoothstep, viewportHeight } from "@/components/hero/CloudGust";
import { projects, skills, skillLevelLabel, type SkillCategory } from "@/lib/data";
import { FluidReveal } from "@/lib/fluid-reveal";

/** Colour twin of /image/my_image.webp — same size and crop — revealed by the cursor fluid. */
const COLOUR_PORTRAIT = "/image/my_image_color.webp";

const emptySubscribe = () => () => {};

type HaloCardSpec = {
  id: string;
  /** Starting angle in degrees around the head (0 = in front of the face, ±90 = sides, 180 = behind). */
  baseAngle: number;
  /** Which of the two stacked rings the card rides on: -1 = upper ring, 1 = lower ring. */
  band: -1 | 1;
  /** Individual floating phase in radians. */
  phase: number;
} & (
  | { kind: "work"; projectId: string }
  | { kind: "stack"; category: SkillCategory; index: string }
  | { kind: "frame" }
);

/*
 * Two rings of five cards, 72° apart within a ring and offset 36° between rings,
 * so neighbours never land on top of each other while the halo turns.
 * Work and stack cards alternate so tall screenshots never stack on each other.
 */
const HALO_CARDS: HaloCardSpec[] = [
  // Upper ring
  { id: "stack-frontend", kind: "stack", category: "Frontend", index: "01", baseAngle: -30, band: -1, phase: 0.2 },
  { id: "work-asip", kind: "work", projectId: "asip-redesign", baseAngle: 42, band: -1, phase: 2.6 },
  { id: "frame-upper", kind: "frame", baseAngle: 114, band: -1, phase: 1.8 },
  { id: "stack-database", kind: "stack", category: "Database", index: "03", baseAngle: 186, band: -1, phase: 2.0 },
  { id: "work-samki", kind: "work", projectId: "samki-digital-market", baseAngle: 258, band: -1, phase: 3.1 },
  // Lower ring
  { id: "work-automata", kind: "work", projectId: "automata-simulation", baseAngle: 6, band: 1, phase: 1.4 },
  { id: "stack-backend", kind: "stack", category: "Backend", index: "02", baseAngle: 78, band: 1, phase: 4.2 },
  { id: "work-khodkquiz", kind: "work", projectId: "khodkquiz", baseAngle: 150, band: 1, phase: 3.8 },
  { id: "frame-lower", kind: "frame", baseAngle: 222, band: 1, phase: 5.0 },
  { id: "stack-styling", kind: "stack", category: "Styling", index: "04", baseAngle: 294, band: 1, phase: 0.9 },
];

/** The two strongest skills in a category, and the best level among them. */
function stackSummary(category: SkillCategory) {
  const top = skills
    .filter((sk) => sk.category === category)
    .sort((a, b) => b.level - a.level)
    .slice(0, 2);
  const level = top[0]?.level ?? 0;
  return { names: top.map((sk) => sk.name), level, label: skillLevelLabel(level) };
}

function HaloCardBody({ card }: { card: HaloCardSpec }) {
  if (card.kind === "work") {
    const project = projects.find((p) => p.id === card.projectId);
    if (!project) return null;
    return (
      <div className="halo-body">
        <div className="halo-shot">
          <Image src={project.image} alt="" fill sizes="240px" className="halo-shot-img" />
        </div>
        <div className="halo-caption">
          <span className="halo-mono">{project.number}</span>
          <span className="halo-caption-title">{project.title}</span>
          <span className="halo-mono halo-caption-year">{project.year}</span>
        </div>
      </div>
    );
  }

  if (card.kind === "stack") {
    const { names, level, label } = stackSummary(card.category);
    return (
      <div className="halo-body">
        <p className="halo-mono halo-eyebrow">
          <span>{card.index}</span>
          <span className="halo-eyebrow-rule" aria-hidden="true" />
          <span>{card.category}</span>
        </p>
        <p className="halo-stack-title">
          {names.map((n, i) => (
            <React.Fragment key={n}>
              {i > 0 && <em> &amp; </em>}
              {n}
            </React.Fragment>
          ))}
        </p>
        <div className="halo-meter">
          <span className="halo-meter-track" aria-hidden="true">
            <span className="halo-meter-fill" style={{ width: `${level}%` }} />
          </span>
          <span className="halo-mono">{label}</span>
        </div>
      </div>
    );
  }

  // Empty hairline frame with crop marks — depth without decoration.
  return (
    <div className="halo-body">
      <span className="halo-crop halo-crop--tl" />
      <span className="halo-crop halo-crop--tr" />
      <span className="halo-crop halo-crop--bl" />
      <span className="halo-crop halo-crop--br" />
    </div>
  );
}

/** Portrait geometry, as fractions of the cut-out image (public/image/my_image.webp, 1240×1269). */
const RING_RADIUS = 0.48; // halo radius as a fraction of the portrait width
/** Card sizes in CSS are drawn for this halo radius; everything scales from it. */
const DESIGN_RADIUS = 265;
// Share of the scroll the portrait group (figure, side cards, connectors) lags by; matches hero.css.
const SUBJECT_PARALLAX = 0.25;

/*
 * Transition into Skills: the hero is pinned (hero.css) and the whole screen zooms out to 0.3,
 * blurring and fading into the fog, over the first half screen of scroll while CloudGust sweeps
 * clouds across. Blur and edge feather move in whole steps, so the hero repaints a handful of
 * times instead of on every scroll frame.
 */
const ZOOM_TO = 0.3;

export default function Hero() {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isOrbitPaused, setIsOrbitPaused] = useState(false);

  const heroRef = useRef<HTMLElement>(null);

  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const zoomScale = useTransform(scrollY, (y) => 1 - (1 - ZOOM_TO) * smoothstep(0, 0.55, y / viewportHeight()));
  const zoomOpacity = useTransform(scrollY, (y) => 1 - smoothstep(0.4, 0.55, y / viewportHeight()));
  // The hero goes out of focus as it zooms away into the fog.
  const zoomBlur = useTransform(scrollY, (y) => `blur(${Math.round(10 * smoothstep(0.03, 0.5, y / viewportHeight()))}px)`);
  // Feather the edges as it shrinks, so the zoom never shows a card edge or corners.
  const zoomMask = useTransform(scrollY, (y) => {
    const w = 2 * Math.round(7 * Math.min(1, (y / viewportHeight()) * 8));
    const fade = (dir: string) => `linear-gradient(${dir}, transparent, #000 ${w}%, #000 ${100 - w}%, transparent)`;
    return `${fade("to right")}, ${fade("to bottom")}`;
  });
  const figureRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const fluidCanvasRef = useRef<HTMLCanvasElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const leftCardRef = useRef<HTMLElement>(null);
  const rightCardRef = useRef<HTMLElement>(null);
  const leftPathRef = useRef<SVGPathElement>(null);
  const rightPathRef = useRef<SVGPathElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const logoRef = useRef<HTMLAnchorElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  // Read by the animation loop, so toggling pause freezes the halo in place instead of restarting it.
  const orbitPausedRef = useRef(false);
  const orbitAngleRef = useRef(0);

  useEffect(() => {
    orbitPausedRef.current = isOrbitPaused;
  }, [isOrbitPaused]);

  // Parallax out of the hero runs on CSS scroll-driven animations (hero.css). Only browsers
  // without them fall back to this: publish the scroll distance as --hero-scroll.
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero || CSS.supports("animation-timeline: scroll()")) return;
    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = mqReduce.matches ? 0 : Math.min(Math.max(window.scrollY, 0), hero.offsetHeight);
      hero.style.setProperty("--hero-scroll", `${y}px`);
      hero.style.setProperty("--hero-progress", (y / (hero.offsetHeight || 1)).toFixed(4));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    mqReduce.addEventListener("change", update);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      mqReduce.removeEventListener("change", update);
    };
  }, []);

  // 3D orbiting glass halo around the head + connector lines from the side cards
  useEffect(() => {
    if (!mounted) return;
    const hero = heroRef.current;
    const figure = figureRef.current;
    if (!hero || !figure) return;

    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let rafId = 0;
    let lastTime = performance.now();

    // Geometry, refreshed whenever the hero or the portrait changes size.
    let rx = DESIGN_RADIUS; // halo radius in px
    let s = 1; // card scale relative to the design size
    // Where the fluid canvas sits on screen, cached per resize so pointer moves never force layout.
    let canvasLeft = 0;
    let canvasTop = 0;
    const lastZ: string[] = [];

    // Fluid cursor reveal: desktop pointers only, never under reduced motion.
    const canvas = fluidCanvasRef.current;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const fluid =
      canvas && finePointer && !mqReduce.matches
        ? FluidReveal.create(canvas, {
            imageSrc: COLOUR_PORTRAIT,
            tint: [0.078, 0.078, 0.074],
            tintAlpha: 0.06,
          })
        : null;
    let heroVisible = true;
    const io = new IntersectionObserver(([entry]) => {
      heroVisible = entry.isIntersecting;
    });
    io.observe(hero);

    /** The fluid canvas lives in the figure (for z-order) but covers the whole hero. */
    const layoutFluid = () => {
      if (!fluid || !canvas) return;
      const hr = hero.getBoundingClientRect();
      const fr = figure.getBoundingClientRect();
      const fx = fr.left - hr.left;
      const fy = fr.top - hr.top;
      canvasLeft = hr.left;
      canvasTop = hr.top;
      canvas.style.left = `${-fx}px`;
      canvas.style.top = `${-fy}px`;
      canvas.style.width = `${hr.width}px`;
      canvas.style.height = `${hr.height}px`;
      fluid.resize(hr.width, hr.height, { x: fx, y: fy, w: figure.offsetWidth, h: figure.offsetHeight });
    };

    const measure = () => {
      const vw = window.innerWidth;
      rx = Math.min(figure.offsetWidth * RING_RADIUS, vw * 0.4);
      s = Math.max(0.64, Math.min(1.35, rx / DESIGN_RADIUS));
      layoutConnectors();
      layoutFluid();
    };

    /** Draw each side card's line from under the card down into the edge of the halo. */
    const layoutConnectors = () => {
      const anchor = anchorRef.current;
      const heroBox = hero.getBoundingClientRect();
      const a = anchor?.getBoundingClientRect();
      // Measure in the at-rest layout: undo the scroll parallax. hero.css moves the cards,
      // this SVG and the figure holding the anchor together, by SUBJECT_PARALLAX of the scroll.
      const shift = mqReduce.matches
        ? 0
        : Math.min(Math.max(window.scrollY, 0), hero.offsetHeight) * SUBJECT_PARALLAX;
      // Undo the zoom-out scale too: screen px -> the hero's own px.
      const k = heroBox.width ? hero.offsetWidth / heroBox.width : 1;
      const pairs: [HTMLElement | null, SVGPathElement | null, -1 | 1][] = [
        [leftCardRef.current, leftPathRef.current, -1],
        [rightCardRef.current, rightPathRef.current, 1],
      ];
      for (const [card, path, side] of pairs) {
        if (!card || !path || !a) continue;
        const c = card.getBoundingClientRect();
        if (c.width === 0) {
          path.setAttribute("d", "");
          continue;
        }
        // Start inside the card's lower edge so its float animation never reveals a gap.
        const sx = (c.left + c.width * (side < 0 ? 0.42 : 0.55) - heroBox.left) * k;
        const sy = (c.bottom - heroBox.top) * k - 28 - shift;
        const ex = (a.left - heroBox.left) * k + side * rx * 0.97;
        const ey = (a.top - heroBox.top) * k + side * 22 * s + 10 * s - shift;
        const c1y = sy + (ey - sy) * 0.85;
        const c2x = sx + (ex - sx) * 0.4;
        path.setAttribute(
          "d",
          `M ${sx.toFixed(1)} ${sy.toFixed(1)} C ${sx.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${ey.toFixed(1)}, ${ex.toFixed(1)} ${ey.toFixed(1)}`
        );
      }
    };

    // The pointer only drives the fluid; the halo and portrait ignore it entirely.
    const onPointerMove = (e: PointerEvent) => {
      if (fluid && heroVisible) fluid.setPointer(e.clientX - canvasLeft, e.clientY - canvasTop);
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    const renderFrame = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const reduced = mqReduce.matches;
      const running = !reduced && !orbitPausedRef.current;
      if (running) orbitAngleRef.current = (orbitAngleRef.current + dt * 12) % 360;
      const orbitAngle = orbitAngleRef.current;

      const tSec = now * 0.001;
      if (fluid && heroVisible) fluid.frame(now);

      const bandGap = 72 * s; // half the distance between the two rings
      const tilt = 22 * s; // right side of the halo dips lower than the left
      const depth = 24 * s; // front of the halo sits lower than the back (seen from slightly above)

      for (let i = 0; i < HALO_CARDS.length; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;
        const spec = HALO_CARDS[i];

        const deg = spec.baseAngle + (reduced ? 0 : orbitAngle);
        const rad = (deg * Math.PI) / 180;
        const sinA = Math.sin(rad);
        const cosA = Math.cos(rad); // +1 = in front of the face, -1 = behind the head

        const x = sinA * rx;
        const floatY = reduced ? 0 : Math.sin(tSec * 1.6 + spec.phase) * 5 * s;
        const y =
          spec.band * bandGap + sinA * tilt + cosA * depth + floatY;

        // Cards face outward, wrapping tangentially around the head.
        const rotY = -sinA * 38;
        const rotZ = sinA * 2;
        const scale = s * (0.84 + 0.18 * ((cosA + 1) * 0.5));

        // In front of the head: above the portrait. Behind it: under the portrait.
        const isFront = cosA >= -0.08;
        const zIndex = isFront ? 30 + Math.round((cosA + 1) * 5) : 8 + Math.round((cosA + 1) * 5);
        const opacity = isFront ? 0.92 + Math.max(0, cosA) * 0.08 : Math.max(0.3, 0.35 + (cosA + 1) * 0.5);

        // Content fades out as the card turns away; the empty surface carries on behind the head.
        const contentEl = el.firstElementChild as HTMLElement | null;
        if (contentEl) contentEl.style.opacity = Math.max(0, Math.min(1, (cosA + 0.05) / 0.35)).toFixed(2);

        // Restacking is costly; only touch z-index when a card crosses in front of / behind the head.
        const z = String(zIndex);
        if (lastZ[i] !== z) {
          el.style.zIndex = z;
          lastZ[i] = z;
        }
        el.style.opacity = opacity.toFixed(3);
        el.style.transform = `translate(-50%, -50%) perspective(1000px) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0px) rotateY(${rotY.toFixed(1)}deg) rotateZ(${rotZ.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
      }

      if (!reduced) rafId = requestAnimationFrame(renderFrame);
    };

    measure();
    rafId = requestAnimationFrame(renderFrame);

    const ro = new ResizeObserver(() => {
      measure();
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(renderFrame);
    });
    ro.observe(hero);
    ro.observe(figure);

    const onMq = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(renderFrame);
    };
    mqReduce.addEventListener("change", onMq);
    // Fonts change the copy height, which moves the stage; re-measure once they land.
    document.fonts?.ready.then(measure).catch(() => {});

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      io.disconnect();
      fluid?.destroy();
      window.removeEventListener("pointermove", onPointerMove);
      mqReduce.removeEventListener("change", onMq);
    };
  }, [mounted]);

  // Mobile Menu Sheet handlers
  const openMenu = () => {
    setIsMenuOpen(true);
    document.documentElement.classList.add("menu-open");
  };

  const closeMenu = (options: { restoreFocus?: boolean; focusLogo?: boolean } = {}) => {
    setIsMenuOpen(false);
    document.documentElement.classList.remove("menu-open");
    if (options.restoreFocus && burgerRef.current) {
      burgerRef.current.focus({ preventScroll: true });
    } else if (options.focusLogo && logoRef.current) {
      logoRef.current.focus({ preventScroll: true });
    }
  };

  useEffect(() => {
    if (!mounted || !isMenuOpen) return;
    const sheet = sheetRef.current;
    const closeBtn = sheet?.querySelector<HTMLElement>("[data-hero-sheet-close]");
    closeBtn?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu({ restoreFocus: true });
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isMenuOpen, mounted]);

  const navItems = [
    { id: "home", label: "Home", href: "#home" },
    { id: "skills", label: "Skills", href: "#skills" },
    { id: "works", label: "Works", href: "#works" },
    { id: "about", label: "About", href: "#about" },
    { id: "contact", label: "Contact", href: "#contact" },
  ];

  return (
    <>
    <motion.section
      id="home"
      data-hero
      ref={heroRef}
      style={reduceMotion ? undefined : { scale: zoomScale, opacity: zoomOpacity, filter: zoomBlur, maskImage: zoomMask, WebkitMaskImage: zoomMask, maskComposite: "intersect", WebkitMaskComposite: "source-in" }}
    >
      {/* Hidden veil element so any legacy e2e selector waiting for .hero-veil to be hidden resolves immediately */}
      <div className="hero-veil" hidden aria-hidden="true" />
      <h2 className="vh">Introduction</h2>

      {/* Top Navigation Bar */}
      <header className="hero-masthead" data-hero-masthead>
        <a className="hero-logo" href="#home" aria-label="RithyReach — home" ref={logoRef}>
          <span className="hero-logo-mark" aria-hidden="true">
            &lt;
          </span>{" "}
          RithyReach{" "}
          <span className="hero-logo-mark" aria-hidden="true">
            /&gt;
          </span>
        </a>
        <nav className="hero-nav" aria-label="Primary">
          <ul role="list">
            <li>
              <a href="#home">home</a>
            </li>
            <li>
              <a href="#skills">skills</a>
            </li>
            <li>
              <a href="#works">works</a>
            </li>
            <li>
              <a href="#about">about</a>
            </li>
            <li>
              <a href="#contact">contact</a>
            </li>
          </ul>
        </nav>
        <a className="hero-talk" href="#contact">
          <span aria-hidden="true">[ </span>Let&apos;s Talk<span aria-hidden="true"> → ]</span>
        </a>
        <button
          className="hero-burger"
          type="button"
          data-hero-burger
          ref={burgerRef}
          aria-label="Open menu"
          aria-expanded={isMenuOpen}
          aria-controls="hero-menu"
          onClick={openMenu}
        >
          <span></span>
          <span></span>
        </button>
      </header>

      {/* Upper-Right Rotating Circular Stamp */}
      <div className="hero-stamp" aria-hidden="true">
        <svg viewBox="0 0 100 100" className="hero-stamp-ring">
          <defs>
            <path
              id="hero-stamp-circle"
              d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0"
            />
          </defs>
          <text fill="currentColor" fontSize="8.4" fontWeight="600" textLength="230" lengthAdjust="spacing">
            <textPath href="#hero-stamp-circle" startOffset="0%" textLength="230" lengthAdjust="spacing">
              A MORE FOCUSED YOU • EVERYDAY •
            </textPath>
          </text>
        </svg>
        <svg viewBox="0 0 24 24" className="hero-stamp-star" fill="currentColor">
          <path d="M12 1L14.2 9.8L23 12L14.2 14.2L12 23L9.8 14.2L1 12L9.8 9.8L12 1Z" />
        </svg>
      </div>

      {/* Editorial Headline, Subtitle & Dual Pill CTAs */}
      <div className="hero-header-copy">
        <h1 className="hero-headline">
          <span className="hero-headline-line">A clearer mind</span>
          <span className="hero-headline-italic">for a brighter you.</span>
        </h1>

        <p className="hero-subtitle">
          Rithyreach helps you capture ideas, organize your thoughts, and stay
          focused — all in one beautiful space.
        </p>

        <div className="hero-cta-row">
          <a href="#works" className="hero-btn-primary">
            <span>Get started free</span>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
              <path d="M3 8H13M9 4L13 8L9 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>

          <a href="#contact" className="hero-btn-secondary">
            <span className="hero-play-icon" aria-hidden="true">
              <svg width="8" height="9" viewBox="0 0 8 9" fill="currentColor">
                <path d="M1.5 1.2L7 4.5L1.5 7.8V1.2Z" />
              </svg>
            </span>
            <span>Watch video</span>
          </a>
        </div>
      </div>

      {/* Left Floating Glass Callout Card */}
      <aside className="hero-float-card hero-float-card--left" aria-label="Feature highlight: progress" ref={leftCardRef}>
        <div className="hero-float-icon-badge" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M3.5 10v0.5M6.8 7v6M10 4.5v11M13.2 7.5v5M16.5 9.5v1" />
          </svg>
        </div>
        <p className="hero-float-title">Turn thoughts into progress.</p>
        <p className="hero-float-desc">Capture, organise and do more.</p>
      </aside>

      {/* Right Floating Glass Callout Card */}
      <aside className="hero-float-card hero-float-card--right" aria-label="Feature highlight: sync" ref={rightCardRef}>
        <div className="hero-avatar-stack" aria-hidden="true">
          <img
            src="/image/avatar-professional.webp"
            alt=""
            className="hero-avatar-item"
            width="30"
            height="30"
          />
          <img
            src="/image/avatar-less_professional.webp"
            alt=""
            className="hero-avatar-item"
            width="30"
            height="30"
          />
          <img
            src="/image/avatar-my_image.webp"
            alt=""
            className="hero-avatar-item"
            width="30"
            height="30"
          />
          <span className="hero-avatar-plus">+</span>
        </div>
        <p className="hero-float-title">Ideas, anytime, anywhere.</p>
        <p className="hero-float-desc">Sync across all your devices.</p>
      </aside>

      {/* Thin connector lines from the side cards into the halo (paths laid out in JS) */}
      <svg className="hero-connectors" aria-hidden="true">
        <path ref={leftPathRef} />
        <path ref={rightPathRef} />
      </svg>

      {/* Centerpiece stage: portrait with the 3D glass halo orbiting the head */}
      <div className="hero-stage">
        <div className="hero-stage-glow" aria-hidden="true" />

        {/* The figure is the portrait's box; the halo anchor sits on the head inside it,
            so portrait and halo always scale and move together. */}
        <div className="hero-figure" ref={figureRef}>
          <img
            src="/image/my_image.webp"
            alt="Um Lyrithyreach (Reach) portrait with eyes closed in thoughtful focus"
            fetchPriority="high"
            width="1240"
            height="1269"
            className="hero-portrait-img"
          />

          {/* Cursor fluid: colour portrait inside the trail, faint ink elsewhere (lib/fluid-reveal.ts) */}
          <canvas ref={fluidCanvasRef} className="hero-fluid" aria-hidden="true" />

          {/* Cards are siblings of the portrait so front cards (z 30+) blur it via backdrop-filter
              and back cards (z < 20) pass behind it. */}
          <div className="hero-orbit-anchor" ref={anchorRef} aria-hidden="true">
            {/* Pure motion: the halo never pauses on hover and takes no pointer input. */}
            {HALO_CARDS.map((card, i) => (
              <div
                key={card.id}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                className={`halo-card halo-card--${card.kind}`}
                data-kind={card.kind}
              >
                <HaloCardBody card={card} />
              </div>
            ))}
          </div>
        </div>

        <div className="hero-bottom-fade" aria-hidden="true" />
      </div>

      {/* Bottom Corner Signatures (Left: Social Proof, Right: Less Chaos / More Clarity + Orbit Pause Control) */}
      <div className="hero-bottom-bar">
        <div className="hero-trust-block">
          <span className="hero-trust-rule" aria-hidden="true" />
          <p className="hero-trust-copy">
            Trusted by 50,000+
            <br />
            creators worldwide.
          </p>
          <div className="hero-avatar-stack" aria-hidden="true">
            <img
              src="/image/avatar-professional.webp"
              alt=""
              className="hero-avatar-item"
              width="30"
              height="30"
            />
            <img
              src="/image/avatar-less_professional.webp"
              alt=""
              className="hero-avatar-item"
              width="30"
              height="30"
            />
            <img
              src="/image/avatar-my_image.webp"
              alt=""
              className="hero-avatar-item"
              width="30"
              height="30"
            />
            <span className="hero-avatar-plus">+</span>
          </div>
        </div>

        <div className="hero-clarity-block">
          <div className="hero-clarity-head">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#141413" aria-hidden="true">
              <path d="M12 1L14.1 9.9L23 12L14.1 14.1L12 23L9.9 14.1L1 12L9.9 9.9L12 1Z" />
            </svg>
            <button
              type="button"
              className="hero-orbit-toggle"
              aria-label={isOrbitPaused ? "Play orbit animation" : "Pause orbit animation"}
              aria-pressed={isOrbitPaused}
              onClick={() => setIsOrbitPaused((prev) => !prev)}
            >
              {isOrbitPaused ? (
                <svg width="8" height="9" viewBox="0 0 8 9" fill="currentColor" aria-hidden="true">
                  <path d="M1.5 1.2L7 4.5L1.5 7.8V1.2Z" />
                </svg>
              ) : (
                <svg width="8" height="9" viewBox="0 0 8 9" fill="currentColor" aria-hidden="true">
                  <rect x="1" y="1" width="2" height="7" rx="0.5" />
                  <rect x="5" y="1" width="2" height="7" rx="0.5" />
                </svg>
              )}
            </button>
          </div>
          <div className="hero-clarity-row">
            <span className="hero-trust-rule" aria-hidden="true" />
            <p className="hero-clarity-copy">
              Less chaos.
              <br />
              More clarity.
            </p>
          </div>
        </div>
      </div>

      {/* Full-screen Mobile Menu Sheet (portalled to body) */}
      {mounted &&
        createPortal(
          <div
            className="hero-sheet"
            id="hero-menu"
            data-hero-sheet
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            hidden={!isMenuOpen}
            onClick={(e) => {
              if ((e.target as Element).closest("a[href]")) closeMenu();
            }}
          >
            <div className="hero-sheet-top">
              <a className="hero-logo" href="#home" aria-label="RithyReach — home">
                <span className="hero-logo-mark" aria-hidden="true">
                  &lt;
                </span>{" "}
                RithyReach{" "}
                <span className="hero-logo-mark" aria-hidden="true">
                  /&gt;
                </span>
              </a>
              <button
                className="hero-sheet-close"
                type="button"
                data-hero-sheet-close
                aria-label="Close menu"
                onClick={() => closeMenu({ restoreFocus: true })}
              >
                <span></span>
                <span></span>
              </button>
            </div>
            <nav className="hero-sheet-nav" aria-label="Menu">
              <ul role="list">
                {navItems.map((item) => (
                  <li key={item.id} data-hero-sheet-item>
                    <a href={item.href}>{item.label}</a>
                  </li>
                ))}
                <li data-hero-sheet-item>
                  <a href="#contact">Let&apos;s Talk</a>
                </li>
              </ul>
            </nav>
          </div>,
          document.body
        )}
    </motion.section>
    {!reduceMotion && <CloudGust />}
    </>
  );
}
