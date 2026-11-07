/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  SPRINGS,
  Spring,
  motion,
  reveal,
  gate,
  onHandover,
  fireHandover,
  loopInView,
  getLenis,
  getMQ,
  isReducedMotion,
  showAssetError,
} from "@/lib/engine";
import { getPortraitsReady } from "@/lib/portrait-maps";
import { HeroScene, DEFAULT_PARAMS, fitSubjectToBox } from "@/lib/hero-scene";
import { createContour } from "@/components/shared/ContourCanvas";

const emptySubscribe = () => () => {};

export default function Hero() {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [veilRemoved, setVeilRemoved] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const heroRef = useRef<HTMLElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const fitBoxRef = useRef<HTMLDivElement>(null);

  // Veil refs
  const veilRef = useRef<HTMLDivElement>(null);
  const veilContentRef = useRef<HTMLDivElement>(null);
  const veilFillRef = useRef<HTMLSpanElement>(null);
  const veilNameRef = useRef<HTMLParagraphElement>(null);
  const veilMeterRef = useRef<HTMLDivElement>(null);
  const veilMeterFillRef = useRef<HTMLSpanElement>(null);

  // Content refs
  const mastheadRef = useRef<HTMLElement>(null);
  const akaRef = useRef<HTMLParagraphElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);
  const nameBlockRef = useRef<HTMLDivElement>(null);
  const panelsRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDListElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLImageElement>(null);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const logoRef = useRef<HTMLAnchorElement>(null);

  // Menu sheet ref
  const sheetRef = useRef<HTMLDivElement>(null);

  // Main Hero + Scene + Veil initialization
  useEffect(() => {
    if (!mounted) return;

    const hero = heroRef.current;
    const container = canvasContainerRef.current;
    const box = fitBoxRef.current;
    if (!hero || !container) return;

    const reduced = isReducedMotion();
    const MQ = getMQ();
    const CLEAR_MS = reduced ? 30 : 430;
    const PAUSE_MS = reduced ? 20 : 240;
    const LIFT_TIMEOUT_MS = reduced ? 500 : 3000;

    const root = document.documentElement;
    root.classList.add("veil-lock");
    const lenis = getLenis();
    lenis?.stop();

    let readyCalled = false;
    let exitVeil: (() => void) | null = null;
    let sceneInstance: HeroScene | null = null;

    // --- Veil setup ---
    const veilEl = veilRef.current;
    const content = veilContentRef.current;
    const fill = veilFillRef.current;
    const meter = veilMeterRef.current;
    const meterFill = veilMeterFillRef.current;
    const veilName = veilNameRef.current;

    let progressSpring: Spring | null = null;
    let clearSpring: Spring | null = null;
    let fadeSpring: Spring | null = null;
    let liftTimer: ReturnType<typeof setTimeout> | null = null;
    let backstopTimer: ReturnType<typeof setTimeout> | null = null;

    if (veilEl && fill && meterFill && content && meter && veilName) {
      progressSpring = new Spring(0, SPRINGS.PROGRESS_WAIT);
      progressSpring.onChange((v) => {
        fill.style.transform = `scaleY(${v})`;
        meterFill.style.transform = `scaleX(${v})`;
      });
      progressSpring.set(reduced ? 1 : 0.7);

      motion(veilName, {
        from: { opacity: 0, y: "0.6rem" },
        to: { opacity: 1, y: "0rem" },
        config: SPRINGS.COPY,
        delayIn: reduced ? 0 : 260,
        mode: "once",
      }).enable();

      const lift = () => {
        fadeSpring = new Spring(1, SPRINGS.VEIL);
        fadeSpring.onChange((v) => {
          if (veilEl) veilEl.style.opacity = `${v}`;
        });
        fadeSpring.set(0);

        fireHandover();
        if (sceneInstance) sceneInstance.beginRise();

        root.classList.remove("veil-lock");
        if (!document.documentElement.classList.contains("menu-open")) {
          getLenis()?.start();
        }

        let done = false;
        const remove = () => {
          if (done) return;
          done = true;
          if (backstopTimer) clearTimeout(backstopTimer);
          setVeilRemoved(true);
        };
        backstopTimer = setTimeout(remove, LIFT_TIMEOUT_MS);
      };

      exitVeil = () => {
        if (progressSpring) progressSpring.set(1, { config: SPRINGS.PROGRESS_READY });
        veilEl.style.pointerEvents = "none";
        veilEl.setAttribute("aria-label", "Loaded");

        clearSpring = new Spring(1, SPRINGS.CLEAR);
        clearSpring.onChange((v) => {
          content.style.opacity = `${v}`;
          if (!reduced) content.style.transform = `translateY(${(1 - v) * -0.75}rem)`;
          meter.style.opacity = `${v}`;
        });
        clearSpring.set(0);

        liftTimer = setTimeout(lift, CLEAR_MS + PAUSE_MS);
      };

      if (readyCalled) exitVeil();
    }

    const setVeilReady = () => {
      if (readyCalled) return;
      readyCalled = true;
      if (exitVeil) exitVeil();
    };

    // --- Entrance springs ---
    const masthead = mastheadRef.current;
    const aka = akaRef.current;
    const name = nameRef.current;
    const nameBlock = nameBlockRef.current;
    const panels = panelsRef.current;
    const stats = statsRef.current;
    const figures = Array.from(hero.querySelectorAll<HTMLElement>("[data-hero-figure]"));
    const actions = actionsRef.current;
    const metaRows = Array.from(hero.querySelectorAll<HTMLElement>("[data-hero-meta-row]"));

    const rise = (el: HTMLElement | null, delayIn: number) =>
      motion(el, {
        from: { opacity: 0, y: "1.25rem" },
        to: { opacity: 1, y: "0rem" },
        config: SPRINGS.REVEAL,
        delayIn: reduced ? 0 : delayIn,
        mode: "once",
      });

    const entrance = [
      rise(masthead, 0),
      motion(aka, {
        from: { opacity: 0 },
        to: { opacity: 1 },
        config: SPRINGS.REVEAL,
        delayIn: reduced ? 0 : 180,
        mode: "once",
      }),
      reveal(name, {
        by: "words",
        stagger: reduced ? 0 : 110,
        config: SPRINGS.REVEAL,
        delayIn: reduced ? 0 : 180,
        mode: "once",
        text: "um lyrithyreach",
      }),
      ...metaRows.map((row, i) =>
        motion(row, {
          from: { opacity: 0, y: "0.75rem" },
          to: { opacity: 1, y: "0rem" },
          config: SPRINGS.REVEAL,
          delayIn: reduced ? 0 : 180 + 260 + i * 130,
          mode: "once",
        })
      ),
      rise(panels, 900),
      rise(actions, 1500),
    ];

    const figureTexts = ["5", "3", "11"];
    const figureReveals = figures.map((dd, i) =>
      reveal(dd, {
        by: "letters",
        stagger: reduced ? 0 : 26,
        config: SPRINGS.FIGURE,
        delayIn: reduced ? 0 : 900 + i * 90,
        mode: "forward",
        text: figureTexts[i] ?? dd.textContent ?? "",
      })
    );

    const onHandoverCallback = () => {
      for (const m of entrance) m.enable();
      if (stats) gate(stats, figureReveals);
    };
    onHandover(onHandoverCallback);

    // --- Name fit measurement ---
    let measureEl: HTMLSpanElement | null = null;
    let fitFrame = 0;
    const fitName = () => {
      if (!nameBlock || !name || !measureEl) return;
      const ceiling = parseFloat(getComputedStyle(measureEl).fontSize);
      const wordWidth = measureEl.getBoundingClientRect().width;
      const columnWidth = nameBlock.clientWidth;
      if (!ceiling || !wordWidth || !columnWidth) return;
      name.style.setProperty("--name-size", `${Math.min(ceiling, (ceiling * columnWidth) / wordWidth)}px`);
    };

    if (nameBlock && name) {
      const longWord = "lyrithyreach";
      measureEl = document.createElement("span");
      measureEl.className = "hero-name-measure";
      measureEl.setAttribute("aria-hidden", "true");
      measureEl.textContent = longWord;
      nameBlock.appendChild(measureEl);

      const onResize = () => {
        cancelAnimationFrame(fitFrame);
        fitFrame = requestAnimationFrame(fitName);
      };
      window.addEventListener("resize", onResize);
      fitName();
      document.fonts.ready.then(fitName);
    }

    // --- Image error listener ---
    const map = mapRef.current;
    if (map) {
      const fail = () => showAssetError(map.currentSrc || map.src);
      map.addEventListener("error", fail, { once: true });
      if (map.complete && map.naturalWidth === 0) fail();
    }

    // --- WebGL scene setup + Fallback ---
    let canvasEl: HTMLCanvasElement | null = null;
    let cleanupFallback: (() => void) | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let pointerMoveBound = false;
    let onPointerHandler: ((event: PointerEvent) => void) | null = null;
    let stopRenderLoop: (() => void) | null = null;
    let backstopFailTimer: ReturnType<typeof setTimeout> | null = null;

    const boxShown = () => Boolean(box && box.offsetParent !== null);

    const fallback = () => {
      const fbCanvas = document.createElement("canvas");
      fbCanvas.className = "size-full";
      fbCanvas.setAttribute("aria-hidden", "true");
      container.appendChild(fbCanvas);
      const stopContour = createContour(fbCanvas, { colorToken: "--surface-soft", frozen: true });

      const img = document.createElement("img");
      img.alt = "";
      img.setAttribute("aria-hidden", "true");
      img.setAttribute("data-hero-fallback", "");
      const place = () => {
        const c = container.getBoundingClientRect();
        const b = boxShown() && box ? box.getBoundingClientRect() : c;
        img.style.top = `${b.top - c.top}px`;
        img.style.height = `${b.height}px`;
      };
      const obs = new ResizeObserver(place);
      obs.observe(container);

      getPortraitsReady().then(
        async ({ pro }) => {
          img.src = pro.cutoutUrl;
          container.appendChild(img);
          place();
          await img.decode().catch(() => {});
          setVeilReady();
        },
        () => {
          setVeilReady();
        }
      );

      cleanupFallback = () => {
        stopContour();
        obs.disconnect();
        fbCanvas.remove();
        img.remove();
      };
    };

    getPortraitsReady().catch(() => setVeilReady());

    const testWebgl2 = () => {
      try {
        const probeCanvas = document.createElement("canvas");
        const ctx2 = probeCanvas.getContext("webgl2");
        if (!ctx2) return false;
        ctx2.getExtension("WEBGL_lose_context")?.loseContext();
        return true;
      } catch {
        return false;
      }
    };

    if (!testWebgl2()) {
      fallback();
    } else {
      canvasEl = document.createElement("canvas");
      canvasEl.className = "size-full";
      canvasEl.setAttribute("aria-hidden", "true");
      container.appendChild(canvasEl);

      try {
        sceneInstance = new HeroScene(canvasEl);
      } catch (err) {
        console.error("HeroScene init error:", err);
        canvasEl.remove();
        canvasEl = null;
        fallback();
      }

      if (sceneInstance) {
        let tier = sceneInstance.tier;

        const applyFit = () => {
          if (!sceneInstance) return;
          const s = hero.getBoundingClientRect();
          const b = boxShown() && box ? box.getBoundingClientRect() : null;
          sceneInstance.setParams({
            ...DEFAULT_PARAMS,
            ...(b
              ? fitSubjectToBox(
                  DEFAULT_PARAMS,
                  { top: b.top - s.top, height: b.height },
                  container.clientHeight
                )
              : null),
            ...(window.matchMedia("(max-width: 1023px)").matches ? { bgRevealOpacity: 0 } : null),
            ...(window.matchMedia("(hover: none)").matches ? { autoSweepAmount: 0.76 } : null),
            ...(window.matchMedia("(max-width: 639px)").matches
              ? { sweepRadius: 0.95, sweepWarp: 0.18, autoSweepAmount: 0.55 }
              : null),
            ...(sceneInstance.tier.reveal ? null : { autoSweepAmount: 0 }),
          });
        };

        const onPointer = (event: PointerEvent) => {
          if (sceneInstance) {
            sceneInstance.setPointer(
              (event.clientX / window.innerWidth) * 2 - 1,
              (event.clientY / window.innerHeight) * 2 - 1
            );
          }
        };
        onPointerHandler = onPointer;

        const bindPointer = () => {
          if (tier.pointerEnabled && !pointerMoveBound) {
            window.addEventListener("pointermove", onPointer, { passive: true });
            pointerMoveBound = true;
          } else if (!tier.pointerEnabled && pointerMoveBound) {
            window.removeEventListener("pointermove", onPointer);
            pointerMoveBound = false;
          }
        };

        let lastWidth = container.clientWidth;
        let lastCoarse = MQ.coarse.matches;
        let measureFrame = 0;
        const measure = () => {
          measureFrame = 0;
          if (!sceneInstance) return;
          const width = container.clientWidth;
          const height = container.clientHeight;
          const coarse = MQ.coarse.matches;
          const retune = width !== lastWidth || coarse !== lastCoarse;
          if (!retune && coarse) return;
          lastWidth = width;
          lastCoarse = coarse;
          if (retune) {
            tier = sceneInstance.retune();
            bindPointer();
          }
          sceneInstance.resize(width, height);
          applyFit();
        };

        const schedule = () => {
          if (!measureFrame) measureFrame = requestAnimationFrame(measure);
        };

        sceneInstance.resize(container.clientWidth, container.clientHeight);
        applyFit();
        bindPointer();

        resizeObserver = new ResizeObserver(schedule);
        resizeObserver.observe(container);
        MQ.coarse.addEventListener("change", schedule);

        let failed = false;
        stopRenderLoop = loopInView(
          hero,
          (time) => {
            if (failed || document.hidden || window.scrollY > window.innerHeight * 1.15) return;
            sceneInstance?.update(time);
          },
          () => tier.frameInterval
        );

        let sceneReady = false;
        const sceneFailed = () => {
          if (sceneReady || failed) return;
          failed = true;
          showAssetError("The hero scene failed to start; showing a still portrait instead.");
          if (canvasEl) canvasEl.remove();
          canvasEl = null;
          fallback();
        };

        sceneInstance.onReady = () => {
          if (failed) return;
          sceneReady = true;
          setVeilReady();
        };

        backstopFailTimer = setTimeout(() => {
          getPortraitsReady().then(sceneFailed, () => {});
        }, 12000);

        // If reduced motion is set, lift immediately
        if (reduced) {
          setVeilReady();
        }
      }
    }

    return () => {
      root.classList.remove("veil-lock");
      if (liftTimer) clearTimeout(liftTimer);
      if (backstopTimer) clearTimeout(backstopTimer);
      if (backstopFailTimer) clearTimeout(backstopFailTimer);
      if (measureEl) measureEl.remove();
      if (fitFrame) cancelAnimationFrame(fitFrame);
      if (resizeObserver) resizeObserver.disconnect();
      if (pointerMoveBound && onPointerHandler) window.removeEventListener("pointermove", onPointerHandler);
      if (stopRenderLoop) stopRenderLoop();
      if (cleanupFallback) cleanupFallback();
      if (sceneInstance) sceneInstance.dispose();
      if (canvasEl) canvasEl.remove();
    };
  }, [mounted]);

  // Menu Sheet handlers
  const openMenu = () => {
    setIsMenuOpen(true);
    document.documentElement.classList.add("menu-open");
    const main = document.querySelector("main");
    if (main) (main as HTMLElement).inert = true;
    getLenis()?.stop();
  };

  const closeMenu = (options: { restoreFocus?: boolean; focusLogo?: boolean } = {}) => {
    setIsMenuOpen(false);
    document.documentElement.classList.remove("menu-open");
    const main = document.querySelector("main");
    if (main) (main as HTMLElement).inert = false;
    getLenis()?.start();
    if (options.restoreFocus && burgerRef.current) {
      burgerRef.current.focus({ preventScroll: true });
    } else if (options.focusLogo && logoRef.current) {
      logoRef.current.focus({ preventScroll: true });
    }
  };

  useEffect(() => {
    if (!mounted) return;
    const sheet = sheetRef.current;
    if (!sheet) return;

    const items = Array.from(sheet.querySelectorAll<HTMLElement>("[data-hero-sheet-item]")).map((item, i) =>
      motion(item, {
        from: { opacity: 0, y: "0.75rem" },
        to: { opacity: 1, y: "0rem" },
        config: SPRINGS.ITEM,
        delayIn: isReducedMotion() ? 0 : 120 + i * 55,
        mode: "always",
      })
    );

    const sheetFade = new Spring(0, SPRINGS.SHEET);
    sheetFade.onChange((v) => {
      sheet.style.opacity = `${v}`;
    });

    if (isMenuOpen) {
      sheet.hidden = false;
      if (isReducedMotion()) {
        sheet.style.opacity = "1";
      } else {
        sheetFade.set(1);
      }
      for (const m of items) m.enable();
      const closeBtn = sheet.querySelector<HTMLElement>("[data-hero-sheet-close]");
      closeBtn?.focus({ preventScroll: true });
    } else {
      if (isReducedMotion()) {
        sheet.style.opacity = "0";
        sheet.hidden = true;
      } else {
        sheetFade.set(0);
      }
      for (const m of items) m.disable();
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu({ restoreFocus: true });
    };

    if (isMenuOpen) {
      document.addEventListener("keydown", onKey);
    }

    const MQ = getMQ();
    const onMqChange = (e: MediaQueryListEvent) => {
      if (e.matches && isMenuOpen) closeMenu({ focusLogo: true });
    };
    MQ.xl.addEventListener("change", onMqChange);

    return () => {
      document.removeEventListener("keydown", onKey);
      MQ.xl.removeEventListener("change", onMqChange);
    };
  }, [isMenuOpen, mounted]);

  return (
    <section id="home" data-hero ref={heroRef}>
      {/* Layer 0: the scene mounts its canvas here. */}
      <div data-hero-canvas aria-hidden="true" ref={canvasContainerRef}></div>

      {/* Below xl: the copy ramp over the scene, and the box the scene fits the subject to. */}
      <div className="hero-ramp" aria-hidden="true"></div>
      <div className="hero-figure" aria-hidden="true">
        <div data-hero-fit ref={fitBoxRef}></div>
        <div className="hero-figure-ramp"></div>
      </div>

      {/* The loading veil (position: fixed, portalled to body) */}
      {mounted &&
        !veilRemoved &&
        createPortal(
          <div
            className="hero-veil"
            data-hero-veil
            ref={veilRef}
            role="status"
            aria-label="Loading Reach's portfolio"
          >
            <div className="hero-veil-content" data-veil-content ref={veilContentRef}>
              <div className="hero-veil-glyph" aria-hidden="true">
                <span className="hero-veil-ghost"></span>
                <span className="hero-veil-fill" data-veil-fill ref={veilFillRef}></span>
              </div>
              <p className="hero-veil-name" data-veil-name ref={veilNameRef} aria-hidden="true">
                um lyrithyreach
              </p>
            </div>
            <div className="hero-veil-meter" data-veil-meter ref={veilMeterRef} aria-hidden="true">
              <span className="hero-veil-meter-fill" data-veil-meter-fill ref={veilMeterFillRef}></span>
            </div>
          </div>,
          document.body
        )}

      {/* The content column. */}
      <div className="hero-content">
        <header className="hero-masthead" data-hero-masthead ref={mastheadRef}>
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

        <div className="hero-middle">
          <div className="hero-identity" data-hero-identity>
            <div className="hero-name-block" data-hero-name-block ref={nameBlockRef}>
              <p className="hero-aka" data-hero-aka ref={akaRef}>
                aka reach · kaizen
              </p>
              <h1 className="hero-name" data-hero-name ref={nameRef}>
                um lyrithyreach
              </h1>
            </div>
            <ul className="hero-meta" role="list">
              <li data-hero-meta-row>
                <svg className="hero-flag" viewBox="0 0 18 12" role="img" aria-label="Cambodia">
                  <rect x="0" y="0" width="18" height="3" fill="#032ea1" />
                  <rect x="0" y="3" width="18" height="6" fill="#e00025" />
                  <rect x="0" y="9" width="18" height="3" fill="#032ea1" />
                  <g fill="#ffffff">
                    <rect x="6.5" y="5.5" width="5" height="3" />
                    <rect x="6.5" y="3.9" width="1" height="1.6" />
                    <rect x="8.5" y="3.5" width="1" height="2" />
                    <rect x="10.5" y="3.9" width="1" height="1.6" />
                  </g>
                </svg>
                <span>Cambodia</span>
              </li>
              <li data-hero-meta-row>
                <svg className="hero-star" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                  <path d="M8 0 L9.6 6.4 L16 8 L9.6 9.6 L8 16 L6.4 9.6 L0 8 L6.4 6.4 Z" />
                </svg>
                <span>web developer_full stack</span>
              </li>
              <li data-hero-meta-row>
                <svg className="hero-star" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                  <path d="M8 0 L9.6 6.4 L16 8 L9.6 9.6 L8 16 L6.4 9.6 L0 8 L6.4 6.4 Z" />
                </svg>
                <span>CADT_computer science</span>
              </li>
            </ul>
          </div>

          <div className="hero-panels" data-hero-panels ref={panelsRef}>
            <a
              className="hero-panel hero-panel--building"
              href="https://asip-redesign-eyca.vercel.app/"
              target="_blank"
              rel="noopener"
            >
              <svg className="hero-corner hero-corner--tl" viewBox="0 0 10.5 10.5" aria-hidden="true" focusable="false">
                <path d="M0 0.5H10V10.5" />
              </svg>
              <svg className="hero-corner hero-corner--tr" viewBox="0 0 10.5 10.5" aria-hidden="true" focusable="false">
                <path d="M0 0.5H10V10.5" />
              </svg>
              <svg className="hero-corner hero-corner--bl" viewBox="0 0 10.5 10.5" aria-hidden="true" focusable="false">
                <path d="M0 0.5H10V10.5" />
              </svg>
              <svg className="hero-corner hero-corner--br" viewBox="0 0 10.5 10.5" aria-hidden="true" focusable="false">
                <path d="M0 0.5H10V10.5" />
              </svg>
              <p className="hero-eyebrow">now building</p>
              <div className="hero-building">
                <dl className="hero-building-list">
                  <dt>asip redesign</dt>
                  <dd>next.js 16 · gsap</dd>
                  <dd>in progress</dd>
                </dl>
                <img
                  data-hero-map
                  src="/image/projects/asipredesign.png"
                  alt="ASIP Redesign preview"
                  loading="lazy"
                  decoding="async"
                  ref={mapRef}
                />
              </div>
              <span className="vh"> (opens in a new tab)</span>
            </a>

            <div className="hero-panel hero-panel--glance">
              <svg className="hero-corner hero-corner--tl" viewBox="0 0 10.5 10.5" aria-hidden="true" focusable="false">
                <path d="M0 0.5H10V10.5" />
              </svg>
              <svg className="hero-corner hero-corner--tr" viewBox="0 0 10.5 10.5" aria-hidden="true" focusable="false">
                <path d="M0 0.5H10V10.5" />
              </svg>
              <svg className="hero-corner hero-corner--bl" viewBox="0 0 10.5 10.5" aria-hidden="true" focusable="false">
                <path d="M0 0.5H10V10.5" />
              </svg>
              <svg className="hero-corner hero-corner--br" viewBox="0 0 10.5 10.5" aria-hidden="true" focusable="false">
                <path d="M0 0.5H10V10.5" />
              </svg>
              <p className="hero-eyebrow">at a glance</p>
              <dl className="hero-stats" data-hero-stats ref={statsRef}>
                <div>
                  <dt>Projects</dt>
                  <dd data-hero-figure>5</dd>
                </div>
                <div>
                  <dt>Full-stack</dt>
                  <dd data-hero-figure>3</dd>
                </div>
                <div>
                  <dt>Skills</dt>
                  <dd data-hero-figure>11</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
        <h2 className="vh">Introduction</h2>

        <div className="hero-actions" data-hero-actions ref={actionsRef}>
          <a className="hero-hello" href="#contact">
            <svg className="hero-hello-badge" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
              <circle cx="16" cy="16" r="15.5" />
              <path d="M12 11L7 16L12 21M20 11L25 16L20 21M17.5 9.5L14.5 22.5" />
            </svg>
            <span className="hero-hello-lines">
              <span className="hero-hello-code">console.log(&quot;hello world&quot;)</span>
              <span className="hero-hello-sub">gmt+7 · cambodia</span>
            </span>
          </a>

          <a className="hero-cta" href="#works">
            <svg
              className="hero-cta-frame"
              viewBox="0 0 220 50"
              preserveAspectRatio="none"
              aria-hidden="true"
              focusable="false"
            >
              <path className="hero-cta-body" d="M220 42L212.932 50H0V0H220V42Z" />
              <path className="hero-cta-flood" d="M220 42L212.932 50H0V0H220V42Z" />
              <path className="hero-cta-ring" d="M220 42L212.932 50H0V0H220V42Z" />
              <path
                className="hero-cta-brackets"
                d="M205 49.5H213L219.5 42V36M212 0.5H219.5V7M8 0.5H0.5V7M7.5 49.5H0.5V42.5"
              />
            </svg>
            <span className="hero-cta-label">view my work</span>
            <svg className="hero-cta-arrow" viewBox="0 0 13.7071 10.7071" aria-hidden="true" focusable="false">
              <path d="M0 5.35355H13M8 10.3536L13 5.35355L8 0.353553" />
            </svg>
          </a>

          <ul className="hero-socials" role="list">
            <li>
              <a href="https://github.com/UmLyrithyreach" target="_blank" rel="noopener">
                github<span className="vh"> (opens in a new tab)</span>
              </a>
            </li>
            <li>
              <a href="https://www.linkedin.com/in/lyrithyreach-um-848513364" target="_blank" rel="noopener">
                linkedin<span className="vh"> (opens in a new tab)</span>
              </a>
            </li>
            <li>
              <a href="https://t.me/Durian_Lover67" target="_blank" rel="noopener">
                telegram<span className="vh"> (opens in a new tab)</span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      <img className="vh" src="/image/professional.png" alt="Um Lyrithyreach (Reach), web developer" />

      {/* The full-screen menu sheet (portalled to body) */}
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
                <li data-hero-sheet-item>
                  <a href="#home">home</a>
                </li>
                <li data-hero-sheet-item>
                  <a href="#skills">skills</a>
                </li>
                <li data-hero-sheet-item>
                  <a href="#works">works</a>
                </li>
                <li data-hero-sheet-item>
                  <a href="#about">about</a>
                </li>
                <li data-hero-sheet-item>
                  <a href="#contact">contact</a>
                </li>
                <li data-hero-sheet-item>
                  <a href="#contact">Let&apos;s Talk</a>
                </li>
              </ul>
            </nav>
          </div>,
          document.body
        )}
    </section>
  );
}
