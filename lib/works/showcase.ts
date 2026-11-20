// The work so far: the pinned showcase in section#works. Four tracks, one entry per thing built.
// Every entry is a real project or public repo. `visual` picks the figure drawn on the right;
// "shot" uses a real screenshot, the rest are drawn in code. Placeholders mark media still to come
// (`placeholder` names the file to drop into /public/image/works/).

import { projects } from "@/lib/data";

export type ShowcaseVisual =
  | { kind: "shot"; src: string; url: string; alt: string }
  | { kind: "dfa" }
  | { kind: "agents" }
  | { kind: "terminal" }
  | { kind: "pipeline"; placeholder: string }
  | { kind: "vault" }
  | { kind: "phones"; placeholders: [string, string] }
  | { kind: "phone-list"; placeholder: string; repos: string[] }
  | { kind: "ci" }
  | { kind: "tests" }
  | { kind: "heatmap" };

interface ShowcaseEntry {
  id: string;
  /** Required unless projectId is set (then it comes from lib/data.ts). */
  title?: string;
  /** Short label for the figure caption. */
  figure: string;
  blurb: string;
  tags: string[];
  live?: string;
  code?: string;
  /** One of the portfolio's own projects (lib/data.ts): title and links come from there. */
  projectId?: string;
  visual: ShowcaseVisual;
}

export interface ShowcaseItem extends ShowcaseEntry {
  title: string;
}

interface TrackEntry {
  id: string;
  label: string;
  title: string;
  intro: string;
  items: ShowcaseEntry[];
}

export interface ShowcaseTrack extends Omit<TrackEntry, "items"> {
  items: ShowcaseItem[];
}

const GH = "https://github.com/UmLyrithyreach";

const TRACKS: TrackEntry[] = [
  {
    id: "web",
    label: "Web",
    title: "Interfaces that move",
    intro: "Front ends with motion that has a job, and full-stack apps behind them.",
    items: [
      {
        id: "asip-redesign",
        figure: "landing page",
        blurb:
          "A redesign of the Angkor Social Innovation Park site: an interactive SVG of Angkor Wat, GSAP parallax galleries and Lenis smooth scrolling.",
        tags: ["Next.js 16", "GSAP", "Lenis"],
        projectId: "asip-redesign",
        visual: { kind: "shot", src: "/image/projects/asipredesign.webp", url: "asip-redesign.vercel.app", alt: "ASIP Redesign landing page" },
      },
      {
        id: "samki-digital-market",
        figure: "storefront",
        blurb:
          "Capstone project: a multi-vendor skincare marketplace with seller dashboards, an AI shopping assistant, Khmer/English, and Stripe plus Bakong KHQR payments.",
        tags: ["Next.js 16", "Sanity", "Stripe", "KHQR"],
        projectId: "samki-digital-market",
        visual: { kind: "shot", src: "/image/projects/capstone.webp", url: "samki.vercel.app", alt: "Samki Digital Market storefront" },
      },
      {
        id: "khodkquiz",
        figure: "quiz platform",
        blurb: "A quiz platform built at CADT: JWT roles, an admin dashboard and live score analytics on PostgreSQL.",
        tags: ["React", "Express", "PostgreSQL"],
        projectId: "khodkquiz",
        visual: { kind: "shot", src: "/image/projects/KhodKquiz.webp", url: "khodkquiz.app", alt: "KhodKquiz home page" },
      },
      {
        id: "automata-simulation",
        figure: "state machine",
        blurb: "Build, edit and test DFAs and NFAs in the browser, with each input string traced through the machine live.",
        tags: ["React", "Express", "C++"],
        projectId: "automata-simulation",
        visual: { kind: "dfa" },
      },
    ],
  },
  {
    id: "ai",
    label: "AI & agents",
    title: "Agents that do the busywork",
    intro: "Tools that let AI models split work, see the screen and run a pipeline. Built for my own workflow first.",
    items: [
      {
        id: "orchestrator",
        title: "Orchestrator",
        figure: "agent tree",
        blurb:
          "An agent skill that turns the main model into a manager: it fans work out to subagents on the models you pick, re-runs their checks, then approves or sends work back.",
        tags: ["Claude Code", "OpenCode", "Agent skills"],
        code: `${GH}/Orchestrator`,
        visual: { kind: "agents" },
      },
      {
        id: "clairvoyance",
        title: "Clairvoyance",
        figure: "terminal",
        blurb: "Gives an AI agent eyes and hands on windows you already have open: it screenshots one window and sends it clicks, text and keys.",
        tags: ["Node.js", "CLI", "Computer use"],
        code: `${GH}/clairvoyance`,
        visual: { kind: "terminal" },
      },
      {
        id: "youtubekids-studio",
        title: "YouTubeKids Studio",
        figure: "agent pipeline",
        blurb:
          "One prompt in, a kids episode out: five agents write the script, draw character sheets and keyframes, voice it and check the result.",
        tags: ["TypeScript", "Multi-agent", "TTS"],
        code: `${GH}/youtube_kids_automation`,
        visual: { kind: "pipeline", placeholder: "youtubekids-character-sheet.webp" },
      },
      {
        id: "socialstorage",
        title: "SocialStorage",
        figure: "knowledge vault",
        blurb: "Paste a link and AI files it into a category tree with tags and a summary. Works from the web app or a Telegram bot.",
        tags: ["TypeScript", "LLM", "Telegram bot"],
        code: `${GH}/SocialStorage`,
        visual: { kind: "vault" },
      },
    ],
  },
  {
    id: "mobile",
    label: "Mobile",
    title: "The same products, in Flutter",
    intro: "Native-feeling apps in Dart, from coursework to a full replica of the capstone shop.",
    items: [
      {
        id: "samki-mobile",
        title: "Samki mobile app",
        figure: "flutter app",
        blurb: "A Flutter replica of the Samki marketplace: animated splash, category tiles, product filters and search.",
        tags: ["Flutter", "Dart"],
        code: `${GH}/samki_digital_market_mobile_app`,
        visual: { kind: "phones", placeholders: ["samki-mobile-home.webp", "samki-mobile-product.webp"] },
      },
      {
        id: "flutter-coursework",
        title: "Flutter coursework",
        figure: "practice apps",
        blurb: "A BlaBlaCar-style ride app, Firebase back ends and state management with Provider, worked through week by week.",
        tags: ["Flutter", "Firebase", "Provider"],
        code: `${GH}/W8_BLABLAH_CAR`,
        visual: {
          kind: "phone-list",
          placeholder: "blablacar-ride-search.webp",
          repos: ["W8_BLABLAH_CAR", "W9 Firebase part 1", "W10 Firebase with Flutter", "W4 observer · provider"],
        },
      },
    ],
  },
  {
    id: "ship",
    label: "Ship",
    title: "From commit to production",
    intro: "Lint, test and deploy on every push, so what ships is what was checked.",
    items: [
      {
        id: "ci-pipeline",
        title: "CI on every push",
        figure: "github actions",
        blurb: "A GitHub Actions pipeline that installs, lints, tests and uploads a coverage report on every push and pull request.",
        tags: ["GitHub Actions", "ESLint", "Coverage"],
        code: `${GH}/ci-cd-lab`,
        visual: { kind: "ci" },
      },
      {
        id: "e2e-tests",
        title: "Tested end to end",
        figure: "playwright run",
        blurb: "Playwright drives this site in a real browser: every section, every nav link, the mobile menu and each project link.",
        tags: ["Playwright", "TypeScript"],
        visual: { kind: "tests" },
      },
      {
        id: "github-year",
        title: "A year on GitHub",
        figure: "contributions",
        blurb: "361 contributions across 62 repositories in the last year: school work, client sites and my own tools.",
        tags: ["Git", "GitHub"],
        code: GH,
        visual: { kind: "heatmap" },
      },
    ],
  },
];

function resolve(entry: ShowcaseEntry): ShowcaseItem {
  if (!entry.projectId) return { ...entry, title: entry.title ?? entry.id };
  const project = projects.find((p) => p.id === entry.projectId);
  if (!project) throw new Error(`showcase: no project "${entry.projectId}" in lib/data.ts`);
  return { ...entry, title: project.title, live: project.live, code: project.code };
}

export const SHOWCASE: ShowcaseTrack[] = TRACKS.map((track) => ({ ...track, items: track.items.map(resolve) }));

/** Every entry in scroll order, with its track and its 1-based number. */
export const SHOWCASE_FLAT = SHOWCASE.flatMap((track, trackIndex) =>
  track.items.map((item) => ({ item, track, trackIndex })),
).map((entry, index) => ({ ...entry, index, number: String(index + 1).padStart(2, "0") }));
