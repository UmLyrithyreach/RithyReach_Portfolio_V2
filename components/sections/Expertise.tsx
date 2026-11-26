"use client";

// My expertise: what I can do for a company that hires me, as a 3D tunnel of cards. Service cards
// alternate with project cards that back them up (lib/expertise.json).
// Service cards are text; project cards show the project's real screenshot whole (never cropped).
//
// It opens with the shared expand box (components/shared/ExpandSection.tsx): a 75%-wide box grows
// to fill the screen with the title scaling in, then the section pins for TUNNEL_VH viewport
// heights while the scroll flies through the tunnel inside it. Monochrome (globals.css).
// Reduced motion: no expand, no flight; the box is full size and the cards are a plain grid.

import PerspectiveTunnelHero, { type TunnelItem } from "@/components/ui/perspective-tunnel-hero";
import { ExpandSection } from "@/components/shared/ExpandSection";
import { projects } from "@/lib/data";
import expertise from "@/lib/expertise.json";

type Card =
  | { kind: "service"; id: string; title: string; pitch: string; seenIn: string[] }
  | { kind: "project"; id: string; for: string };

const cards = expertise.cards as Card[];
const services = cards.filter((c) => c.kind === "service");
const serviceTitle = (id: string) => services.find((s) => s.id === id)?.title ?? "";

/** Pixel sizes of the project screenshots (public/image/projects), so each card takes the picture's own shape. */
const SHOT_SIZE: Record<string, [number, number]> = {
  "/image/projects/KhodKquiz.webp": [1600, 1000],
  "/image/projects/asipredesign.webp": [1600, 894],
  "/image/projects/automata-project.webp": [1600, 1000],
  "/image/projects/capstone.webp": [1600, 916],
  "/image/projects/portfolio.webp": [1600, 1001],
};

/** "A", "A and B", "A, B and C". */
const listOf = (names: string[]) =>
  names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;

// Services are text cards; each project card is its real screenshot, shown whole.
const ITEMS: TunnelItem[] = cards.flatMap((card): TunnelItem[] => {
  if (card.kind === "service") {
    // Mid-sentence, "This site" reads as "this site".
    const seen = card.seenIn.map((name) => (name === "This site" ? "this site" : name));
    return [{ kind: "text", title: card.title, body: card.pitch, meta: seen.length ? `Seen in ${listOf(seen)}` : undefined }];
  }
  const project = projects.find((p) => p.id === card.id);
  if (!project) return [];
  const [width, height] = SHOT_SIZE[project.image] ?? [1600, 1000];
  // "Full-Stack Web Application" -> "Full-stack web app": sentence case, like the rest of the copy.
  const category = (project.categories[0] ?? "").replace(/ application$/i, " app").toLowerCase();
  const kind = category.charAt(0).toUpperCase() + category.slice(1);
  return [
    {
      kind: "image",
      src: project.image,
      width,
      height,
      title: project.title,
      meta: [kind, project.year].filter(Boolean).join(", "),
      alt: `${project.title}, a project showing ${serviceTitle(card.for).toLowerCase()}`,
    },
  ];
});

/** How long the section stays pinned for the flight, in viewport heights of scroll. */
const TUNNEL_VH = 4.5;
/** The box starts 75% wide (full width under 1024px) and 60% of the viewport tall. */
const FROM = { wide: { width: "75%", height: "60%" }, narrow: { width: "100%", height: "60%" } };

export default function Expertise() {
  return (
    <ExpandSection id="expertise" labelledBy="expertise-head" className="expertise" tone="dark" pinScreens={TUNNEL_VH} from={FROM}>
      {(progress) => (
        <div className="xp-tunnel">
          <PerspectiveTunnelHero
            items={ITEMS}
            progress={progress}
            headingId="expertise-head"
            eyebrow={null}
            title={
              <>
                My
                <br />
                expertise.
              </>
            }
            subtitle={`${services.length} ways I can help your team, and the projects that prove it.`}
            prompt="Keep scrolling"
          />
        </div>
      )}
    </ExpandSection>
  );
}
