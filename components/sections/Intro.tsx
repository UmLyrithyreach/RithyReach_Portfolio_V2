"use client";

// About me, in a pinned stage, told over two screens of scroll and ending in a fall.
// The section overlaps the hero's pinned scroll (globals.css), so the stage is pinned from the very
// first pixel and never moves vertically until it unpins. The CADT photo stays on the right the
// whole time; the left column holds two panels on a track that scrolls up 1:1 with the page, so
// moving from panel 1 to panel 2 feels like ordinary scrolling.
// On one scroll timeline, in viewport heights of page scroll (a, the same clock as the hero's exit):
//   0.45 -> 0.65 the stage slides in from the right under the HELLO sweep, as the hero fades;
//   0.8 -> 1.8   the "ABOUT" box, styled like the expand boxes (ExpandSection.tsx): a dark box
//                slides in from the right as the HELLO sweep leaves, grows from 75% x 60% to fill
//                the screen with "ABOUT" scaling up inside, then slides off to the left onto
//                panel 1 (everything below is pushed back by ABOUT_LEN);
//   0.75 -> 1.35 panel 1 ("who I am"): the headline fills in word by word from its faint ghost,
//                the CADT photo settles in with the word "CADT", then the paragraph fades up;
//   1.6 -> 2.6   the track scrolls one screen: panel 1 leaves upward, panel 2 comes up under it;
//   2.2 -> 3.0   panel 2 ("how I work"): its headline fills in, then the three columns rise in turn;
//   3.1 -> 3.8   panel 2 holds, fully shown, so there is time to read it;
//   3.8          the headline of panel 2 and the photo fall apart with rigid-body physics
//                (lib/word-fall.ts) and pile up on the floor; the small text fades out instead;
//   4.3          the stage unpins and scrolls away with the pile, while the expertise section
//                (Expertise.tsx) comes in under it.
// The page is never held: scrolling back above the fall point plays the fall in reverse.
// "CADT" is highlighted: hovering (or focusing) it lifts a photo of the school above the word.
// Reduced motion: no slide, no track, no fall; both panels are shown in order, whole.
// Edit PANELS to change the words. The photo is public/image/cadt-building.webp.

import { useEffect, useRef, type CSSProperties } from "react";
import Image from "next/image";
import { motion, useMotionValue, useScroll, useTransform, type MotionValue } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { createWordFall, type FallItem } from "@/lib/word-fall";
import { ScrollRevealText } from "@/components/ui/sticky-scroll-reveal-text";
import { smoothstep, viewportHeight } from "@/lib/scroll-math";

export const PANELS = {
  who: {
    eyebrow: "01 — About",
    headline: "A software engineering student at CADT.",
    body:
      "I'm Reach, studying software engineering at the Cambodia Academy of Digital Technology in Phnom Penh. " +
      "Most of my time goes into building things for real: class projects, side projects, and anything that teaches me a new part of the stack.",
  },
  how: {
    eyebrow: "02 — How I work",
    headline: "I build full-stack apps and sweat the small details.",
    columns: [
      { title: "Front end", text: "React and Next.js interfaces, with motion that feels considered rather than decorative." },
      { title: "Back end", text: "Node.js APIs and PostgreSQL schemas that stay simple as the app grows." },
      { title: "Craft", text: "Fast loads, accessible markup, and the small touches that make a site feel alive." },
    ],
  },
};
/** Kept for anything that still reads the old one-block message. */
export const ABOUT_ME = `${PANELS.who.headline}\n${PANELS.how.headline}`;

const SCHOOL = {
  short: "CADT",
  name: "Cambodia Academy of Digital Technology",
  place: "Phnom Penh, Cambodia",
  photo: "/image/cadt-building.webp",
};

// The timeline (see the header).
const SLIDE_FROM = 0.45;
const SLIDE_TO = 0.65;
/** The "ABOUT" title card: held while the stage arrives, then it expands past the viewer. */
const ABOUT_IN_FROM = 0.8; // slides in from the right; the HELLO sweep (HelloSweep.tsx) is gone by 1.0
const ABOUT_IN_TO = 1.0;
const ABOUT_GROW_FROM = 1.0; // 75% x 60% -> full screen
const ABOUT_GROW_TO = 1.5;
const ABOUT_OUT_FROM = 1.6; // slides off to the left, uncovering panel 1
const ABOUT_OUT_TO = 1.85;
/** Everything after the title card is pushed back by this much scroll. */
const ABOUT_LEN = 1.05;
const T1_FROM = 0.75 + ABOUT_LEN;
const T1_TO = 1.35 + ABOUT_LEN;
const BODY1_FROM = 1.15 + ABOUT_LEN;
const BODY1_TO = 1.45 + ABOUT_LEN;
const TRACK_FROM = 1.6 + ABOUT_LEN;
const TRACK_TO = 2.6 + ABOUT_LEN; // exactly one viewport of scroll: the track moves at page speed
const T2_FROM = 2.2 + ABOUT_LEN;
const T2_TO = 2.75 + ABOUT_LEN;
const COLS_FROM = 2.55 + ABOUT_LEN;
const COL_STEP = 0.12;
const COL_LEN = 0.3;
/** Panel 2 is fully shown by ~3.1; it then holds, fully readable, for ~0.7 screen of scroll before it falls. */
const FALL_AT = 3.8 + ABOUT_LEN;
/** Scroll back this far above FALL_AT to bring the message back (so it never flickers at the edge). */
const REBUILD_GAP = 0.08;
/** The pile stays pinned this much longer (viewport heights of scroll), then the stage scrolls away. */
const END = FALL_AT + 0.5;
/** The section is one viewport taller than its pinned run. */
const SECTION_VH = (END + 1) * 100;

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);
const ramp = (from: number, to: number) => (v: number) => clamp01((v - from) / (to - from));

// Where "CADT" sits among panel 1's words, so the photo on the right arrives with it.
const WORDS_1 = PANELS.who.headline.trim().split(/\s+/);
const SCHOOL_WORD = Math.max(0, WORDS_1.findIndex((w) => w.startsWith(SCHOOL.short)));
const PHOTO_TILT_DEG = 2;

/** "CADT." -> the highlighted word, with its trailing punctuation left plain. */
function SchoolWord({ word }: { word: string }) {
  const rest = word.slice(SCHOOL.short.length);
  return (
    <>
      <span className="intro-school" tabIndex={0}>
        {SCHOOL.short}
        <span className="vh"> ({SCHOOL.name})</span>
        <span className="intro-school-pop" aria-hidden="true">
          <span className="intro-school-shot">
            <Image src={SCHOOL.photo} alt="" fill sizes="320px" />
          </span>
          <span className="intro-school-caption">
            <b>{SCHOOL.name}</b>
            <span>{SCHOOL.place}</span>
          </span>
        </span>
      </span>
      {rest}
    </>
  );
}

/** Fades and lifts in as `progress` goes 0 -> 1. */
function Rise({ progress, className, children }: { progress: MotionValue<number>; className?: string; children: React.ReactNode }) {
  const y = useTransform(progress, [0, 1], ["1.25rem", "0rem"]);
  return (
    <motion.div className={className} style={{ opacity: progress, y }}>
      {children}
    </motion.div>
  );
}

function Column({ a, index, reduce, title, text }: { a: MotionValue<number>; index: number; reduce: boolean; title: string; text: string }) {
  const shown = useMotionValue(1);
  const from = COLS_FROM + index * COL_STEP;
  const p = useTransform(a, ramp(from, from + COL_LEN));
  return (
    <Rise progress={reduce ? shown : p} className="intro-col">
      <span className="intro-col-num" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
      <h4 className="intro-col-title">{title}</h4>
      <p className="intro-col-text">{text}</p>
    </Rise>
  );
}

export default function Intro() {
  const stageRef = useRef<HTMLDivElement>(null);
  const panel2Ref = useRef<HTMLDivElement>(null);
  const photoBodyRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLElement>(null);
  const reduceMotion = usePrefersReducedMotion();

  const { scrollY } = useScroll();
  const a = useTransform(scrollY, (y) => y / viewportHeight());

  const x = useTransform(a, (v) => `${100 * (1 - smoothstep(SLIDE_FROM, SLIDE_TO, v))}vw`);
  // One panel is half the track: -50% moves panel 2 into view.
  const trackY = useTransform(a, (v) => `${-50 * clamp01((v - TRACK_FROM) / (TRACK_TO - TRACK_FROM))}%`);

  // Reduced motion: everything is shown at once.
  const shown = useMotionValue(1);
  const t1 = useTransform(a, ramp(T1_FROM, T1_TO));
  const body1 = useTransform(a, ramp(BODY1_FROM, BODY1_TO));
  const t2 = useTransform(a, ramp(T2_FROM, T2_TO));
  const eyebrow2 = useTransform(a, ramp(T2_FROM - 0.15, T2_FROM + 0.1));
  const text1 = reduceMotion ? shown : t1;
  const text2 = reduceMotion ? shown : t2;

  // The title card: in from the right, grow to full screen (the box's size, corners and the word's
  // scale all read --about-grow in globals.css), then out to the left.
  const aboutGrow = useTransform(a, ramp(ABOUT_GROW_FROM, ABOUT_GROW_TO));
  const aboutX = useTransform(a, (v) => {
    const inP = smoothstep(ABOUT_IN_FROM, ABOUT_IN_TO, v);
    const outP = smoothstep(ABOUT_OUT_FROM, ABOUT_OUT_TO, v);
    return `${100 * (1 - inP) - 100 * outP}vw`;
  });
  // The cream backdrop hides panel 1 until the box covers the screen, so the box slides off onto it.
  const aboutBackdrop = useTransform(a, (v) => (v < ABOUT_GROW_TO ? 1 : 0));
  const aboutCue = useTransform(aboutGrow, [0, 0.15], [1, 0]);

  // The photo settles in as "CADT" is revealed, and stays for both panels.
  const photoIn = useTransform(text1, [SCHOOL_WORD / WORDS_1.length, Math.min(1, (SCHOOL_WORD + 1) / WORDS_1.length)], [0, 1]);
  const photoY = useTransform(photoIn, [0, 1], ["2.5rem", "0rem"]);
  const photoRotate = useTransform(photoIn, [0, 1], [6, PHOTO_TILT_DEG]);

  // The fall, driven by the scroll crossing FALL_AT:
  //   text   -> fallen  scrolled past FALL_AT: drop panel 2's headline words and the photo;
  //   fallen -> text    scrolled back above it: play the fall in reverse.
  useEffect(() => {
    const stage = stageRef.current;
    const panel2 = panel2Ref.current;
    if (reduceMotion || !stage || !panel2) return;
    const fall = createWordFall(stage, () => {
      const items: FallItem[] = Array.from(panel2.querySelectorAll<HTMLElement>("[data-reveal-word]")).map((el) => ({ el }));
      const body = photoBodyRef.current;
      const photo = photoRef.current;
      if (body && photo) {
        items.push({ el: body, angle: (PHOTO_TILT_DEG * Math.PI) / 180, size: { width: photo.offsetWidth, height: photo.offsetHeight } });
      }
      return items;
    });

    let fallen = false;
    // data-fallen hides the ghost text, the small print and the CADT hover card while the words are down.
    const setFallen = (on: boolean) => {
      fallen = on;
      if (on) stage.dataset.fallen = "";
      else delete stage.dataset.fallen;
    };
    const onScroll = (v: number) => {
      if (v >= FALL_AT && !fallen) {
        setFallen(true);
        fall.fall();
      } else if (v < FALL_AT - REBUILD_GAP && fallen) {
        setFallen(false);
        fall.restore();
      }
    };

    onScroll(a.get());
    const unsubscribe = a.on("change", onScroll);
    return () => {
      unsubscribe();
      fall.destroy();
      setFallen(false);
    };
  }, [reduceMotion, a]);

  const revealProps = {
    unit: "Words" as const,
    maxWidth: 1100,
    wordGapEm: 0.12,
    textColor: "var(--raw-color-ink-950)",
    ghostColor: "var(--raw-color-ink-950)",
    ghostOpacity: 0.12,
    textAlign: "left" as const,
  };

  return (
    <section
      id="intro"
      aria-labelledby="intro-head"
      className="intro"
      style={{ "--intro-h": `${SECTION_VH}dvh` } as CSSProperties}
    >
      <h2 id="intro-head" className="vh">About me</h2>
      <motion.div ref={stageRef} className="intro-stage" style={{ x: reduceMotion ? 0 : x }}>
        <div className="intro-content">
          <div className="intro-viewport">
            <motion.div className="intro-track" style={{ y: reduceMotion ? 0 : trackY }}>
              {/* Panel 1: who I am */}
              <div className="intro-panel">
                <Rise progress={text1} className="intro-eyebrow">{PANELS.who.eyebrow}</Rise>
                <div className="intro-reveal" role="heading" aria-level={3}>
                  <ScrollRevealText
                    {...revealProps}
                    text={PANELS.who.headline}
                    progress={text1}
                    renderWord={(word) => (word.startsWith(SCHOOL.short) ? <SchoolWord word={word} /> : null)}
                  />
                </div>
                <Rise progress={reduceMotion ? shown : body1} className="intro-body">
                  <p>{PANELS.who.body}</p>
                </Rise>
              </div>

              {/* Panel 2: how I work. Its headline falls apart at the end. */}
              <div ref={panel2Ref} className="intro-panel">
                <Rise progress={reduceMotion ? shown : eyebrow2} className="intro-eyebrow intro-fades">{PANELS.how.eyebrow}</Rise>
                <div className="intro-reveal" role="heading" aria-level={3}>
                  <ScrollRevealText {...revealProps} text={PANELS.how.headline} progress={text2} />
                </div>
                <div className="intro-cols intro-fades">
                  {PANELS.how.columns.map((c, i) => (
                    <Column key={c.title} a={a} index={i} reduce={reduceMotion} title={c.title} text={c.text} />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          <div ref={photoBodyRef} className="intro-photo-body">
            <motion.figure ref={photoRef} className="intro-photo" style={{ opacity: photoIn, y: photoY, rotate: photoRotate }}>
              <span className="intro-photo-frame">
                <Image src={SCHOOL.photo} alt={`${SCHOOL.name} building`} fill sizes="(min-width: 900px) 34vw, 60vw" />
              </span>
              <figcaption>
                <b>{SCHOOL.short}</b> · {SCHOOL.place}
              </figcaption>
            </motion.figure>
          </div>
        </div>

        {!reduceMotion && (
          <div className="intro-about" aria-hidden="true">
            <motion.div className="intro-about-backdrop" style={{ opacity: aboutBackdrop }} />
            <motion.div className="intro-about-box" style={{ x: aboutX, "--about-grow": aboutGrow } as unknown as CSSProperties}>
              <span className="intro-about-word">About</span>
              <motion.span className="intro-about-cue" style={{ opacity: aboutCue }}>
                Keep scrolling
              </motion.span>
            </motion.div>
          </div>
        )}
      </motion.div>
    </section>
  );
}
