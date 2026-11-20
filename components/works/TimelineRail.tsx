"use client";

// The timeline's rail (portfolio.md §4): the track (solid, then dashed to the resting point), the
// progress thread, and the square that turns five times over the run. Scrubbed by the rail's own
// scroll position, "top center" → "bottom bottom"; it stops on the last entry, not at the foot.
// Shown from lg only, where it starts at the block's own top edge. Reduced motion: the thread
// follows the scroll unsmoothed and the square does not turn.

import { useEffect, useRef } from "react";
import { isReducedMotion, scrollTrigger } from "@/lib/engine";
import type { TimelineEntry } from "@/lib/works/entries";
import {
  MARK_SIZE, RAIL_DASH, RAIL_GAP, RAIL_SOLID, RAIL_START, RAIL_WIDTH, railHeight, restingPoint,
} from "@/lib/works/timeline-geometry";

const RAIL_X = RAIL_WIDTH / 2;

export default function TimelineRail({ entries }: { entries: readonly TimelineEntry[] }) {
  const railRef = useRef<HTMLDivElement>(null);
  const threadRef = useRef<SVGRectElement>(null);
  const markerRef = useRef<SVGGElement>(null);

  const total = railHeight(entries);
  const viewH = total - RAIL_START;
  const rest = restingPoint(entries) * total;

  useEffect(() => {
    const rail = railRef.current;
    const thread = threadRef.current;
    const marker = markerRef.current;
    if (!rail || !thread || !marker) return;
    const still = isReducedMotion();
    const draw = (share: number) => {
      const run = share * rest;
      thread.setAttribute("height", `${Math.max(0, run)}`);
      const turn = still || rest <= 0 ? 0 : (run / rest) * 1800;
      marker.setAttribute("transform", `translate(${RAIL_X} ${run}) rotate(${turn})`);
    };
    return scrollTrigger(rail, {
      start: "top center",
      end: "bottom bottom",
      onUpdate: (progress, smoothed) => draw(still ? progress : smoothed),
    });
  }, [rest]);

  return (
    <div ref={railRef} className="works-rail" aria-hidden="true">
      <svg viewBox={`0 0 ${RAIL_WIDTH} ${viewH}`} preserveAspectRatio="xMidYMin meet" overflow="visible" focusable="false">
        <line className="works-rail-track" x1={RAIL_X} x2={RAIL_X} y1={0} y2={RAIL_SOLID} />
        <line
          className="works-rail-track"
          x1={RAIL_X}
          x2={RAIL_X}
          y1={RAIL_SOLID + RAIL_GAP}
          y2={rest}
          strokeDasharray={`${RAIL_DASH} ${RAIL_DASH}`}
        />
        <rect ref={threadRef} className="works-rail-thread" x={RAIL_X - 0.5} y={0} width={1} height={0} />
        <g ref={markerRef} transform={`translate(${RAIL_X} 0)`}>
          <rect className="works-rail-mark" x={-MARK_SIZE / 2} y={-MARK_SIZE / 2} width={MARK_SIZE} height={MARK_SIZE} />
        </g>
      </svg>
    </div>
  );
}
