"use client";

import Image from "next/image";
import type { Project, ProjectStatus } from "@/lib/data";
import { ExternalLink, Github } from "@/components/icons";
import { CornerBrackets } from "@/components/shared/CornerBrackets";

export function EyeIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function CalendarIcon({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

export function CheckCircleIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const isInProgress = status === "In Progress";
  if (isInProgress) {
    return (
      <span className="inline-flex items-center gap-1.5 border border-accent/40 bg-accent/10 px-2.5 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wider text-accent">
        <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" aria-hidden="true" />
        <span>In Progress</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 border border-border-dark bg-surface-black px-2.5 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wider text-on-dark-muted">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
      <span>Shipped</span>
    </span>
  );
}

export interface ProjectCardProps {
  project: Project;
  onSelect?: (project: Project) => void;
  isHovered?: boolean;
  onHover?: () => void;
  onLeave?: () => void;
  className?: string;
  variant?: "showcase" | "grid";
}

export default function ProjectCard({
  project,
  onSelect,
  isHovered = false,
  onHover,
  onLeave,
  className = "",
}: ProjectCardProps) {
  return (
    <article
      data-testid="project-card"
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onFocusCapture={onHover}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          onLeave?.();
        }
      }}
      className={`group relative flex min-w-0 flex-col border border-border-dark bg-surface-dark text-on-dark transition-[border-color,opacity] duration-200 [@media(hover:hover)]:hover:border-accent/70 ${
        isHovered ? "border-accent/70 shadow-lg shadow-accent/5" : ""
      } ${className}`}
    >
      <CornerBrackets
        size="0.5rem"
        className="text-border-dark transition-colors duration-200 [@media(hover:hover)]:group-hover:text-accent/60"
      />

      {/* Top Window / Repo Header Bar */}
      <div className="flex items-center justify-between gap-2 border-b border-border-dark bg-surface-dark-raised/60 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="shrink-0 font-display text-xl font-bold leading-none text-accent">
            {project.number}
          </span>
          <span className="truncate font-mono text-xs text-on-dark-muted">
            ~/builds/{project.id}
          </span>
        </div>
        <div className="shrink-0">
          <StatusBadge status={project.status} />
        </div>
      </div>

      {/* Screenshot Viewport Frame */}
      <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-border-dark bg-surface-black">
        <Image
          src={project.image}
          alt={`${project.title} preview`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="object-cover object-top transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] [@media(hover:hover)]:group-hover:scale-[1.03] motion-reduce:transform-none"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface-black/60 via-transparent to-transparent opacity-40 transition-opacity duration-300 [@media(hover:hover)]:group-hover:opacity-10"
        />
      </div>

      {/* Engineering Spec Body */}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[11px] uppercase tracking-wider text-accent">
            {project.categories[0]} · {project.year}
          </span>
        </div>

        <h3 className="mt-1.5 break-words font-display text-2xl font-bold uppercase leading-[1.05] tracking-tight text-on-dark sm:text-[1.65rem]">
          {project.title}
        </h3>

        <p className="mt-3 break-words text-sm leading-relaxed text-on-dark-muted">
          {project.shortDescription || project.description}
        </p>

        {/* Tech Stack Summary & Chips */}
        <div className="mt-4 space-y-2">
          {project.stackSummary && (
            <div className="truncate font-mono text-[11px] text-accent">
              <span className="text-on-dark-muted">{"// "}</span>
              {project.stackSummary}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-1.5">
            {project.tech.slice(0, 4).map((item) => (
              <span
                key={item}
                className="border border-border-dark bg-surface-black px-2.5 py-1 font-mono text-[11px] text-on-dark-muted"
              >
                {item}
              </span>
            ))}
            {project.tech.length > 4 && (
              <span className="border border-border-dark/60 bg-surface-dark-raised/50 px-2 py-1 font-mono text-[11px] text-accent">
                +{project.tech.length - 4}
              </span>
            )}
          </div>
        </div>

        {/* Bottom Action Row */}
        <div className="mt-auto flex flex-wrap items-center gap-3 pt-5">
          {project.live && (
            <a
              data-testid="project-live"
              href={project.live}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 border border-accent bg-accent px-4 py-2 font-sans text-xs font-bold uppercase tracking-wider text-surface-black transition-[transform,background-color,border-color] duration-150 ease-out [@media(hover:hover)]:hover:bg-accent/90 active:scale-[0.97] motion-reduce:active:scale-100"
            >
              <span>Live Site</span>
              <ExternalLink size={14} />
              <span className="vh"> — {project.title} (opens in a new tab)</span>
            </a>
          )}
          {project.code && (
            <a
              data-testid="project-code"
              href={project.code}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 border border-accent/60 bg-surface-black px-4 py-2 font-sans text-xs font-bold uppercase tracking-wider text-accent transition-[transform,background-color,color] duration-150 ease-out [@media(hover:hover)]:hover:bg-accent [@media(hover:hover)]:hover:text-surface-black active:scale-[0.97] motion-reduce:active:scale-100"
            >
              <Github size={14} />
              <span>Source</span>
              <span className="vh"> — {project.title} source code (opens in a new tab)</span>
            </a>
          )}
          {onSelect && (
            <button
              type="button"
              onClick={() => onSelect(project)}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 border border-border-dark bg-surface-dark-raised/70 px-4 py-2 font-sans text-xs font-bold uppercase tracking-wider text-on-dark-muted transition-[transform,color,border-color] duration-150 ease-out [@media(hover:hover)]:hover:border-accent/50 [@media(hover:hover)]:hover:text-on-dark active:scale-[0.97] motion-reduce:active:scale-100"
            >
              <span>Specs</span>
              <span className="font-mono text-[10px] text-accent">→</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
