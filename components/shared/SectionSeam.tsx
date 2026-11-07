"use client";

import React, { useEffect, useRef } from "react";
import { readToken, scrollTrigger, SPRINGS } from "@/lib/engine";

export interface SectionSeamProps {
  carry?: "light" | "dark";
  className?: string;
  style?: React.CSSProperties;
}

export function SectionSeam({ carry = "light", className, style }: SectionSeamProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const CELL_W = 10;
    const CELL_H = 6;
    const ACCENT_CHANCE = 0.12;

    const colHash = (x: number) => {
      let h = Math.imul(x, 374761393) ^ 1274126177;
      h = Math.imul(h ^ (h >>> 13), 668265263);
      return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
    };

    let width = 0;
    let height = 0;
    let progress = 0;

    const surfaceColor = readToken(carry === "light" ? "--background" : "--surface-black") || (carry === "light" ? "#f7fafb" : "#090a0b");
    const accentColor = readToken("--accent") || "#02d2e3";

    const render = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);
      if (!width || !height) return;

      const cols = Math.ceil(width / CELL_W);
      const rows = Math.ceil(height / CELL_H);

      for (let c = 0; c < cols; c++) {
        const rand = colHash(c);
        // Column height varies smoothly and deterministically with progress
        const targetLen = (progress * 0.7 + rand * 0.3) * rows;
        const colRows = Math.min(rows, Math.floor(targetLen));

        for (let r = 0; r < colRows; r++) {
          const isLeadingEdge = r === colRows - 1;
          const isAccent = isLeadingEdge && colHash(c + r * 7) < ACCENT_CHANCE;

          context.fillStyle = isAccent ? accentColor : surfaceColor;

          if (isAccent) {
            // 2px terminal tick along leading edge
            context.fillRect(c * CELL_W, r * CELL_H + (CELL_H - 2), CELL_W - 1, 2);
          } else {
            // Digital bit block with 1px cell spacing
            context.fillRect(c * CELL_W, r * CELL_H, CELL_W - 1, CELL_H - 1);
          }
        }
      }
    };

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = container.clientWidth;
      height = container.clientHeight;
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      render();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(container);

    const stopTrigger = scrollTrigger(container, {
      start: "top bottom",
      end: "top top",
      config: SPRINGS.TRIGGER,
      onUpdate: (_, smoothed) => {
        if (smoothed === progress) return;
        progress = smoothed;
        render();
      },
    });

    resize();

    return () => {
      stopTrigger();
      observer.disconnect();
    };
  }, [carry]);

  return (
    <div
      ref={containerRef}
      className={className}
      aria-hidden="true"
      style={{
        position: "relative",
        width: "100%",
        height: "clamp(48px, 8svh, 96px)",
        pointerEvents: "none",
        overflow: "hidden",
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
