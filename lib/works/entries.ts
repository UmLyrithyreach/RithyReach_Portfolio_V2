// The timeline's five entries (portfolio.md §4): how each project in `lib/data.ts` sits in the
// block. Title, copy, links and screenshot come from the project itself; this adds the frame.

import { projects, type Project } from "@/lib/data";

/** What the geometry reads off an entry. */
export interface TimelineEntry {
  frame: "side" | "centre";
}

export interface WorksEntry extends TimelineEntry {
  /** A side plate's gutter. */
  align?: "left" | "right";
  /** A centre row's copy column, in design px. */
  copyWidth?: number;
  alt: string;
}

const FRAMES: Record<string, WorksEntry> = {
  "asip-redesign": { frame: "centre", copyWidth: 284, alt: "ASIP Redesign homepage" },
  "automata-simulation": { frame: "side", align: "right", alt: "Automata Simulation editor" },
  "samki-digital-market": { frame: "centre", copyWidth: 300, alt: "Samki Digital Market storefront" },
  "portfolio-2": { frame: "side", align: "left", alt: "Portfolio 2.0 homepage" },
  khodkquiz: { frame: "centre", copyWidth: 284, alt: "KhodKquiz dashboard" },
};

export interface WorksRow extends WorksEntry {
  project: Project;
  /** The tech, and the status when the project is still in progress. */
  meta: string;
}

export const WORKS_ROWS: WorksRow[] = projects.map((project) => ({
  ...FRAMES[project.id],
  project,
  meta: project.status === "In Progress" ? `${project.stackSummary} — in progress` : project.stackSummary,
}));
