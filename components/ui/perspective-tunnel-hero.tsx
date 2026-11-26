"use client";

// A 3D corridor of cards flying from the far distance past the camera as `progress` runs 0 -> 1,
// with a centred title that grows and fades through it and a little pointer parallax.
//
// Adapted from the 21st.dev "perspective tunnel hero" for this site:
// - progress can be driven from outside (Expertise.tsx feeds it the page scroll of a pinned
//   section), so it never hijacks the wheel. Without it, the wheel drives it locally but lets the
//   page scroll on once the tunnel reaches either end, so it can never trap the visitor.
// - items, eyebrow, title and subtitle are props; the title is an <h2> (the page keeps one <h1>).
// - the stage is measured from the container, not the window; colours come from the site tokens,
//   each overridable with a --tunnel-* custom property set on an ancestor (Expertise.tsx does).
// - with external progress the title starts at full size and grows on from there, so a parent
//   can animate it in first (Expertise.tsx scales it from 0.6 while the section expands).
// - reduced motion: no flight and no parallax, the cards are laid out as a plain grid.

import {
    motion,
    useTransform,
    useMotionValue,
    useSpring,
    type MotionValue,
} from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";

/**
 * A card in the tunnel: either a picture shown whole at its own aspect ratio (never cropped),
 * with a short caption under it, or a text card.
 */
export type TunnelItem =
    | {
          kind: "image";
          src: string;
          /** The image's own pixel size, so the card takes its exact shape. */
          width: number;
          height: number;
          title: string;
          meta?: string;
          /** Alt text; defaults to the title. */
          alt?: string;
      }
    | { kind: "text"; title: string; body: string; meta?: string };

const itemKey = (item: TunnelItem) => (item.kind === "image" ? item.src : `text:${item.title}`);

interface TunnelCardData {
    item: TunnelItem;
    angleCos: number;
    angleSin: number;
    radiusFactorX: number;
    radiusFactorY: number;
    rotationZ: number;
    index: number;
}

function layoutCards(items: TunnelItem[]): TunnelCardData[] {
    return items.map((item, i) => {
        const goldenAngle = i * 137.5 * (Math.PI / 180);
        return {
            item,
            angleCos: Math.cos(goldenAngle),
            angleSin: Math.sin(goldenAngle),
            radiusFactorX: 0.28 + (i % 3) * 0.08,
            radiusFactorY: 0.26 + (i % 2) * 0.09,
            rotationZ: (i % 2 === 0 ? 1 : -1) * (3 + (i % 5) * 2),
            index: i,
        };
    });
}

const SPRING_CONFIG = { stiffness: 60, damping: 25, mass: 0.5 };

interface StageDimensions {
    width: number;
    height: number;
    isMobile: boolean;
}

function useCameraParallax(enabled: boolean) {
    const rawX = useMotionValue(0);
    const rawY = useMotionValue(0);
    const x = useSpring(rawX, SPRING_CONFIG);
    const y = useSpring(rawY, SPRING_CONFIG);

    useEffect(() => {
        if (!enabled) return;
        const onMove = (e: PointerEvent) => {
            if (e.pointerType !== "mouse") return;
            rawX.set((e.clientX / window.innerWidth - 0.5) * 2);
            rawY.set((e.clientY / window.innerHeight - 0.5) * 2);
        };
        window.addEventListener("pointermove", onMove, { passive: true });
        return () => window.removeEventListener("pointermove", onMove);
    }, [enabled, rawX, rawY]);

    return { x, y };
}

interface TunnelCardProps {
    card: TunnelCardData;
    progress: MotionValue<number>;
    pointer: { x: MotionValue<number>; y: MotionValue<number> };
    total: number;
    stage: StageDimensions;
}

function TunnelCard({ card, progress, pointer, total, stage }: TunnelCardProps) {
    const staggerSpan = 0.55;
    const start = (card.index / total) * (1 - staggerSpan);
    const end = start + staggerSpan;

    const localProgress = useTransform(progress, [start, end], [0, 1]);

    const farZ = stage.isMobile ? -1200 : -1700;
    const nearZ = stage.isMobile ? 350 : 500;
    const z = useTransform(localProgress, [0, 1], [farZ, nearZ]);

    const opacity = useTransform(localProgress, [0, 0.18, 0.82, 0.98], [0, 1, 1, 0]);
    // Cards past the camera or not yet in view are hidden outright, so they cost nothing to paint.
    const visibility = useTransform(localProgress, (v) => (v <= 0 || v >= 0.98 ? "hidden" : "visible"));

    // Pictures are landscape, so they get more width than the text cards.
    const wide = card.item.kind === "image";
    const cardWidth = stage.isMobile
        ? Math.max(150, Math.min(wide ? 240 : 190, stage.width * (wide ? 0.5 : 0.42)))
        : Math.max(wide ? 240 : 200, Math.min(wide ? 380 : 280, stage.width * (wide ? 0.24 : 0.18)));

    const baseX = card.angleCos * (stage.width * card.radiusFactorX);
    const baseY = card.angleSin * (stage.height * card.radiusFactorY);
    const panStrength = stage.isMobile ? 20 : 45;

    const transform = useTransform(
        [z, pointer.x, pointer.y],
        ([currZ, px, py]: number[]) => {
            const offsetX = baseX - px * panStrength;
            const offsetY = baseY - py * panStrength;
            return `translate3d(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px), ${currZ}px) rotateZ(${card.rotationZ}deg)`;
        }
    );

    return (
        <motion.li
            style={{ width: cardWidth, transform, opacity, visibility, zIndex: card.index + 1 }}
            className="absolute left-1/2 top-1/2 list-none will-change-transform select-none [container-type:inline-size]"
        >
            <TunnelCardFace item={card.item} sizes={`${Math.round(cardWidth * 1.6)}px`} />
        </motion.li>
    );
}

// Card faces. Sizes inside use cqw (the card's own width), so text scales with the card.
const CARD_FRAME =
    "rounded-[1rem] border border-[var(--tunnel-card-ring,rgb(9_10_11/0.1))] bg-[var(--tunnel-card,var(--raw-color-cream-200))] shadow-[0_1.5rem_3rem_rgb(0_0_0/0.35)]";

function TunnelCardFace({ item, sizes }: { item: TunnelItem; sizes: string }) {
    if (item.kind === "image") {
        return (
            <figure className={`m-0 p-[2.4cqw] ${CARD_FRAME}`}>
                <div
                    className="relative w-full overflow-hidden rounded-[0.6rem]"
                    style={{ aspectRatio: `${item.width} / ${item.height}` }}
                >
                    <Image
                        src={item.src}
                        alt={item.alt ?? item.title}
                        fill
                        sizes={sizes}
                        draggable={false}
                        className="object-contain"
                    />
                </div>
                <figcaption className="flex items-baseline justify-between gap-[3cqw] px-[1.6cqw] pb-[0.6cqw] pt-[3cqw]">
                    <span className="text-[max(12px,4.6cqw)] font-medium leading-tight text-[var(--tunnel-ink,var(--raw-color-ink-950))]">
                        {item.title}
                    </span>
                    {item.meta && (
                        <span className="text-right text-[max(10px,3.4cqw)] leading-tight text-[var(--tunnel-muted,var(--raw-color-slate-600))]">
                            {item.meta}
                        </span>
                    )}
                </figcaption>
            </figure>
        );
    }
    return (
        <article className={`px-[7cqw] pb-[6.5cqw] pt-[7.5cqw] ${CARD_FRAME}`}>
            <h3 className="m-0 font-[family-name:var(--font-playfair)] text-[max(16px,11.5cqw)] font-normal leading-[1.02] tracking-[-0.01em] text-[var(--tunnel-ink,var(--raw-color-ink-950))]">
                {item.title}
            </h3>
            <p className="mt-[4.5cqw] text-[max(11px,5.3cqw)] leading-[1.45] text-[var(--tunnel-muted,var(--raw-color-slate-600))]">
                {item.body}
            </p>
            {item.meta && (
                <p className="mt-[6cqw] border-t border-[var(--tunnel-card-ring,rgb(9_10_11/0.1))] pt-[4cqw] text-[max(10px,4.4cqw)] leading-snug text-[var(--tunnel-muted,var(--raw-color-slate-600))]">
                    {item.meta}
                </p>
            )}
        </article>
    );
}

export interface PerspectiveTunnelHeroProps {
    items: TunnelItem[];
    /** 0..1 travel through the tunnel. Omit it to drive the tunnel with the wheel inside the box. */
    progress?: MotionValue<number>;
    eyebrow?: ReactNode;
    title?: ReactNode;
    subtitle?: ReactNode;
    /** Shown at the bottom until the visitor starts travelling. */
    prompt?: ReactNode;
    headingId?: string;
    className?: string;
}

export default function PerspectiveTunnelHero({
    items,
    progress: externalProgress,
    eyebrow = "Warp Drive Sequence",
    title = (
        <>
            Into the
            <br />
            ether.
        </>
    ),
    subtitle = "Scroll your trackpad or mouse wheel to fly through the spatial 3D corridor.",
    prompt = "Scroll to explore",
    headingId,
    className = "",
}: PerspectiveTunnelHeroProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const reduce = usePrefersReducedMotion();
    const cards = layoutCards(items);

    const [stage, setStage] = useState<StageDimensions>({ width: 1440, height: 900, isMobile: false });

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const update = () => {
            const width = el.clientWidth || window.innerWidth;
            const height = el.clientHeight || window.innerHeight;
            setStage((s) =>
                s.width === width && s.height === height ? s : { width, height, isMobile: width < 768 }
            );
        };
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, [reduce]);

    // Local, wheel-driven progress: only used when no progress is passed in.
    const rawProgress = useMotionValue(0);
    const localProgress = useSpring(rawProgress, { stiffness: 80, damping: 30, restDelta: 0.0001 });
    const progress = externalProgress ?? localProgress;

    useEffect(() => {
        const el = containerRef.current;
        if (!el || externalProgress || reduce) return;
        const handleWheel = (e: WheelEvent) => {
            const current = rawProgress.get();
            // At either end, let the page scroll on instead of swallowing the wheel.
            if ((current <= 0 && e.deltaY < 0) || (current >= 1 && e.deltaY > 0)) return;
            e.preventDefault();
            rawProgress.set(Math.min(1, Math.max(0, current + e.deltaY * 0.0008)));
        };
        el.addEventListener("wheel", handleWheel, { passive: false });
        return () => el.removeEventListener("wheel", handleWheel);
    }, [externalProgress, rawProgress, reduce]);

    const pointer = useCameraParallax(!reduce);

    const external = externalProgress !== undefined;
    const titleScale = useTransform(progress, [0, 0.5, 1], external ? [1, 1.15, 1.35] : [0.7, 1, 1.35]);
    const titleOpacity = useTransform(progress, [0, 0.12, 0.85, 1], [external ? 1 : 0.25, 1, 1, 0]);
    const promptOpacity = useTransform(progress, [0, 0.12], [1, 0]);

    const heading = (
        <>
            {eyebrow && (
                <p className="mb-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.4em] text-[var(--tunnel-accent,var(--raw-color-green-700))]">
                    {eyebrow}
                </p>
            )}
            <h2
                id={headingId}
                className="font-[family-name:var(--font-display)] text-5xl font-semibold uppercase leading-[0.9] tracking-tight text-[var(--tunnel-ink,var(--raw-color-ink-950))] sm:text-7xl md:text-8xl"
            >
                {title}
            </h2>
            {subtitle && (
                <p className="mt-4 max-w-[36ch] text-sm text-[var(--tunnel-muted,var(--raw-color-slate-600))] sm:text-base">{subtitle}</p>
            )}
        </>
    );

    if (reduce) {
        return (
            <div className={`relative w-full bg-[var(--tunnel-bg,var(--background))] px-4 py-24 sm:px-[5vw] ${className}`}>
                <div className="mx-auto mb-12 flex max-w-xl flex-col items-center text-center">{heading}</div>
                <ul className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((item) => (
                        <li key={itemKey(item)} className="[container-type:inline-size]">
                            <TunnelCardFace item={item} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw" />
                        </li>
                    ))}
                </ul>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={`relative flex h-[100svh] w-full select-none items-center justify-center overflow-hidden bg-[var(--tunnel-bg,var(--background))] text-[var(--tunnel-ink,var(--raw-color-ink-950))] ${className}`}
            style={{ perspective: stage.isMobile ? "900px" : "1200px", transformStyle: "preserve-3d" }}
        >
            {/* Dot grid and a faint green glow */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(var(--tunnel-dot,rgb(9_10_11/0.14))_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_60%,transparent_100%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tunnel-glow,rgb(31_209_107/0.12))_0%,transparent_70%)]" />

            {/* Depth ring guides */}
            <div className="pointer-events-none absolute h-[48vmin] w-[48vmin] rounded-full border border-[var(--tunnel-ring,rgb(11_122_59/0.2))]" />
            <div className="pointer-events-none absolute h-[76vmin] w-[76vmin] rounded-full border border-dashed border-[var(--tunnel-ring-dashed,var(--raw-color-cream-300))]" />

            {/* Centre title */}
            <motion.div
                style={{ scale: titleScale, opacity: titleOpacity }}
                className="pointer-events-none z-0 flex max-w-xl flex-col items-center px-6 text-center"
            >
                {/* A hook for a parent to scale the heading in, separate from the flight's own scale. */}
                <div data-expand-heading className="flex flex-col items-center">
                    {heading}
                </div>
            </motion.div>

            {/* Scroll prompt */}
            {prompt && (
                <motion.div
                    aria-hidden="true"
                    style={{ opacity: promptOpacity }}
                    className="pointer-events-none absolute bottom-8 z-20 flex flex-col items-center gap-2 text-sm text-[var(--tunnel-muted,var(--raw-color-slate-600))]"
                >
                    <span>{prompt}</span>
                    <div className="h-6 w-px bg-gradient-to-b from-[var(--tunnel-accent,var(--raw-color-green-700))] to-transparent" />
                </motion.div>
            )}

            {/* 3D z-space plane */}
            <ul className="pointer-events-none absolute inset-0 m-0 p-0" style={{ transformStyle: "preserve-3d" }}>
                {cards.map((card) => (
                    <TunnelCard
                        key={itemKey(card.item)}
                        card={card}
                        progress={progress}
                        pointer={pointer}
                        total={cards.length}
                        stage={stage}
                    />
                ))}
            </ul>
        </div>
    );
}
