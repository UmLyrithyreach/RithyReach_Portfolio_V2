/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { HelloSweep } from "@/components/hero/HelloSweep";
import { HeroStreaks } from "@/components/hero/HeroStreaks";
import { smoothstep, viewportHeight } from "@/lib/scroll-math";

/** Lofi seaside-train AI loop (first frame = last frame, so it repeats without a jump) and its first frame as poster. */
const LOOP_WEBM = "/video/hero-loop.webm";
const LOOP_MP4 = "/video/hero-loop.mp4";
const POSTER = "/image/hero-poster.webp";

/*
 * Transition into the intro: the hero is pinned (hero.css) and, as the visitor scrolls, it picks up
 * speed: the scene gets a horizontal motion blur and stretches a little, white streaks fly to the
 * left (HeroStreaks), and the copy stays sharp on top while it drifts left and fades. Then the
 * hero fades out as HelloSweep runs "HELLO I'M REACH" across from the right. The blur moves in
 * whole steps, so the scene repaints a handful of times instead of on every scroll frame.
 */
/** Strongest horizontal blur on the scene, px (std deviation of the SVG blur). */
const MAX_MOTION_BLUR = 24;

const emptySubscribe = () => () => {};
/** Save-Data (Network Information API, Chromium only); false on the server and elsewhere. */
const readSaveData = () => Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);

export default function Hero() {
  const [clock, setClock] = useState<string | null>(null);
  const [videoShown, setVideoShown] = useState(false);

  // Phnom Penh time for the upper-right readout, refreshed every 15s.
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Phnom_Penh", hour: "2-digit", minute: "2-digit" });
    const tick = () => setClock(fmt.format(new Date()));
    tick();
    const id = window.setInterval(tick, 15000);
    return () => window.clearInterval(id);
  }, []);

  const heroRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Hydration-safe (framer's useReducedMotion can differ on the first client render).
  const reduceMotion = usePrefersReducedMotion();
  const saveData = useSyncExternalStore(emptySubscribe, readSaveData, () => false);
  // Reduced motion or Save-Data: the still frame only, the loop never plays.
  const paused = reduceMotion || saveData;

  const { scrollY } = useScroll();
  // The timeline, in screens of scroll: speed builds 0 -> 0.3 with the copy readable; the copy fades
  // 0.3 -> 0.42 (hero.css); the hero fades 0.42 -> 0.5 under HelloSweep's cream veil.
  const zoomOpacity = useTransform(scrollY, (y) => 1 - smoothstep(0.42, 0.5, y / viewportHeight()));
  /** How fast the exit feels, 0..1: builds over the first 0.3 screen of scroll. */
  const speed = useTransform(scrollY, (y) => smoothstep(0.01, 0.3, y / viewportHeight()));
  // The scene stretches a little and blurs sideways only; scaled up so the blur never pulls in its edges.
  const mediaScaleX = useTransform(speed, (k) => 1 + 0.14 * k);
  const mediaScaleY = useTransform(speed, (k) => 1 + 0.03 * k);
  const blurStep = useTransform(speed, (k) => Math.round((MAX_MOTION_BLUR * k) / 4) * 4);
  const mediaFilter = useTransform(blurStep, (b) => (b > 0 ? "url(#hero-motion-blur)" : "none"));
  const blurRef = useRef<SVGFEGaussianBlurElement>(null);
  useMotionValueEvent(blurStep, "change", (b) => blurRef.current?.setAttribute("stdDeviation", `${b} 0`));

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

  // Play only while the hero is on screen (and never under reduced motion or Save-Data).
  useEffect(() => {
    const video = videoRef.current;
    const hero = heroRef.current;
    if (!video || !hero) return;
    // React does not reliably reflect `muted` to the DOM; autoplay policies need it set.
    video.muted = true;
    let onScreen = true;
    const sync = () => {
      if (paused || !onScreen || document.hidden) video.pause();
      else video.play().catch(() => {});
    };
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      sync();
    });
    io.observe(hero);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [paused]);

  return (
    <>
    <motion.section
      id="home"
      data-hero
      ref={heroRef}
      style={reduceMotion ? undefined : { opacity: zoomOpacity }}
    >
      {/* Hidden veil element so any legacy e2e selector waiting for .hero-veil to be hidden resolves immediately */}
      <div className="hero-veil" hidden aria-hidden="true" />
      <h2 className="vh">Introduction</h2>

      {/* Full-bleed scene: the still frame paints first (and is all reduced-motion and Save-Data
          visitors get); the loop fades in over it once it is actually playing. */}
      {/* Horizontal-only blur for the scene (stdDeviation "x 0"), set from the scroll above. */}
      <svg className="hero-motion-defs" width="0" height="0" aria-hidden="true" focusable="false">
        <filter id="hero-motion-blur" x="-5%" y="0" width="110%" height="100%" colorInterpolationFilters="sRGB">
          <feGaussianBlur ref={blurRef} stdDeviation="0 0" edgeMode="duplicate" />
        </filter>
      </svg>
      <motion.div
        className="hero-media"
        aria-hidden="true"
        style={reduceMotion ? undefined : { scaleX: mediaScaleX, scaleY: mediaScaleY, filter: mediaFilter }}
      >
        <img
          src={POSTER}
          alt=""
          width="1920"
          height="1080"
          fetchPriority="high"
          decoding="async"
          className="hero-media-poster"
        />
        <video
          ref={videoRef}
          className="hero-media-video"
          data-shown={videoShown || undefined}
          poster={POSTER}
          width="1920"
          height="1080"
          muted
          loop
          playsInline
          preload="metadata"
          disablePictureInPicture
          tabIndex={-1}
          onPlaying={() => setVideoShown(true)}
        >
          <source src={LOOP_WEBM} type="video/webm" />
          <source src={LOOP_MP4} type="video/mp4" />
        </video>
        <div className="hero-media-scrim" />
      </motion.div>

      {!reduceMotion && <HeroStreaks intensity={speed} />}

      {/* Upper right: my local time, live (blank until mounted, so server and client agree) */}
      <p className="hero-stamp hero-locale">
        <span className="hero-locale-label">Phnom Penh, KH</span>
        <span className="hero-locale-time">
          <time>{clock ?? "--:--"}</time> <span className="hero-locale-zone">GMT+7</span>
        </span>
      </p>

      {/* The copy sits in the calm part of the frame: over the sea and bench on the right on wide
          screens, over the dark bench at the bottom on phones (hero.css). */}
      <div className="hero-header-copy">
        <p className="hero-eyebrow">
          <span className="hero-eyebrow-rule" aria-hidden="true" />
          <span className="hero-eyebrow-role">Software engineer</span>
          <span className="hero-eyebrow-sep" aria-hidden="true" />
          <span className="hero-eyebrow-place">CADT, Cambodia</span>
        </p>
        <h1 className="hero-headline">
          <span className="hero-headline-line">Hi, I&apos;m Reach.</span>
          <span className="hero-headline-italic">I build web &amp; mobile.</span>
        </h1>
        <p className="hero-subtitle">
          A software engineer building apps for the web and for phones, front end to database —
          React and Next.js up front, Node.js and PostgreSQL behind.
        </p>
      </div>

      {/* Bottom: who I am */}
      <div className="hero-bottom-bar">
        <p className="hero-corner-note">Reach, or Kaizen.</p>
      </div>
    </motion.section>
    {!reduceMotion && <HelloSweep />}
    </>
  );
}
