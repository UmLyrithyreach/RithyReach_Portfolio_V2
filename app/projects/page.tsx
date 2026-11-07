import type { Metadata } from "next";
import ProjectsBrowser from "@/components/projects/ProjectsBrowser";
import { projectCategories, projects } from "@/lib/data";

export const metadata: Metadata = {
  title: "Project Archive | Um Lyrithyreach",
  description:
    "Explore full-stack and frontend web development projects built by Um Lyrithyreach using Next.js, React, TypeScript, and Node.js.",
};

export default function ProjectsPage() {
  return (
    <main className="min-h-screen bg-surface-black text-on-dark">
      <ProjectsBrowser projects={projects} categories={projectCategories} />
    </main>
  );
}
