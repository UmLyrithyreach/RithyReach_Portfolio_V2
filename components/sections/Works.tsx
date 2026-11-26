"use client";

// Works: the projects from lib/works.ts, one at a time.
// It opens with the shared expand box (components/shared/ExpandSection.tsx), starting as a
// laptop-screen shape (16:10) that grows to fill the screen while the title scales in. Then the
// section pins and each project slides up over the one before, which sinks back and dims (a
// stacked deck). A project shows its screenshot whole (or a phone frame for a mobile app with a
// screenshot) beside its ticket: what it is, when, the stack, what I did, and its links.
// On wide screens a list of the projects on the left shows where you are; clicking one scrolls there.
// Reduced motion: no expand and no pin; the projects are listed one under another.

import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import { motion, useMotionValueEvent, useTransform, type MotionValue } from "framer-motion";
import { ExpandSection } from "@/components/shared/ExpandSection";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { scrollToY } from "@/lib/smooth-scroll";
import { works, type Work } from "@/lib/works";

/** Scroll per project, in viewport heights. */
const SCREENS_PER_WORK = 0.55;
/** The title card plus one card per project. */
const SLIDES = works.length + 1;
/** Each card slides in over this share of its slot; the rest of the slot it holds still. */
const ENTER = 0.6;
/** Timeline units: card i is fully in at t = i; the last one holds for (1 - ENTER) before unpinning. */
const T_END = SLIDES - ENTER;
/** Starts as a laptop screen (16:10). */
const FROM = { wide: { width: "56%", height: "35vw" }, narrow: { width: "88%", height: "55vw" } };

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);

const COUNT_WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];

export default function Works() {
  return (
    <ExpandSection
      id="works"
      labelledBy="wk-head"
      tone="light"
      pinScreens={works.length * SCREENS_PER_WORK + 0.4}
      from={FROM}
    >
      {(progress) => <WorksDeck progress={progress} />}
    </ExpandSection>
  );
}

function WorksDeck({ progress }: { progress: MotionValue<number> }) {
  const reduceMotion = usePrefersReducedMotion();
  const deckRef = useRef<HTMLDivElement>(null);
  const t = useTransform(progress, (p) => p * T_END);
  const [active, setActive] = useState(0);
  useMotionValueEvent(t, "change", (v) => {
    // A card counts as current once it is halfway in.
    const next = Math.min(SLIDES - 1, Math.max(0, Math.floor(v + ENTER / 2)));
    setActive((a) => (a === next ? a : next));
  });

  // Jump to a card: the pinned stretch maps linearly to t, so card i is at i / T_END of it.
  const goTo = (slide: number) => {
    const section = deckRef.current?.closest("section");
    if (!section) return;
    const top = section.getBoundingClientRect().top + window.scrollY;
    const pinLength = section.offsetHeight - window.innerHeight;
    scrollToY(top + (slide / T_END) * pinLength + 2);
  };

  if (reduceMotion) {
    return (
      <div className="wk-list">
        <TitleCard />
        {works.map((work) => (
          <WorkCard key={work.id} work={work} />
        ))}
      </div>
    );
  }

  return (
    <div ref={deckRef} className="wk-deck" data-started={active > 0 || undefined}>
      <nav className="wk-index" aria-label="Projects">
        <ol>
          {works.map((work, i) => (
            <li key={work.id}>
              <button type="button" aria-current={active === i + 1 ? "step" : undefined} onClick={() => goTo(i + 1)}>
                <span>{work.title}</span>
                <span className="wk-index-date">{work.date}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>
      <div className="wk-stack">
        {Array.from({ length: SLIDES }, (_, i) => (
          <Slide key={i} index={i} t={t} hidden={i !== active}>
            {i === 0 ? <TitleCard /> : <WorkCard work={works[i - 1]} />}
          </Slide>
        ))}
      </div>
    </div>
  );
}

/** One card of the deck: slides up into place, then sinks back and dims as the next one covers it. */
function Slide({ index, t, hidden, children }: { index: number; t: MotionValue<number>; hidden: boolean; children: ReactNode }) {
  const y = useTransform(t, (v) => (index === 0 ? "0%" : `${100 * (1 - clamp01((v - (index - ENTER)) / ENTER))}%`));
  const covered = useTransform(t, (v) => clamp01((v - (index + 1 - ENTER)) / ENTER));
  const scale = useTransform(covered, [0, 1], [1, 0.93]);
  const dim = useTransform(covered, [0, 1], [0, 0.55]);
  return (
    // The wrapper stays hit-testable even while its content is inert, so a click on a card that is
    // still sliding in lands on it (and does nothing) instead of falling through to the card below.
    <motion.div className="wk-slide" style={{ y, scale, zIndex: index + 1 }} aria-hidden={hidden || undefined}>
      <div className="wk-slide-content" inert={hidden}>
        {children}
      </div>
      <motion.div className="wk-slide-dim" style={{ opacity: dim }} aria-hidden="true" />
    </motion.div>
  );
}

function TitleCard() {
  return (
    <div className="wk-title">
      <div data-expand-heading>
        <h2 id="wk-head">
          Selected
          <br />
          work.
        </h2>
        <p>
          {COUNT_WORDS[works.length] ?? works.length} projects, newest first: Flutter apps, full-stack web apps and the team work behind them.
        </p>
      </div>
    </div>
  );
}

function WorkCard({ work }: { work: Work }) {
  const { shot } = work;
  return (
    <article className={`wk-card${shot ? "" : " wk-card--text"}`} aria-labelledby={`work-${work.id}`}>
      {shot && (
        <div
          className={`wk-shot wk-shot--${shot.kind}`}
          style={{ aspectRatio: `${shot.width} / ${shot.height}`, "--shot-ratio": shot.width / shot.height } as CSSProperties}
        >
          <Image
            src={shot.src}
            alt={`${work.title} screenshot`}
            fill
            sizes={shot.kind === "phone" ? "(min-width: 1024px) 20vw, 40vw" : "(min-width: 1024px) 50vw, 92vw"}
            className="object-contain"
          />
        </div>
      )}
      <div className="wk-ticket">
        <p className="wk-meta">
          {work.context}, {work.date}
        </p>
        <h3 id={`work-${work.id}`}>{work.title}</h3>
        <p className="wk-summary">{work.summary}</p>
        <h4>{work.pointsAre === "did" ? "What I did" : "What it does"}</h4>
        <ul>
          {work.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
        <p className="wk-stack-line">
          <span>{work.platform}.</span> Built with {work.stack.join(", ")}.
        </p>
        {(work.live || work.code) && (
          <p className="wk-links">
            {work.live && (
              <a href={work.live} target="_blank" rel="noreferrer">
                Visit site
              </a>
            )}
            {work.code && (
              <a href={work.code} target="_blank" rel="noreferrer">
                View code
              </a>
            )}
          </p>
        )}
      </div>
    </article>
  );
}
