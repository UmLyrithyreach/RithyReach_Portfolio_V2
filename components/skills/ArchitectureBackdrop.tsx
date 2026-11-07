"use client";

import { motion, useReducedMotion } from "framer-motion";

export function ArchitectureBackdrop() {
  const reducedMotion = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none"
      style={{
        maskImage:
          "linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)",
      }}
    >
      <svg
        className="h-full w-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <defs>
          <pattern
            id="arch-dot-grid"
            width="32"
            height="32"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="16" cy="16" r="1" fill="#2a2d36" />
          </pattern>
        </defs>

        {/* Engineering dot grid layer */}
        <rect
          width="100%"
          height="100%"
          fill="url(#arch-dot-grid)"
          className="opacity-[0.16]"
        />

        {/* Layer 01: Client Layer Bus */}
        <g className="opacity-60">
          <line
            x1="80"
            y1="180"
            x2="1360"
            y2="180"
            stroke="#2a2d36"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <text
            x="84"
            y="168"
            fill="#b6c1c8"
            fillOpacity="0.35"
            fontSize="10"
            fontFamily="var(--font-jetbrains-mono, monospace)"
            letterSpacing="0.18em"
          >
            BUS 01 // CLIENT LAYER
          </text>
        </g>

        {/* Layer 02: API / Runtime Services Bus */}
        <g className="opacity-60">
          <line
            x1="80"
            y1="450"
            x2="1360"
            y2="450"
            stroke="#2a2d36"
            strokeWidth="1"
          />
          <text
            x="84"
            y="438"
            fill="#b6c1c8"
            fillOpacity="0.35"
            fontSize="10"
            fontFamily="var(--font-jetbrains-mono, monospace)"
            letterSpacing="0.18em"
          >
            BUS 02 // API &amp; RUNTIME SERVICES
          </text>
        </g>

        {/* Layer 03: Data Store Bus */}
        <g className="opacity-60">
          <line
            x1="80"
            y1="720"
            x2="1360"
            y2="720"
            stroke="#2a2d36"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <text
            x="84"
            y="708"
            fill="#b6c1c8"
            fillOpacity="0.35"
            fontSize="10"
            fontFamily="var(--font-jetbrains-mono, monospace)"
            letterSpacing="0.18em"
          >
            BUS 03 // DATA STORE &amp; PERSISTENCE
          </text>
        </g>

        {/* Orthogonal Interconnects: Client -> API -> Data */}
        <g stroke="#2a2d36" strokeWidth="1" fill="none">
          {/* Channel A: Left interconnect */}
          <path d="M220 180V315H360V450" />
          <path d="M360 450V585H220V720" />

          {/* Channel B: Center-left primary pipeline */}
          <path d="M580 180V450" />
          <path d="M580 450V720" />

          {/* Channel C: Center-right pipeline */}
          <path d="M860 180V270H980V450" />
          <path d="M980 450V630H860V720" />

          {/* Channel D: Right interconnect */}
          <path d="M1220 180V450" />
          <path d="M1220 450V540H1100V720" />
        </g>

        {/* Coordinate tick marks / Crosshairs */}
        <g stroke="#2a2d36" strokeWidth="1" opacity="0.4">
          <path d="M75 175V185M70 180H80" />
          <path d="M1365 175V185M1360 180H1370" />
          <path d="M75 445V455M70 450H80" />
          <path d="M1365 445V455M1360 450H1370" />
          <path d="M75 715V725M70 720H80" />
          <path d="M1365 715V725M1360 720H1370" />
        </g>

        {/* Static Junction Nodes */}
        {[
          { cx: 220, cy: 180 },
          { cx: 580, cy: 180 },
          { cx: 860, cy: 180 },
          { cx: 1220, cy: 180 },
          { cx: 360, cy: 450 },
          { cx: 980, cy: 450 },
          { cx: 1220, cy: 450 },
          { cx: 220, cy: 720 },
          { cx: 860, cy: 720 },
          { cx: 1100, cy: 720 },
        ].map((pt, i) => (
          <circle
            key={i}
            cx={pt.cx}
            cy={pt.cy}
            r="3"
            fill="#090a0b"
            stroke="#2a2d36"
            strokeWidth="1"
          />
        ))}

        {/* Sparse Active Cyan Node Junctions & Slow Pulse Rings */}
        {[
          { cx: 580, cy: 450, delay: 0 },
          { cx: 360, cy: 450, delay: 1.5 },
          { cx: 980, cy: 450, delay: 0.8 },
          { cx: 580, cy: 720, delay: 2.2 },
        ].map((node, i) => (
          <g key={`cyan-node-${i}`}>
            <circle
              cx={node.cx}
              cy={node.cy}
              r="3.5"
              fill="#090a0b"
              stroke="#02d2e3"
              strokeWidth="1.5"
            />
            <circle cx={node.cx} cy={node.cy} r="1.5" fill="#02d2e3" />
            {!reducedMotion && (
              <motion.circle
                cx={node.cx}
                cy={node.cy}
                r="3.5"
                fill="none"
                stroke="#02d2e3"
                strokeWidth="1"
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{
                  scale: [1, 2.8, 1],
                  opacity: [0.6, 0, 0.6],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: node.delay,
                }}
                style={{
                  transformOrigin: `${node.cx}px ${node.cy}px`,
                }}
              />
            )}
          </g>
        ))}

        {/* Status Callout Pill in Architecture Trace */}
        <g opacity="0.4">
          <rect
            x="1160"
            y="438"
            width="120"
            height="24"
            fill="#0e0f14"
            stroke="#2a2d36"
            strokeWidth="1"
          />
          <text
            x="1172"
            y="454"
            fill="#02d2e3"
            fontSize="9"
            fontFamily="var(--font-jetbrains-mono, monospace)"
            letterSpacing="0.12em"
          >
            SYS_BUS // OK
          </text>
        </g>
      </svg>
    </div>
  );
}
