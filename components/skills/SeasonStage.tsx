"use client";

// The circuit stage (portfolio.md §3): the map SVG over its halftone, the lap trace canvas, the
// grid crawl and hub ping, and the cursor reticle. One 6-second lap the first time the block is 35%
// in view; it never re-runs or reverses.

import { useEffect, useRef } from "react";
import { getMQ, isReducedMotion, loopInView, ticker } from "@/lib/engine";
import { CIRCUIT_PATH, CIRCUIT_VIEW } from "@/lib/skills/circuit";
import {
  CORNER_MARK_SIZE, CORNER_MARKS, FLAG_CUT, FLAG_DIAMONDS, GRID_AXES_X, GRID_AXIS_Y, GRID_DASH,
  GRID_STROKE, HUB, LAP_CENTRELINE, LAP_LENGTH, LAP_MASK_WIDTH, MAP_VIEW, RINGS, TRACK_RIBBON,
  TURN_POINTS, TURNS,
} from "@/lib/skills/map-vector";
import { createLapTrace, distanceAtTime, LAP_TOTAL } from "./lapTrace";
import { mix, readScopedToken, toRgb, type SeasonPalette } from "./palette";
import { createSeasonDots } from "./seasonDots";

const PAST = 4000;
const LAP_MS = 6000;
const COOL_MS = 800;

const TRACK_BOX = (() => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of CIRCUIT_PATH) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const pad = 46;
  return { width: maxX - minX + pad * 2, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
})();

/** A looping 0..1 phase that only advances while it is being ticked. */
const pausable = (period: number) => {
  let elapsed = 0;
  let previous: number | null = null;
  return (time: number) => {
    if (previous !== null) elapsed += Math.min(64, Math.max(0, time - previous));
    previous = time;
    return (elapsed % period) / period;
  };
};

const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

const axisProps = {
  fill: "none",
  strokeWidth: GRID_STROKE,
  strokeDasharray: GRID_DASH,
  className: "season-axis",
} as const;

export default function SeasonStage() {
  const frameRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<HTMLCanvasElement>(null);
  const traceRef = useRef<HTMLCanvasElement>(null);
  const axesRef = useRef<SVGGElement>(null);
  const pingRef = useRef<SVGCircleElement>(null);
  const lapMaskRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const frameEl = frameRef.current;
    const stage = stageRef.current;
    const dotsCanvas = dotsRef.current;
    const traceCanvas = traceRef.current;
    const axesGroup = axesRef.current;
    const ping = pingRef.current;
    const lapMaskPath = lapMaskRef.current;
    const section = frameEl?.closest("section");
    if (!frameEl || !stage || !dotsCanvas || !traceCanvas || !axesGroup || !ping || !lapMaskPath || !section) return;

    const MQ = getMQ();
    const reduced = isReducedMotion();
    const cleanups: (() => void)[] = [];

    // ---- fit: cover from lg, below it the track box fitted to the width ----
    const fit = () => {
      const w = frameEl.clientWidth;
      const h = frameEl.clientHeight;
      if (!w || !h) return;
      let scale: number, x: number, y: number;
      if (MQ.lg.matches) {
        scale = Math.max(w / CIRCUIT_VIEW.width, h / CIRCUIT_VIEW.height);
        x = (w - CIRCUIT_VIEW.width * scale) / 2;
        y = (h - CIRCUIT_VIEW.height * scale) / 2;
      } else {
        scale = w / TRACK_BOX.width;
        x = w / 2 - TRACK_BOX.cx * scale;
        y = h / 2 - TRACK_BOX.cy * scale;
      }
      stage.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    };
    const fitObserver = new ResizeObserver(fit);
    fitObserver.observe(frameEl);
    fit();
    cleanups.push(() => fitObserver.disconnect());

    // ---- palette: the lap green, its deep end, and the resting dot ----
    const accent = toRgb(readScopedToken(frameEl, "--season-lap"));
    const white = toRgb(readScopedToken(frameEl, "--season-lap-core"));
    const palette: SeasonPalette = { dot: readScopedToken(frameEl, "--map-dot"), accent, white, bright: mix(accent, white, 0.55) };

    // ---- grid crawl (one dash period every 7s) and hub ping (every 4.2s, ease-out quad) ----
    const axes = Array.from(axesGroup.children);
    if (!reduced) {
      const crawlPhase = pausable(7000);
      const pingPhase = pausable(4200);
      cleanups.push(loopInView(frameEl, (time) => {
        const offset = (crawlPhase(time) * 20.5).toFixed(3);
        for (const axis of axes) axis.setAttribute("stroke-dashoffset", offset);
        const t = pingPhase(time);
        const v = 1 - (1 - t) * (1 - t);
        ping.setAttribute("r", (HUB.r + v * 86).toFixed(3));
        ping.setAttribute("opacity", (0.4 * (1 - v) * (1 - v)).toFixed(4));
      }));
    }

    // ---- the halftone ----
    const dots = createSeasonDots(dotsCanvas, palette);
    dots.bake();
    let bakedWidth = dotsCanvas.clientWidth;
    const dotsObserver = new ResizeObserver(() => {
      if (dotsCanvas.clientWidth === bakedWidth) return;
      bakedWidth = dotsCanvas.clientWidth;
      dots.bake();
    });
    dotsObserver.observe(dotsCanvas);
    cleanups.push(() => dotsObserver.disconnect());
    if (!reduced) cleanups.push(loopInView(frameEl, () => dots.frame()));

    // ---- the reticle: mouse only, armed once the lap has cooled ----
    let armed = false;
    const onMove = (event: PointerEvent) => {
      if (!armed || event.pointerType !== "mouse" || reduced || MQ.hoverNone.matches) return;
      const box = section.getBoundingClientRect();
      const rect = dotsCanvas.getBoundingClientRect();
      dots.aim(
        ((event.clientX - rect.left) / rect.width) * MAP_VIEW.width,
        ((event.clientY - rect.top) / rect.height) * MAP_VIEW.height,
        event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom,
      );
    };
    const putOut = () => dots.putOut();
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", putOut);
    document.documentElement.addEventListener("pointerleave", putOut);
    window.addEventListener("blur", putOut);
    cleanups.push(() => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", putOut);
      document.documentElement.removeEventListener("pointerleave", putOut);
      window.removeEventListener("blur", putOut);
    });

    // ---- the lap ----
    const ratio = MQ.coarse.matches ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    traceCanvas.width = Math.round(CIRCUIT_VIEW.width * ratio);
    traceCanvas.height = Math.round(CIRCUIT_VIEW.height * ratio);
    const context = traceCanvas.getContext("2d");
    if (!context) return () => cleanups.forEach((stop) => stop());
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const render = createLapTrace(context, palette);
    let heat = 1;
    const paint = (lap: number) => {
      render(lap, heat);
      const shown = 1 - distanceAtTime(lap) / LAP_TOTAL;
      lapMaskPath.setAttribute("stroke-dashoffset", String(60 + shown * LAP_LENGTH));
    };

    let stopTween: (() => void) | null = null;
    const tween = (duration: number, ease: (t: number) => number, onChange: (v: number) => void, onRest: () => void) => {
      let elapsed = 0;
      let previous: number | null = null;
      const unsubscribe = ticker.subscribe((time) => {
        if (previous !== null) elapsed += Math.min(64, Math.max(0, time - previous));
        previous = time;
        const t = Math.min(1, elapsed / duration);
        onChange(ease(t));
        if (t >= 1) {
          unsubscribe();
          stopTween = null;
          onRest();
        }
      });
      stopTween = unsubscribe;
    };
    cleanups.push(() => stopTween?.());

    if (reduced) {
      // Reduced motion: the lap is shown already run and cooled; nothing loops.
      heat = 0;
      paint(1);
    } else {
      paint(0);
      const arrival = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          arrival.disconnect();
          tween(LAP_MS, easeInOutSine, paint, () => {
            tween(COOL_MS, easeOutCubic, (value) => {
              heat = 1 - value;
              paint(1);
            }, () => {
              armed = true;
            });
          });
        },
        { threshold: 0.35 },
      );
      arrival.observe(frameEl);
      cleanups.push(() => arrival.disconnect());
    }

    return () => cleanups.forEach((stop) => stop());
  }, []);

  const maskBox = { maskUnits: "userSpaceOnUse", x: 0, y: 0, width: MAP_VIEW.width, height: MAP_VIEW.height } as const;

  return (
    <div ref={frameRef} className="season-frame" aria-hidden="true">
      <div ref={stageRef} className="season-stage">
        <div className="season-map">
          <canvas ref={dotsRef} className="season-dots" />
          <svg viewBox={`0 0 ${MAP_VIEW.width} ${MAP_VIEW.height}`} focusable="false">
            <defs>
              <mask id="season-flag-cut" {...maskBox}>
                <rect x={0} y={0} width={MAP_VIEW.width} height={MAP_VIEW.height} fill="#fff" />
                <rect
                  x={-FLAG_CUT.along / 2}
                  y={-FLAG_CUT.across / 2}
                  width={FLAG_CUT.along}
                  height={FLAG_CUT.across}
                  fill="#000"
                  transform={`translate(${FLAG_CUT.x} ${FLAG_CUT.y}) rotate(${FLAG_CUT.angle})`}
                />
              </mask>
              <mask id="season-lap-mask" {...maskBox}>
                <path
                  ref={lapMaskRef}
                  d={LAP_CENTRELINE}
                  fill="none"
                  stroke="#fff"
                  strokeWidth={LAP_MASK_WIDTH}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={LAP_LENGTH + 60}
                  strokeDashoffset={60 + LAP_LENGTH}
                />
              </mask>
            </defs>
            <g id="grid">
              <g ref={axesRef}>
                {GRID_AXES_X.map((x) => (
                  <line key={x} x1={x} x2={x} y1={-PAST} y2={MAP_VIEW.height + PAST} {...axisProps} />
                ))}
                <line x1={-PAST} x2={MAP_VIEW.width + PAST} y1={GRID_AXIS_Y} y2={GRID_AXIS_Y} {...axisProps} />
              </g>
              {RINGS.map((ring) => (
                <circle
                  key={ring.r}
                  cx={HUB.x}
                  cy={HUB.y}
                  r={ring.r}
                  fill="none"
                  strokeWidth={ring.width}
                  className={ring.ghost ? "season-ring-ghost" : "season-ring"}
                />
              ))}
              <circle ref={pingRef} cx={HUB.x} cy={HUB.y} r={HUB.r} fill="none" strokeWidth={GRID_STROKE} opacity={0} className="season-ping" />
              {CORNER_MARKS.map(([x, y]) => (
                <rect key={`${x},${y}`} x={x} y={y} width={CORNER_MARK_SIZE} height={CORNER_MARK_SIZE} className="season-mark" />
              ))}
              <circle cx={HUB.x} cy={HUB.y} r={HUB.r} className="season-mark" />
            </g>
            <g mask="url(#season-flag-cut)">
              <path d={TRACK_RIBBON} className="season-ribbon" />
              <path d={TRACK_RIBBON} mask="url(#season-lap-mask)" className="season-ribbon-lit" />
            </g>
            <g id="markers">
              {TURNS.map((turn) => (
                <polygon
                  key={`${turn.x},${turn.y}`}
                  points={TURN_POINTS}
                  transform={`translate(${turn.x} ${turn.y}) rotate(${turn.angle})`}
                  className="season-turn"
                />
              ))}
              <path d={FLAG_DIAMONDS} className="season-mark" />
            </g>
          </svg>
        </div>
        <canvas ref={traceRef} className="season-trace" />
      </div>
    </div>
  );
}
