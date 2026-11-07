"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { type Project, projects } from "@/lib/data";
import ProjectCard from "@/components/projects/ProjectCard";
import { ProjectModal } from "@/components/projects/ProjectsBrowser";

export default function Projects() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  return (
    <section
      id="works"
      data-works
      aria-labelledby="works-head"
      className="relative isolate w-full overflow-x-clip bg-surface-black py-20 text-on-dark sm:py-24"
    >
      {/* Subtle top divider hairline */}
      <div className="absolute inset-x-0 top-0 border-t border-border-dark" aria-hidden="true" />

      {/* Subtle vertical git-branch / deployment coordinate spine accent */}
      <div
        className="pointer-events-none absolute inset-y-0 left-1/2 -z-10 hidden w-px -translate-x-1/2 border-l border-dashed border-border-dark/40 lg:block"
        aria-hidden="true"
      />

      <div className="mx-auto w-full max-w-[84rem] px-6 sm:px-8 lg:px-10">
        {/* Header */}
        <div className="flex flex-col gap-6 border-b border-border-dark pb-10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-accent">
              02 // DEPLOYMENTS &amp; REPOSITORIES
            </span>
            <h2
              id="works-head"
              className="mt-2 font-display text-5xl font-bold uppercase leading-[0.95] tracking-tight text-accent sm:text-6xl"
            >
              from code<br className="hidden sm:inline" /> to launch
              <span className="text-on-dark">.</span>
            </h2>
          </div>

          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center lg:flex-col lg:items-end">
            <div className="font-mono text-xs uppercase tracking-wider text-on-dark-muted">
              05 SHIPPED BUILDS · 03 FULL-STACK · PERN &amp; MERN
            </div>
            <Link
              href="/projects"
              className="inline-flex min-h-11 items-center justify-center border border-accent px-5 py-2.5 font-sans text-xs font-bold uppercase tracking-wider text-accent transition-colors duration-150 ease-out [@media(hover:hover)]:hover:bg-accent [@media(hover:hover)]:hover:text-surface-black active:scale-[0.97]"
            >
              <span>VIEW ARCHIVE / ALL PROJECTS →</span>
            </Link>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onSelect={setSelectedProject}
              isHovered={hoveredId === project.id}
              onHover={() => setHoveredId(project.id)}
              onLeave={() => setHoveredId(null)}
              className={
                hoveredId && hoveredId !== project.id
                  ? "opacity-75 transition-opacity duration-200"
                  : "transition-opacity duration-200"
              }
            />
          ))}
        </div>
      </div>

      {/* Case Study Detail Modal */}
      <AnimatePresence>
        {selectedProject && (
          <ProjectModal
            key={selectedProject.id}
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
