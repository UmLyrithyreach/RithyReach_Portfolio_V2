"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Project, ProjectStatus } from "@/lib/data";
import { ArrowLeft, Check, ExternalLink, Github, Search, X } from "@/components/icons";
import { CornerBrackets } from "@/components/shared/CornerBrackets";
import ProjectCard, { StatusBadge } from "./ProjectCard";

const STATUS_FILTERS: readonly ("All" | ProjectStatus)[] = ["All", "In Progress", "Completed"];

export function ProjectModal({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.15, ease: "easeOut" }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-surface-black/80 p-4 backdrop-blur-md sm:p-6"
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-modal-title"
        initial={reduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
        transition={{ duration: reduceMotion ? 0 : 0.18, ease: "easeOut" }}
        onClick={(event) => event.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto border border-border-dark bg-surface-dark p-6 text-on-dark shadow-2xl sm:p-8"
      >
        <CornerBrackets size="0.625rem" className="text-accent/60" />

        <div className="mb-6 flex items-start justify-between gap-4 border-b border-border-dark pb-5">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-display text-2xl font-bold leading-none text-accent">
                {project.number}
              </span>
              <span className="font-mono text-xs text-on-dark-muted">
                ~/builds/{project.id}
              </span>
              <StatusBadge status={project.status} />
              <span className="font-mono text-xs text-on-dark-muted">
                {project.year}
              </span>
            </div>
            <h2
              id="project-modal-title"
              className="break-words font-display text-2xl font-bold uppercase tracking-tight text-on-dark sm:text-3xl"
            >
              {project.title}
            </h2>
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-wider text-accent">
              {project.categories.join(" · ")}
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            aria-label="Close modal"
            onClick={onClose}
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center border border-border-dark bg-surface-dark-raised text-on-dark-muted transition-colors hover:border-accent/60 hover:text-on-dark active:scale-[0.97]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="relative mb-6 aspect-video w-full overflow-hidden border border-border-dark bg-surface-black">
          <Image
            src={project.image}
            alt={`${project.title} preview`}
            fill
            sizes="(min-width: 1024px) 896px, 100vw"
            className="object-cover object-top"
          />
        </div>

        <p className="mb-6 break-words text-sm leading-relaxed text-on-dark-muted sm:text-base">
          {project.description}
        </p>

        <div className="grid gap-8 md:grid-cols-2">
          {project.features.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-mono text-xs uppercase tracking-widest text-accent">
                {"// ARCHITECTURAL & SYSTEM HIGHLIGHTS"}
              </h3>
              <ul className="space-y-2">
                {project.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2.5 text-xs leading-relaxed text-on-dark-muted sm:text-sm"
                  >
                    <Check size={14} className="mt-1 shrink-0 text-accent" />
                    <span className="break-words">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <h3 className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
                {"// STACK & DEPENDENCIES"}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {project.tech.map((item) => (
                  <span
                    key={item}
                    className="border border-border-dark bg-surface-black px-2.5 py-1 font-mono text-xs text-on-dark-muted"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {(project.live || project.code) && (
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {project.live && (
                  <a
                    href={project.live}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center justify-center gap-2 border border-accent bg-accent px-5 py-2.5 font-sans text-xs font-bold uppercase tracking-wider text-surface-black transition-[transform,background-color] duration-150 ease-out hover:bg-accent/90 active:scale-[0.97]"
                  >
                    <span>View Live Site</span>
                    <ExternalLink size={14} />
                    <span className="vh"> — opens in a new tab</span>
                  </a>
                )}
                {project.code && (
                  <a
                    href={project.code}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center justify-center gap-2 border border-accent/60 bg-surface-black px-5 py-2.5 font-sans text-xs font-bold uppercase tracking-wider text-accent transition-[transform,background-color,color] duration-150 ease-out hover:bg-accent hover:text-surface-black active:scale-[0.97]"
                  >
                    <Github size={14} />
                    <span>View Repository</span>
                    <span className="vh"> — opens in a new tab</span>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ProjectsBrowser({
  projects,
  categories,
}: {
  projects: Project[];
  categories: string[];
}) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<"All" | ProjectStatus>("All");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const categoryOptions = useMemo(() => ["All", ...categories], [categories]);

  const filteredProjects = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesCategory =
        selectedCategory === "All" || project.categories.includes(selectedCategory);
      const matchesStatus =
        selectedStatus === "All" || project.status === selectedStatus;
      const matchesSearch =
        normalized === "" ||
        project.title.toLowerCase().includes(normalized) ||
        project.description.toLowerCase().includes(normalized) ||
        project.tech.some((item) => item.toLowerCase().includes(normalized));

      return matchesCategory && matchesStatus && matchesSearch;
    });
  }, [projects, query, selectedCategory, selectedStatus]);

  const clearFilters = () => {
    setQuery("");
    setSelectedCategory("All");
    setSelectedStatus("All");
  };

  return (
    <div className="relative isolate w-full bg-surface-black text-on-dark">
      {/* Top Masthead Bar */}
      <header className="sticky top-0 z-40 border-b border-border-dark bg-surface-black/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[84rem] items-center justify-between px-6 py-4 sm:px-8 lg:px-10">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 border border-border-dark bg-surface-dark px-3.5 py-2 font-mono text-xs uppercase tracking-wider text-on-dark-muted transition-colors hover:border-accent hover:text-accent active:scale-[0.97]"
          >
            <ArrowLeft size={14} />
            <span>BACK TO PORTFOLIO</span>
          </Link>

          <span className="font-mono text-xs font-bold uppercase tracking-widest text-accent">
            &lt; RithyReach /&gt;
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="mx-auto w-full max-w-[84rem] space-y-10 px-6 py-12 sm:px-8 sm:py-16 lg:px-10">
        {/* Section Title & Masthead */}
        <div className="border-b border-border-dark pb-8">
          <span className="font-mono text-xs uppercase tracking-widest text-accent">
            02 // REPOSITORY BROWSER
          </span>
          <h1 className="mt-2 font-display text-4xl font-bold uppercase leading-[0.95] tracking-tight text-accent sm:text-5xl md:text-6xl">
            PROJECT ARCHIVE<span className="text-on-dark">.</span>
          </h1>
          <p className="mt-3 font-mono text-xs uppercase tracking-wider text-on-dark-muted">
            {filteredProjects.length} OF {projects.length} SHIPPED BUILDS · FULL-STACK &amp; FRONTEND REPOSITORIES
          </p>
        </div>

        {/* Filter Bar */}
        <div className="space-y-6">
          {/* Search Input */}
          <div className="flex min-h-11 w-full max-w-md items-center gap-2.5 border border-border-dark bg-surface-dark px-3.5 transition-colors focus-within:border-accent">
            <Search size={16} className="shrink-0 text-on-dark-muted" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="SEARCH BUILDS, TECHNOLOGIES..."
              aria-label="Search projects, technologies"
              className="min-w-0 flex-1 bg-transparent py-2 font-mono text-xs uppercase text-on-dark placeholder:text-on-dark-muted/60 focus:outline-none"
            />
            {query !== "" && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setQuery("")}
                className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center text-on-dark-muted transition-colors hover:text-on-dark"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Filter Row: Categories & Status */}
          <div className="flex flex-col gap-4">
            {/* Category Filter Tabs */}
            <div
              role="group"
              aria-label="Filter by category"
              className="flex flex-wrap items-center gap-2"
            >
              <span className="mr-1 font-mono text-xs uppercase tracking-wider text-on-dark-muted">
                CATEGORY:
              </span>
              {categoryOptions.map((category) => {
                const active = selectedCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelectedCategory(category)}
                    className={`inline-flex min-h-11 items-center px-3.5 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-colors active:scale-[0.97] ${
                      active
                        ? "border border-accent bg-accent text-surface-black"
                        : "border border-border-dark bg-surface-dark text-on-dark-muted hover:border-accent/50 hover:text-on-dark"
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>

            {/* Status Filter Tabs */}
            <div
              role="group"
              aria-label="Filter by status"
              className="flex flex-wrap items-center gap-2"
            >
              <span className="mr-1 font-mono text-xs uppercase tracking-wider text-on-dark-muted">
                STATUS:
              </span>
              {STATUS_FILTERS.map((status) => {
                const active = selectedStatus === status;
                return (
                  <button
                    key={status}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelectedStatus(status)}
                    className={`inline-flex min-h-11 items-center px-3.5 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-colors active:scale-[0.97] ${
                      active
                        ? "border border-accent/60 bg-accent/15 text-accent"
                        : "border border-border-dark bg-surface-dark text-on-dark-muted hover:text-on-dark"
                    }`}
                  >
                    {status}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                variant="grid"
                onSelect={setSelectedProject}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center border border-dashed border-border-dark bg-surface-dark/40 px-6 py-16 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center border border-border-dark bg-surface-black text-on-dark-muted">
              <Search size={22} />
            </div>
            <h2 className="font-display text-xl font-bold uppercase tracking-tight text-on-dark">
              No builds matching filter
            </h2>
            <p className="mt-2 max-w-md font-mono text-xs text-on-dark-muted">
              No repositories found matching your current filter criteria.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-6 inline-flex min-h-11 items-center justify-center border border-accent px-5 py-2 font-sans text-xs font-bold uppercase tracking-wider text-accent transition-colors hover:bg-accent hover:text-surface-black active:scale-[0.97]"
            >
              Reset Filters
            </button>
          </div>
        )}
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
    </div>
  );
}
