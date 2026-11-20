"use client";

// Section #works: a scroll-pinned project overview. The layout, motion and type are the Adaline
// feature overview's (tabs with spinning icons and progress ticks, sticky text column, one graphic per
// step); the content is this portfolio's projects from lib/data. Tokens live in app/adaline.css.

import * as React from "react";
import {
  AnimatePresence,
  animate,
  cubicBezier,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
  type Variants,
} from "framer-motion";
import { projects, type Project } from "@/lib/data";

/* ---------------------------------------------------------------- easings */

const EASE_OUT: [number, number, number, number] = [0.39, 0.08, 0.18, 0.95];
const EASE_IN: [number, number, number, number] = [0.74, 0.02, 0.7, 0.43];
const EASE_W5: [number, number, number, number] = [0.63, 0, 0.13, 0.99];
const EASE_STRONG: [number, number, number, number] = [0.4, 0, 0.1, 1];
const EASE_MEDIUM: [number, number, number, number] = [0.3, 0, 0.25, 1];
const EASE_UI = { duration: 0.3, ease: [0.15, 0.8, 0.3, 1] as [number, number, number, number] };
const EASE_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

const POP: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: EASE_OUT } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.3, ease: EASE_IN } },
};

const cn = (...a: Array<string | false | null | undefined>) => a.filter(Boolean).join(" ");
const clamp = (min: number, max: number, v: number) => Math.max(min, Math.min(max, v));

/* ---------------------------------------------------------------- content */

type GraphicKind = "screen" | "stack" | "tree";
type Highlight = { title: string; description: string; graphic: GraphicKind };
type Work = { project: Project; label: string; highlights: Highlight[] };

/** Short tab labels and three highlights per project, written from each project's features. */
const WORK_COPY: Record<string, { label: string; highlights: Highlight[] }> = {
  "asip-redesign": {
    label: "ASIP",
    highlights: [
      { title: "Interactive SVG of Angkor Wat", graphic: "screen",
        description: "A hand-built vector illustration of Angkor Wat with hover states and animation, the centrepiece of the redesigned landing page." },
      { title: "Parallax and orbiting galleries", graphic: "stack",
        description: "GSAP ScrollTrigger drives 3D parallax scenes and a ribbon-style photo gallery that orbits with the mouse, smoothed out by Lenis." },
      { title: "Mobile-first and tested", graphic: "tree",
        description: "A responsive, mobile-first layout with modern CSS typography, checked end to end with Playwright." },
    ],
  },
  "automata-simulation": {
    label: "Automata",
    highlights: [
      { title: "DFA and NFA in one tool", graphic: "screen",
        description: "Create, edit and test deterministic and non-deterministic finite automata in the browser." },
      { title: "Live visualisation", graphic: "stack",
        description: "See how an automaton behaves in real time as you build it and run input through it." },
      { title: "Full stack, JSON export", graphic: "tree",
        description: "Models export as JSON files. React and Vite on the front end; Express, SQLite and C++ behind it." },
    ],
  },
  "samki-digital-market": {
    label: "Samki",
    highlights: [
      { title: "Multi-vendor marketplace", graphic: "screen",
        description: "Sellers onboard through an approval flow, then manage their shops while orders are tracked from purchase to delivery." },
      { title: "Stripe and Bakong KHQR", graphic: "stack",
        description: "Two payment rails, card and KHQR, with automated seller payouts after a configurable hold period." },
      { title: "AI assistant, two languages", graphic: "tree",
        description: "An AI shopping assistant searches products and looks up orders. The store runs in English or Khmer, in USD or KHR, and pings sellers on Telegram." },
    ],
  },
  "portfolio-2": {
    label: "Portfolio",
    highlights: [
      { title: "My previous portfolio", graphic: "screen",
        description: "A modern, responsive portfolio built with Next.js and TypeScript, with a clean and simple interface." },
      { title: "Motion with Framer Motion", graphic: "stack",
        description: "Animations built with Framer Motion on top of a Tailwind CSS design." },
      { title: "Shipped on Vercel", graphic: "tree",
        description: "Hosted on Vercel for fast, scalable deployment." },
    ],
  },
  khodkquiz: {
    label: "KhodKquiz",
    highlights: [
      { title: "Quizzes with roles", graphic: "screen",
        description: "Role-based access control, with an administrative dashboard for running the platform." },
      { title: "Real-time analytics", graphic: "stack",
        description: "Results and performance are tracked and charted as quizzes are taken." },
      { title: "Secure auth on PostgreSQL", graphic: "tree",
        description: "JWT and bcrypt authentication on an Express API, with PostgreSQL through Sequelize." },
    ],
  },
};

const WORKS: Work[] = projects
  .filter((p) => WORK_COPY[p.id])
  .map((project) => ({ project, ...WORK_COPY[project.id] }));

type Step = Highlight & { work: Work; workIndex: number; stepIndex: number };
const STEPS: Step[] = WORKS.flatMap((work, workIndex) =>
  work.highlights.map((h, stepIndex) => ({ ...h, work, workIndex, stepIndex })),
);
const TOTAL = STEPS.length;
/** Scroll length of one step, in lvh. */
const STEP_LVH = 90;

const IMAGE_SIZE = { width: 1600, height: 960 };
const hostOf = (url?: string) => (url ? url.replace(/^https?:\/\//, "").replace(/\/$/, "") : "");
const fileOf = (src: string) => src.split("/").pop() ?? src;

/* ---------------------------------------------------------------- small hooks */

function useMediaQuery(query: string): boolean {
  const [m, setM] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setM(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return m;
}

/* ---------------------------------------------------------------- dashed guide lines */

const DASH = { stroke: "#264013", strokeWidth: 1, strokeDasharray: "4 4", vectorEffect: "non-scaling-stroke" as const };

const HLine = () => (
  <div className="relative h-0 w-full">
    <svg style={{ opacity: 0.2 }} className="absolute left-1/2 w-[200vw] min-w-[4000px] -translate-x-1/2" height="2" viewBox="0 0 4000 2" fill="none">
      <path d="M0 1 H4000" {...DASH} />
    </svg>
  </div>
);
const VLine = () => (
  <div className="relative -z-10 h-0 w-0">
    <svg style={{ opacity: 0.2 }} className="absolute top-1/2 h-[200vh] -translate-y-1/2" width="2" viewBox="0 0 2 4000" fill="none">
      <path d="M1 0 V4000" {...DASH} />
    </svg>
  </div>
);
const Frame = () => (
  <>
    <div className="absolute right-0 left-0 flex flex-row justify-between"><VLine /><VLine /></div>
    <div className="absolute top-0 bottom-0 flex flex-col justify-between"><HLine /><HLine /></div>
  </>
);

/* ---------------------------------------------------------------- tiny UI parts */

/** Rolling-digit number: digits slide on a 0-9 column. */
function RollingNumber({ value, duration = 0.4 }: { value: number; duration?: number }) {
  const digits = String(value).split("");
  return (
    <span className="relative inline-flex h-[1em] flex-row items-center overflow-clip leading-[1em]">
      {digits.map((d, i) => (
        <span key={digits.length - i} className="relative block h-[1em] w-[0.6em] overflow-hidden">
          <motion.span className="flex flex-col" initial={{ y: "1em" }} animate={{ y: `${-Number(d)}em` }} transition={{ duration, ease: EASE_W5 }}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <span key={n} className="block h-[1em] leading-[1em]">{n}</span>
            ))}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/** Eased typewriter reveal (easeOutQuint), speed = ms per character. */
function Typewriter({ text, speed, delay = 0 }: { text: string; speed: number; delay?: number }) {
  const [shown, setShown] = React.useState("");
  React.useEffect(() => {
    let n = 0;
    const start = performance.now() + delay;
    let raf = 0;
    const tick = (now: number) => {
      const o = now - start;
      if (o < 0) { raf = requestAnimationFrame(tick); return; }
      const p = Math.min(o / (text.length * speed), 1);
      const c = Math.floor((1 - Math.pow(1 - p, 5)) * text.length);
      if (c > n) { setShown(text.slice(0, c)); n = c; }
      if (n < text.length) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, speed, delay]);
  return (
    <>
      {shown}
      {shown !== text && (
        <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.4, repeat: Infinity, repeatType: "mirror" }} className="border-r-primary border-r-2" />
      )}
    </>
  );
}

const Stage = ({ children }: { children: React.ReactNode }) => (
  <div className="absolute inset-0 z-0 flex flex-col items-center justify-center overflow-hidden">{children}</div>
);

type GraphicProps = { work: Work; variant: "lg" | "sm" };
const placement = (variant: "lg" | "sm") =>
  variant === "lg" ? { translate: "20vw 0", scale: 1 } : { translate: "0 8vh", scale: 0.85 };

/* ---------------------------------------------------------------- graphic 1: browser window */

function ScreenGraphic({ work, variant }: GraphicProps) {
  const { project } = work;
  const address = hostOf(project.live) || hostOf(project.code);
  return (
    <Stage>
      <motion.div style={placement(variant)}>
        <motion.div variants={POP} initial="initial" animate="animate" exit="exit" className="relative w-[min(560px,86vw)] xl:w-[min(600px,40vw)]">
          <Frame />
          <div className="border-outline bg-surface-highest overflow-hidden rounded-[8px] border shadow-[0_0_40px_rgba(46,67,32,.08)]">
            <div className="border-outline flex h-8 items-center gap-3 border-b px-3">
              <div className="flex gap-1.5" aria-hidden>
                {[0, 1, 2].map((i) => <span key={i} className="bg-outline-strong size-2 rounded-full" />)}
              </div>
              <div className="atlas-product-xs text-on-surface-base-subtle bg-surface-low flex h-5 flex-1 items-center truncate rounded-[4px] px-2">
                <Typewriter text={address} speed={18} delay={250} />
              </div>
            </div>
            <motion.img
              src={project.image} alt="" width={IMAGE_SIZE.width} height={IMAGE_SIZE.height} decoding="async"
              className="block aspect-[16/10] w-full object-cover object-top"
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1, transition: { delay: 0.15, duration: 0.8, ease: EASE_EXPO } }}
            />
          </div>
          <div className="atlas-product-xs text-on-surface-high mt-2 flex justify-between">
            <span>{fileOf(project.image)}</span>
            <span>{project.year} · {project.status}</span>
          </div>
        </motion.div>
      </motion.div>
    </Stage>
  );
}

/* ---------------------------------------------------------------- graphic 2: 3D stack of screenshots */

function StackGraphic({ work, variant }: GraphicProps) {
  const rotY = useMotionValue(0);
  const rotX = useMotionValue(0);
  React.useEffect(() => {
    const a = animate(rotY, -24, { duration: 0.5, ease: EASE_OUT });
    const b = animate(rotX, -6, { duration: 0.5, ease: EASE_OUT });
    return () => { a.stop(); b.stop(); };
  }, [rotX, rotY]);
  const CARD_W = 340;
  const { scale } = placement(variant);
  return (
    <Stage>
      <motion.div style={{ translate: variant === "lg" ? "16vw -8vh" : "0 4vh", scale: scale * 0.9 }}>
        <div style={{ perspective: 1400 }}>
          <motion.div style={{ rotateY: rotY, rotateX: rotX, transformStyle: "preserve-3d" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
            {Array.from({ length: 7 }).map((_, i) => (
              <motion.div
                key={i}
                className="border-outline bg-surface-base absolute overflow-hidden rounded-md border"
                style={{ width: CARD_W, left: -CARD_W / 2, top: -106, transformStyle: "preserve-3d", boxShadow: "0 0 40px rgba(46,67,32,.08)" }}
                initial={{ x: 0, z: 0, opacity: 0 }}
                animate={{ x: (i - 2) * 40, z: (i - 2) * -150, y: (i - 2) * -22, opacity: 1 - Math.max(0, i - 2) * 0.12, transition: { duration: 0.6, delay: 0.03 * i, ease: EASE_OUT } }}
                exit={{ opacity: 0, transition: { duration: 0.3 } }}
              >
                <img src={work.project.image} alt="" width={IMAGE_SIZE.width} height={IMAGE_SIZE.height} decoding="async" className="block aspect-[16/10] w-full object-cover object-top select-none" draggable={false} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </Stage>
  );
}

/* ---------------------------------------------------------------- graphic 3: project tree (stack + links) */

const ICON_PATH = {
  folder: "M2.5 5.5a1 1 0 0 1 1-1h3.2l1.3 1.5h4.5a1 1 0 0 1 1 1v5.5a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1z",
  chip: "M5 5h6v6H5zM6.5 2.5v2.5M9.5 2.5v2.5M6.5 11v2.5M9.5 11v2.5M2.5 6.5H5M2.5 9.5H5M11 6.5h2.5M11 9.5h2.5",
  globe: "M8 2.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11M2.5 8h11M8 2.5c1.6 1.6 2.3 3.4 2.3 5.5S9.6 11.9 8 13.5C6.4 11.9 5.7 10.1 5.7 8S6.4 4.1 8 2.5",
  branch: "M5 3v10M5 9c0-2 1.5-3 3.5-3H11M11 4.5v3M5 13a1.25 1.25 0 1 0 0-.01M11 4.5a1.25 1.25 0 1 0 0-.01",
} as const;
type IconName = keyof typeof ICON_PATH;
const ICON_COLOR: Record<IconName, string> = {
  folder: "var(--color-aux-accent-4)",
  chip: "var(--color-primary)",
  globe: "var(--color-aux-accent-8)",
  branch: "var(--color-aux-accent-9)",
};

const TreeRow = ({ icon, indent, delay, children }: { icon: IconName; indent: number; delay: number; children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, scale: 1.1 }}
    animate={{ opacity: 1, scale: 1, transition: { delay: 0.15 + 0.1 * delay, duration: 1.2, ease: EASE_EXPO } }}
    style={{ marginLeft: `${20 * indent}px` }}
    className="flex h-6 flex-row items-center gap-1.5 text-sm"
  >
    <svg aria-hidden viewBox="0 0 16 16" className="size-4 shrink-0" fill="none" stroke={ICON_COLOR[icon]} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d={ICON_PATH[icon]} />
    </svg>
    <div className="truncate">{children}</div>
  </motion.div>
);

function TreeGraphic({ work, variant }: GraphicProps) {
  const { project } = work;
  const rows: Array<{ icon: IconName; indent: number; text: string }> = [
    { icon: "folder", indent: 0, text: project.id },
    ...project.tech.map((t) => ({ icon: "chip" as const, indent: 1, text: t })),
    ...(project.live ? [{ icon: "globe" as const, indent: 0, text: hostOf(project.live) }] : []),
    ...(project.code ? [{ icon: "branch" as const, indent: 0, text: hostOf(project.code).replace(/^github\.com\//, "") }] : []),
  ];
  return (
    <Stage>
      <div style={placement(variant)}>
        <motion.div
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1, transition: { delay: 0.1, duration: 0.5, ease: EASE_EXPO } }}
          exit={{ opacity: 0, scale: 1.05, transition: { duration: 0.3, delay: 0.1, ease: EASE_EXPO } }}
          className="relative flex max-w-[86vw] flex-col gap-1 px-4 py-4"
        >
          <Frame />
          <div className="text-xs opacity-70">{project.categories.join(" · ")}</div>
          <div>
            {rows.map((r, i) => <TreeRow key={`${r.text}-${i}`} icon={r.icon} indent={r.indent} delay={i}>{r.text}</TreeRow>)}
          </div>
        </motion.div>
      </div>
    </Stage>
  );
}

const GRAPHICS: Record<GraphicKind, React.ComponentType<GraphicProps>> = {
  screen: ScreenGraphic,
  stack: StackGraphic,
  tree: TreeGraphic,
};

/* ---------------------------------------------------------------- tabs, progress ticks, links pill */

const ICON_STROKE = { fill: "none", stroke: "currentColor", vectorEffect: "non-scaling-stroke" as const };
const TabIcon = ({ index, spin }: { index: number; spin: MotionValue<number> }) => {
  const svg = (children: React.ReactNode) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="absolute inset-0">{children}</svg>
  );
  switch (index % 5) {
    case 0:
      return (
        <>
          <motion.div className="absolute inset-0" style={{ rotate: spin }}>
            {svg(<path {...ICON_STROKE} d="m32 8 18.764 9.036 4.634 20.304-12.985 16.283H21.587L8.602 37.341l4.634-20.305z" />)}
          </motion.div>
          {svg(<path {...ICON_STROKE} d="m32 8 15.427 5.615 8.208 14.217L52.785 44 40.209 54.553H23.79L11.215 44l-2.85-16.168 8.208-14.217z" />)}
        </>
      );
    case 1:
      return svg(<circle cx="32" cy="32" r="24" {...ICON_STROKE} strokeDasharray="5 3" />);
    case 2:
      return svg(<path {...ICON_STROKE} d="M30.803 8.03c-7.956.39-14.893 4.654-18.965 10.946L19.53 24.8l-8.893-3.75A23.9 23.9 0 0 0 8 32c0 3.945.952 7.667 2.638 10.95l8.892-3.75-7.691 5.825c4.072 6.291 11.01 10.555 18.964 10.946L32 46.4l1.198 9.57c7.954-.392 14.89-4.656 18.963-10.947l-7.69-5.823 8.89 3.749A23.9 23.9 0 0 0 56 32c0-3.944-.951-7.666-2.637-10.948L44.472 24.8l7.69-5.824C48.092 12.685 41.155 8.42 33.2 8.029l-1.198 9.572z" />);
    case 3:
      return (
        <>
          {svg(<circle cx="32" cy="32" r="20" {...ICON_STROKE} />)}
          {svg(<circle cx="32" cy="32" r="24" {...ICON_STROKE} strokeDasharray="5 3" />)}
        </>
      );
    default:
      return (
        <>
          <motion.div className="absolute inset-0" style={{ rotate: spin }}>
            {svg(<rect x="14" y="14" width="36" height="36" {...ICON_STROKE} strokeDasharray="5 3" />)}
          </motion.div>
          {svg(<rect x="14" y="14" width="36" height="36" transform="rotate(45 32 32)" {...ICON_STROKE} />)}
        </>
      );
  }
};

function ProgressTicks({ workProgress, total }: { workProgress: MotionValue<number>; total: number }) {
  return (
    <div className="relative flex h-0.5 items-center gap-1">
      {Array.from({ length: total }).map((_, i) => <Tick key={i} index={i} workProgress={workProgress} />)}
    </div>
  );
}
function Tick({ index, workProgress }: { index: number; workProgress: MotionValue<number> }) {
  const width = useTransform(workProgress, (v) => `${100 * clamp(0, 1, v - index)}%`);
  return (
    <div className="relative flex h-full basis-full items-center">
      <div className="bg-pebble-300 h-[1px] basis-full" />
      <motion.div className="bg-pebble-900 absolute top-0 left-0 h-full" style={{ width }} />
    </div>
  );
}

function WorkTab({
  work, isActive, workIndex, sectionProgress, variant,
}: { work: Work; isActive: boolean; workIndex: number; sectionProgress: MotionValue<number>; variant: "lg" | "sm" }) {
  const total = work.highlights.length;
  const angle = useMotionValue(0);
  const counter = useTransform(angle, (v) => -1.5 * v);
  const rotate = useSpring(angle, { stiffness: 100, damping: 25 });
  const [seen, setSeen] = React.useState(false);
  const startRef = React.useRef(0);
  const baseRef = React.useRef(0);
  const wasSeen = React.useRef(false);
  const workProgress = useTransform(sectionProgress, (p) => {
    const t = Math.max(0, p * TOTAL - 1e-5);
    const s = STEPS[Math.floor(t)];
    return s && s.workIndex === workIndex ? s.stepIndex + (t % 1) : 0;
  });
  const [shownIndex, setShownIndex] = React.useState(0);
  useMotionValueEvent(workProgress, "change", (v) => { const f = Math.floor(v); if (f !== shownIndex) setShownIndex(f); });

  // slow endless spin of the active icon: 360deg every 20 s
  React.useEffect(() => {
    let raf = 0;
    const tick = (now: number) => {
      if (isActive) {
        if (!wasSeen.current) { startRef.current = now; baseRef.current = angle.get(); }
        angle.set(baseRef.current + ((now - startRef.current) / 20000) * 360);
        wasSeen.current = true; setSeen(true);
        raf = requestAnimationFrame(tick);
      } else { wasSeen.current = false; setSeen(false); }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isActive, angle]);

  const pad = variant === "lg" ? "pl-4" : "pl-3";
  return (
    <div className="flex items-center">
      <div className={variant === "lg" ? "relative size-12 shrink-0" : "relative size-6 shrink-0"}>
        <motion.div className="absolute -inset-2" style={{ rotate }}>
          <TabIcon index={workIndex} spin={counter} />
        </motion.div>
        <div className="atlas-web-sm absolute inset-0 flex items-center justify-center text-center">{work.project.number}</div>
      </div>
      <AnimatePresence>
        {(seen || variant === "lg") && (
          <motion.div className="flex flex-col overflow-hidden" initial={{ width: 0 }} animate={{ width: isActive ? 132 : "auto" }} exit={{ width: 0 }} transition={EASE_UI}>
            <div className={cn("relative", variant === "sm" && "-mt-1", pad)}>
              <div className="atlas-web-sm whitespace-nowrap">{work.label}</div>
              <motion.div className="atlas-web-sm text-pebble-500 absolute top-0 right-0 text-right" initial={{ opacity: 0 }} animate={{ opacity: isActive ? 1 : 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }}>
                <RollingNumber value={shownIndex + 1} duration={0.3} />
                <span className="whitespace-pre"> / {total}</span>
              </motion.div>
            </div>
            <motion.div animate={{ height: isActive ? "auto" : 0, opacity: isActive ? 1 : 0 }} className={pad} transition={EASE_UI}>
              <div className={variant === "lg" ? "pt-2" : "pt-1.5"}><ProgressTicks workProgress={workProgress} total={total} /></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type Go = (t: { workIndex: number; stepIndex: number }) => void;

function WorkTabs({ current, onChange, sectionProgress, variant, id }: { current: number; onChange: Go; sectionProgress: MotionValue<number>; variant: "lg" | "sm"; id: string }) {
  return (
    <ul
      role="tablist"
      aria-label="Projects"
      className={cn("text-pebble-300 hover:text-pebble-400 pointer-events-auto flex items-center", variant === "lg" ? "-ml-2 gap-1 2xl:gap-2" : "h-16 gap-4 overflow-x-auto")}
    >
      {WORKS.map((w, i) => (
        <li
          key={w.project.id} role="tab" tabIndex={i === current ? 0 : -1} aria-label={w.project.title} aria-selected={i === current}
          id={`tab-${id}-${i}`} aria-controls={`tabpanel-${id}-${i}`}
          className={cn(
            "rounded-full border border-transparent transition-colors duration-300 select-none cursor-pointer outline-none focus-visible:!border-pebble-400",
            i === current && "text-pebble-900",
            variant === "lg" && "p-2 pr-6 hover:!border-pebble-300 hover:text-pebble-900",
          )}
          onClick={() => onChange({ workIndex: i, stepIndex: 0 })}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onChange({ workIndex: i, stepIndex: 0 }); }
            if (e.key === "ArrowRight") onChange({ workIndex: Math.min(WORKS.length - 1, i + 1), stepIndex: 0 });
            if (e.key === "ArrowLeft") onChange({ workIndex: Math.max(0, i - 1), stepIndex: 0 });
          }}
        >
          <WorkTab work={w} workIndex={i} isActive={i === current} sectionProgress={sectionProgress} variant={variant} />
        </li>
      ))}
    </ul>
  );
}

function ProjectLinks({ work }: { work: Work }) {
  const links = [
    work.project.live && { href: work.project.live, label: "Live" },
    work.project.code && { href: work.project.code, label: "Code" },
    { href: "/projects", label: "All work" },
  ].filter(Boolean) as Array<{ href: string; label: string }>;
  return (
    <aside className="bg-pebble-100 pointer-events-auto hidden h-10 items-center gap-4 overflow-clip rounded-[8px] pr-2 pl-4 lg:flex">
      <p className="atlas-web-sm pointer-events-none cursor-default">View project</p>
      <ul className="atlas-web-mono flex items-center">
        <AnimatePresence mode="sync" initial={false}>
          {links.map((l) => (
            <motion.li key={`${work.project.id}-${l.label}`} className="flex justify-center" initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }} transition={EASE_UI}>
              <a
                href={l.href}
                {...(l.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="hover:text-primary px-3 text-center text-nowrap transition-colors"
              >
                {l.label}
              </a>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </aside>
  );
}

/* ---------------------------------------------------------------- text panels */

function ProjectMeta({ project }: { project: Project }) {
  return (
    <div className="atlas-web-mono text-pebble-500 flex flex-wrap gap-x-3 gap-y-1">
      <span>{project.year}</span>
      <span className={project.status === "In Progress" ? "text-aux-accent-4" : "text-primary"}>{project.status}</span>
      <span>{project.stackSummary}</span>
    </div>
  );
}

function TextPanelsLg({ id, workIndex, stepIndex, onChange }: { id: string; workIndex: number; stepIndex: number; onChange: Go }) {
  return (
    <div className="pointer-events-none relative h-full xl:mt-12">
      {WORKS.map((w, wi) => (
        <motion.div
          key={w.project.id} role="tabpanel" aria-labelledby={`tab-${id}-${wi}`} id={`tabpanel-${id}-${wi}`} aria-hidden={workIndex !== wi}
          className="absolute top-0 bottom-[19px] left-0 flex flex-col justify-between"
          initial={{ opacity: 0, visibility: "hidden" }}
          animate={{ opacity: wi === workIndex ? 1 : 0, visibility: wi === workIndex ? "visible" : "hidden" }}
          transition={{ duration: 0.5, ease: EASE_MEDIUM, delay: wi === workIndex ? 0.2 : 0 }}
        >
          <div className="pointer-events-auto flex max-w-[500px] flex-col gap-2 pt-0">
            <ProjectMeta project={w.project} />
            <h3 className="atlas-web-base 2xl:atlas-web-md text-pretty 2xl:mb-4">{w.project.title}</h3>
            <p className="text-pretty">{w.project.description}</p>
          </div>
          <ol className="pointer-events-auto flex max-w-[500px] flex-col">
            {w.highlights.map((h, hi) => (
              <li key={hi} className={cn("border-pebble-200 flex border-t pt-3 2xl:pt-4", hi !== stepIndex && "cursor-pointer select-none")}
                onClick={() => onChange({ workIndex: wi, stepIndex: hi })}>
                <div className="text-pebble-500 atlas-web-sm 2xl:atlas-web-base w-8 select-none 2xl:w-12" aria-hidden="true">{hi + 1}</div>
                <div className="flex-1">
                  <h4 className={cn("atlas-web-sm 2xl:atlas-web-base pb-3 text-pretty 2xl:pb-4", hi === stepIndex ? "text-pebble-900" : "text-pebble-500")}>{h.title}</h4>
                  <motion.div className="overflow-clip" initial={{ height: 0, opacity: 0 }} animate={{ height: hi === stepIndex ? "auto" : 0, opacity: hi === stepIndex ? 1 : 0 }} transition={EASE_UI}>
                    <p className="atlas-web-sm 2xl:atlas-web-base pb-4 text-pretty">{h.description}</p>
                  </motion.div>
                </div>
              </li>
            ))}
          </ol>
        </motion.div>
      ))}
    </div>
  );
}

function TextPanelsSm({ id, workIndex, stepIndex }: { id: string; workIndex: number; stepIndex: number }) {
  return (
    <div className="mt-4">
      {WORKS.map((w, wi) => (
        <div key={w.project.id} role="tabpanel" aria-labelledby={`tab-${id}-${wi}`} id={`tabpanel-${id}-${wi}`} className={cn("pointer-events-auto max-w-[500px] flex-col gap-2", wi === workIndex ? "flex" : "hidden")}>
          <div className="atlas-web-sm text-pebble-500">{w.project.title}</div>
          {w.highlights.map((h, hi) => (
            <div key={hi} className={hi === stepIndex ? "block" : "hidden"}>
              <div className="atlas-web-base mb-2">{h.title}</div>
              <div className="atlas-web-sm text-pebble-500">{h.description}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- the section */

export interface WorksOverviewProps {
  /** scroll through a custom scroller (default: window.scrollTo with a 0.7 s ease) */
  scrollTo?: (y: number, opts: { duration: number; easing: (t: number) => number }) => void;
}

export default function WorksOverview({ scrollTo }: WorksOverviewProps) {
  const sectionRef = React.useRef<HTMLElement>(null);
  const id = React.useId();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start center", "end center"] });
  const isLg = useMediaQuery("(min-width: 1280px)");
  const [current, setCurrent] = React.useState<Step>(STEPS[0]);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const i = Math.floor(Math.max(0, v * TOTAL - 1e-5));
    const next = STEPS[i] ?? STEPS[TOTAL - 1];
    if (next !== current) setCurrent(next);
  });

  const go: Go = React.useCallback(({ workIndex, stepIndex }) => {
    const el = sectionRef.current;
    if (!el) return;
    const before = WORKS.slice(0, workIndex).reduce((n, w) => n + w.highlights.length, 0);
    const r = el.getBoundingClientRect();
    // offset ["start center", ...]: step i starts when the section top is i steps above mid-viewport
    const y = r.top + window.scrollY - window.innerHeight / 2 + (before + stepIndex) * (r.height / TOTAL) + 1;
    const easing = cubicBezier(...EASE_STRONG);
    if (scrollTo) { scrollTo(y, { duration: 0.7, easing }); return; }
    const from = window.scrollY, t0 = performance.now();
    const step = (now: number) => {
      const t = Math.min((now - t0) / 700, 1);
      window.scrollTo({ top: from + (y - from) * easing(t), behavior: "instant" }); // the site sets scroll-behavior: smooth
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [scrollTo]);

  const variant = isLg ? "lg" : "sm";
  return (
    <motion.section ref={sectionRef} className="relative mt-[10lvh] flex w-full" style={{ height: `${STEP_LVH * TOTAL}lvh` }}>
      {/* sticky chrome: tabs, links pill, text */}
      <div className="px-grid-margin pointer-events-none sticky top-0 bottom-0 left-0 z-5 h-lvh w-full pt-[calc(var(--nav-height)+16px)]">
        <div className={cn("from-meadow-50 pointer-events-none absolute inset-0 to-transparent", isLg ? "bg-linear-to-r from-40% to-50%" : "bg-linear-to-b from-[200px] to-[280px]")} />
        <div className="max-w-grid relative mx-auto flex h-full flex-col">
          <div className="flex flex-row items-center justify-between">
            <WorkTabs current={current.workIndex} onChange={go} sectionProgress={scrollYProgress} variant={variant} id={id} />
            <ProjectLinks work={current.work} />
          </div>
          {isLg
            ? <TextPanelsLg id={id} workIndex={current.workIndex} stepIndex={current.stepIndex} onChange={go} />
            : <TextPanelsSm id={id} workIndex={current.workIndex} stepIndex={current.stepIndex} />}
        </div>
      </div>

      {/* graphics: one slot per step, they scroll with the page (not sticky) */}
      <div className="absolute inset-0">
        {STEPS.map((s, i) => {
          const Graphic = GRAPHICS[s.graphic];
          return (
            <figure
              key={`${s.work.project.id}-${s.stepIndex}`}
              className="border-t-pebble-300 relative border-t border-dashed"
              aria-label={`${s.work.project.title}: ${s.title}`}
              style={{ height: `${STEP_LVH}lvh` }}
            >
              <AnimatePresence>
                {s === current && (
                  <motion.div className="absolute inset-0" aria-hidden key={i} exit={{ opacity: 1 }}>
                    <Graphic work={s.work} variant={variant} />
                  </motion.div>
                )}
              </AnimatePresence>
            </figure>
          );
        })}
      </div>
    </motion.section>
  );
}
