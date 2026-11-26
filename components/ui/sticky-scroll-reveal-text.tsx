"use client";

import * as React from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";

export type RevealUnit = "Words" | "Letters" | "Lines";
export type VerticalAlign = "Top" | "Center" | "Bottom";

export interface StickyScrollRevealTextProps {
    text?: string;
    unit?: RevealUnit;
    textColor?: string;
    sectionHeightVh?: number;
    speed?: number;
    alignY?: VerticalAlign;
    stickyOffsetPx?: number;
    maxWidth?: number;
    paddingVw?: number;
    wordGapEm?: number;
    ghostEnabled?: boolean;
    ghostOpacity?: number;
    ghostColor?: string;
    textAlign?: "left" | "center" | "right";
    className?: string;
}

type Token =
    | { kind: "token"; value: string; animIndex: number | null }
    | { kind: "br" };

type LineToken = { kind: "line"; value: string; animIndex: number };

function clamp01(n: number) {
    return Math.max(0, Math.min(1, n));
}

function tokenizeWordsOrLetters(raw: string, unit: "Words" | "Letters"): Token[] {
    const lines = (raw ?? "").split("\n");
    const out: Token[] = [];
    let animIndex = 0;

    for (let li = 0; li < lines.length; li++) {
        const line = lines[li];
        if (unit === "Words") {
            const words = line.trim() ? line.trim().split(/\s+/) : [];
            for (let i = 0; i < words.length; i++) {
                out.push({ kind: "token", value: words[i], animIndex });
                animIndex++;
                // Real space token so natural line wrapping works cleanly
                if (i !== words.length - 1) {
                    out.push({ kind: "token", value: " ", animIndex: null });
                }
            }
            if (!words.length) {
                out.push({ kind: "token", value: " ", animIndex: null });
            }
        } else {
            for (const ch of line) {
                if (ch === " ") {
                    out.push({ kind: "token", value: ch, animIndex: null });
                } else {
                    out.push({ kind: "token", value: ch, animIndex });
                    animIndex++;
                }
            }
            if (!line.length) {
                out.push({ kind: "token", value: " ", animIndex: null });
            }
        }
        if (li !== lines.length - 1) {
            out.push({ kind: "br" });
        }
    }
    return out;
}

function tokenizeLines(raw: string): LineToken[] {
    return (raw ?? "").split("\n").map((line, idx) => ({
        kind: "line",
        value: line,
        animIndex: idx,
    }));
}

function RevealToken({
    value,
    animIndex,
    totalAnimated,
    progress,
    unit,
    content,
}: {
    value: string;
    animIndex: number | null;
    totalAnimated: number;
    progress: MotionValue<number>;
    unit: "Words" | "Letters";
    /** Replaces the word's text (Words mode), e.g. a highlighted link. Must keep the same text. */
    content?: React.ReactNode;
}) {
    const start = animIndex !== null && totalAnimated > 0 ? animIndex / totalAnimated : 0;
    const end = totalAnimated > 0 ? start + 1 / totalAnimated : 1;
    const opacity = useTransform(progress, [start, end], [0, 1]);

    if (animIndex === null || totalAnimated <= 0) {
        if (unit === "Letters") {
            return <span>{value === " " ? " " : value}</span>;
        }
        return <span>{value}</span>;
    }

    return unit === "Letters" ? (
        <motion.span style={{ opacity, display: "inline-block" }}>
            {value === " " ? " " : value}
        </motion.span>
    ) : (
        // inline-block (a word never wraps inside itself, so the layout matches the ghost) lets a
        // caller move each word on its own with a transform; data-reveal-word marks them for that.
        <motion.span data-reveal-word="" style={{ opacity, display: "inline-block" }}>
            {content ?? value}
        </motion.span>
    );
}

function RevealLine({
    line,
    animIndex,
    totalLines,
    progress,
}: {
    line: string;
    animIndex: number;
    totalLines: number;
    progress: MotionValue<number>;
}) {
    const denom = Math.max(1, totalLines);
    const start = animIndex / denom;
    const end = start + 1 / denom;
    const opacity = useTransform(progress, [start, end], [0, 1]);

    return (
        <motion.div style={{ opacity, display: "block" }}>
            {line.length ? line : " "}
        </motion.div>
    );
}

function GhostLayer({
    raw,
    unit,
    textColor,
    ghostColor,
    ghostOpacity,
    textAlign,
}: {
    raw: string;
    unit: RevealUnit;
    textColor: string;
    ghostColor: string;
    ghostOpacity: number;
    textAlign: "left" | "center" | "right";
}) {
    const color = ghostColor || textColor;
    const content =
        unit === "Lines"
            ? raw.split("\n").map((line, i) => (
                  <div key={`g-l-${i}`}>{line.length ? line : " "}</div>
              ))
            : raw.split("\n").map((line, li) => {
                  const safeLine =
                      unit === "Words"
                          ? line.trim()
                              ? line.trim().split(/\s+/).join(" ")
                              : " "
                          : line.length
                            ? line
                            : " ";
                  return (
                      <React.Fragment key={`g-ln-${li}`}>
                          {li > 0 && <br />}
                          {unit === "Letters"
                              ? [...safeLine].map((ch, i) => (
                                    <span key={`g-c-${li}-${i}`}>
                                        {ch === " " ? " " : ch}
                                    </span>
                                ))
                              : safeLine}
                      </React.Fragment>
                  );
              });

    return (
        <div
            aria-hidden="true"
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                pointerEvents: "none",
                opacity: ghostOpacity,
                color,
                whiteSpace: "pre-wrap",
                textAlign,
            }}
        >
            {content}
        </div>
    );
}

export default function StickyScrollRevealText({
    text = `Scroll-synced text reveal.\nWords, letters, or lines.\nSticky layout + alignment.\nNative fonts, canvas preview, ghost layer.`,
    unit = "Words",
    textColor = "#000000",
    sectionHeightVh = 300,
    speed = 1,
    alignY = "Center",
    stickyOffsetPx = 0,
    maxWidth = 900,
    paddingVw = 5,
    wordGapEm = 0.25,
    ghostEnabled = true,
    ghostOpacity = 0.25,
    ghostColor = "rgba(0,0,0,0.35)",
    textAlign = "center",
    className = "",
}: StickyScrollRevealTextProps) {
    const raw = typeof text === "string" ? text : "";
    const containerRef = React.useRef<HTMLElement>(null);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    });

    const progress = useTransform(scrollYProgress, (v) =>
        clamp01(v * (typeof speed === "number" ? speed : 1))
    );

    const justifyContent =
        textAlign === "left"
            ? "flex-start"
            : textAlign === "right"
              ? "flex-end"
              : "center";

    const top =
        alignY === "Top"
            ? `${stickyOffsetPx}px`
            : alignY === "Bottom"
              ? `calc(100vh - ${stickyOffsetPx}px)`
              : `calc(50vh + ${stickyOffsetPx}px)`;

    const transform =
        alignY === "Top"
            ? "translateY(0)"
            : alignY === "Bottom"
              ? "translateY(-100%)"
              : "translateY(-50%)";

    return (
        <section
            ref={containerRef}
            className={className}
            style={{
                position: "relative",
                height: `${sectionHeightVh}vh`,
                overflow: "visible",
            }}
        >
            <div
                style={{
                    position: "sticky",
                    top,
                    transform,
                    padding: `0 ${paddingVw}vw`,
                    display: "flex",
                    justifyContent,
                }}
            >
                <ScrollRevealText
                    text={raw}
                    unit={unit}
                    progress={progress}
                    textColor={textColor}
                    maxWidth={maxWidth}
                    wordGapEm={wordGapEm}
                    ghostEnabled={ghostEnabled}
                    ghostOpacity={ghostOpacity}
                    ghostColor={ghostColor}
                    textAlign={textAlign}
                />
            </div>
        </section>
    );
}

export interface ScrollRevealTextProps {
    text: string;
    unit?: RevealUnit;
    /** 0..1: how much of the text is revealed. */
    progress: MotionValue<number>;
    textColor?: string;
    maxWidth?: number;
    wordGapEm?: number;
    ghostEnabled?: boolean;
    ghostOpacity?: number;
    ghostColor?: string;
    textAlign?: "left" | "center" | "right";
    /**
     * Words mode: return a node to render a word in place of its plain text (keep the same text so
     * it lines up with the ghost layer), or null to leave it as is.
     */
    renderWord?: (word: string, index: number) => React.ReactNode | null;
}

/** The text block alone, revealed by a progress value the caller drives (no sticky layout). */
export function ScrollRevealText({
    text: raw,
    unit = "Words",
    progress,
    textColor = "#000000",
    maxWidth = 900,
    wordGapEm = 0.25,
    ghostEnabled = true,
    ghostOpacity = 0.25,
    ghostColor = "rgba(0,0,0,0.35)",
    textAlign = "center",
    renderWord,
}: ScrollRevealTextProps) {
    const wordOrLetterTokens = React.useMemo(() => {
        if (unit === "Words" || unit === "Letters") {
            return tokenizeWordsOrLetters(raw, unit);
        }
        return [];
    }, [raw, unit]);

    const totalAnimated = React.useMemo(() => {
        let max = -1;
        for (const t of wordOrLetterTokens) {
            if (t.kind === "token" && t.animIndex !== null) {
                max = Math.max(max, t.animIndex);
            }
        }
        return max + 1;
    }, [wordOrLetterTokens]);

    const lineTokens = React.useMemo(() => {
        if (unit === "Lines") return tokenizeLines(raw);
        return [];
    }, [raw, unit]);

    return (
                <div
                    style={{
                        position: "relative",
                        maxWidth,
                        width: "100%",
                        color: textColor,
                        whiteSpace: "pre-wrap",
                        textAlign,
                        ...(unit === "Words" ? { wordSpacing: `${wordGapEm}em` } : null),
                    }}
                >
                    {ghostEnabled && (
                        <GhostLayer
                            raw={raw}
                            unit={unit}
                            textColor={textColor}
                            ghostColor={ghostColor}
                            ghostOpacity={ghostOpacity}
                            textAlign={textAlign}
                        />
                    )}
                    <div style={{ position: "relative" }}>
                        {unit === "Lines"
                            ? lineTokens.map((t, i) => (
                                  <RevealLine
                                      key={`l-${i}`}
                                      line={t.value}
                                      animIndex={t.animIndex}
                                      totalLines={lineTokens.length}
                                      progress={progress}
                                  />
                              ))
                            : wordOrLetterTokens.map((t, i) =>
                                  t.kind === "br" ? (
                                      <br key={`br-${i}`} />
                                  ) : (
                                      <RevealToken
                                          key={`t-${i}`}
                                          value={t.value}
                                          animIndex={t.animIndex}
                                          totalAnimated={totalAnimated}
                                          progress={progress}
                                          unit={unit}
                                          content={
                                              unit === "Words" && t.animIndex !== null
                                                  ? renderWord?.(t.value, t.animIndex) ?? undefined
                                                  : undefined
                                          }
                                      />
                                  )
                              )}
                    </div>
                </div>
    );
}
