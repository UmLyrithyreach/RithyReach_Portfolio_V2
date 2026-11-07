"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { type SkillCategory, skillCategories, skills, skillLevelLabel } from "@/lib/data";
import { SkillCard } from "@/components/skills/SkillCard";
import { ArchitectureBackdrop } from "@/components/skills/ArchitectureBackdrop";
import { SectionSeam } from "@/components/shared/SectionSeam";

type FilterOption = "All" | SkillCategory;

export default function Skills() {
  const [selected, setSelected] = useState<FilterOption>("All");
  const reducedMotion = useReducedMotion();

  const visibleSkills =
    selected === "All"
      ? skills
      : skills.filter((skill) => skill.category === selected);

  const countByCategory = (category: SkillCategory) =>
    skills.filter((skill) => skill.category === category).length;

  const expertCount = skills.filter((s) => skillLevelLabel(s.level) === "Expert").length;

  const summaryText =
    selected === "All"
      ? `${visibleSkills.length} total skills`
      : `${visibleSkills.length} ${selected.toLowerCase()} ${
          visibleSkills.length === 1 ? "skill" : "skills"
        }`;

  return (
    <section
      id="skills"
      data-season
      aria-labelledby="skills-head"
      className="relative isolate min-h-lvh w-full overflow-x-clip bg-surface-black text-on-dark"
    >
      {/* Seam dissolve carrying hero ground into skills dark section */}
      <SectionSeam carry="light" />

      {/* Blueprint architecture backdrop replacing F1 race track */}
      <ArchitectureBackdrop />

      {/* Main Content Container */}
      <div className="relative z-10 mx-auto w-full max-w-[84rem] px-6 pb-16 pt-8 sm:px-8 lg:px-10">
        {/* Header Row */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-accent">
              01 // ARCHITECTURE &amp; TOOLCHAIN
            </p>
            <h2
              id="skills-head"
              className="mt-2 font-display text-5xl font-bold uppercase leading-[0.95] tracking-tight text-accent sm:text-6xl"
            >
              <span className="block">THE STACK</span>
              <span className="block">
                SO FAR<span className="text-on-dark">.</span>
              </span>
            </h2>
            <div className="mt-4 h-[2px] w-10 bg-accent" aria-hidden="true" />
            <p className="mt-4 max-w-xl font-sans text-base uppercase leading-[1.2] text-on-dark-muted sm:text-lg">
              Technologies I work with to bring ideas to life.
            </p>
          </div>

          {/* Chamfered Stack Summary Plate */}
          <div
            className="relative h-[78px] w-full min-w-[280px] shrink-0 sm:w-[277px]"
            role="region"
            aria-label="Stack summary plate"
          >
            <svg
              viewBox="0 0 277 78"
              preserveAspectRatio="none"
              className="pointer-events-none absolute inset-0 h-full w-full"
              aria-hidden="true"
            >
              <path
                d="M0.5 0.5H276.5V69L268 77.5H0.5Z"
                fill="var(--surface-black, #090a0b)"
                stroke="var(--accent, #02d2e3)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
              <line
                x1="83.5"
                y1="0.5"
                x2="83.5"
                y2="77.5"
                stroke="var(--accent, #02d2e3)"
                strokeWidth="1"
                strokeOpacity="0.4"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            <div className="relative z-10 grid h-full grid-cols-[83px_1fr]">
              {/* Left Cell: Meridian Globe + Stacks */}
              <div className="flex flex-col items-center justify-center gap-1.5 px-2">
                <svg
                  viewBox="0 0 37 23"
                  className="h-[18px] w-[30px] stroke-accent"
                  strokeWidth="1"
                  fill="none"
                  aria-hidden="true"
                >
                  <ellipse cx="18.5" cy="11.5" rx="18" ry="11" />
                  <line x1="0.5" y1="11.5" x2="36.5" y2="11.5" />
                  <motion.ellipse
                    cx="18.5"
                    cy="11.5"
                    ry="11"
                    animate={
                      reducedMotion
                        ? { rx: 12 }
                        : { rx: [18, 0.5, 18, 0.5, 18] }
                    }
                    transition={{
                      duration: 10,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                </svg>
                <div className="font-mono text-[10px] font-bold tracking-tight uppercase">
                  <span className="text-on-dark">PERN</span>{" "}
                  <span className="text-accent">/ MERN</span>
                </div>
              </div>

              {/* Right Cell: Metrics List */}
              <dl className="flex flex-col justify-center gap-1 pl-3.5 pr-3 font-mono text-[11px] uppercase leading-none">
                <div className="flex items-baseline gap-1.5">
                  <dt className="font-bold text-accent">{skills.length}</dt>
                  <dd className="truncate text-on-dark">technologies</dd>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <dt className="font-bold text-accent">{expertCount}</dt>
                  <dd className="truncate text-on-dark">at expert level</dd>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <dt className="font-bold text-accent">2</dt>
                  <dd className="truncate text-on-dark">full stacks.</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div
          role="group"
          aria-label="Filter skills by category"
          className="mt-10 flex flex-wrap items-center gap-2.5"
        >
          <button
            type="button"
            data-testid="skill-filter-all"
            aria-pressed={selected === "All"}
            onClick={() => setSelected("All")}
            className={`inline-flex min-h-11 cursor-pointer items-center justify-center px-4 py-2 font-mono text-xs font-medium uppercase tracking-wider transition-[background-color,border-color,color,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] motion-reduce:transform-none ${
              selected === "All"
                ? "border border-accent bg-accent font-semibold text-surface-black shadow-[0_0_15px_rgba(2,210,227,0.25)]"
                : "border border-border-dark bg-surface-dark text-on-dark-muted [@media(hover:hover)]:hover:border-accent/60 [@media(hover:hover)]:hover:text-on-dark"
            }`}
          >
            <span>All</span>
            <span className="ml-1.5 opacity-80">({skills.length})</span>
          </button>

          {skillCategories.map((category) => {
            const isActive = selected === category;
            const count = countByCategory(category);
            return (
              <button
                key={category}
                type="button"
                data-testid={`skill-filter-${category.toLowerCase()}`}
                aria-pressed={isActive}
                onClick={() => setSelected(category)}
                className={`inline-flex min-h-11 cursor-pointer items-center justify-center px-4 py-2 font-mono text-xs font-medium uppercase tracking-wider transition-[background-color,border-color,color,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] motion-reduce:transform-none ${
                  isActive
                    ? "border border-accent bg-accent font-semibold text-surface-black shadow-[0_0_15px_rgba(2,210,227,0.25)]"
                    : "border border-border-dark bg-surface-dark text-on-dark-muted [@media(hover:hover)]:hover:border-accent/60 [@media(hover:hover)]:hover:text-on-dark"
                }`}
              >
                <span>{category}</span>
                <span className="ml-1.5 opacity-80">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Skills Grid */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleSkills.map((skill) => (
            <SkillCard
              key={skill.name}
              skill={skill}
              reducedMotion={Boolean(reducedMotion)}
            />
          ))}
        </div>

        {/* Bottom CLI Status Readout */}
        <div className="mt-10 flex items-center justify-between border-t border-border-dark/60 pt-6">
          <div className="flex items-center gap-2.5 font-mono text-xs text-on-dark-muted">
            <span
              className="inline-block h-2 w-2 rounded-full bg-accent"
              aria-hidden="true"
            />
            <span>
              &gt; stack.query(&quot;{selected.toLowerCase()}&quot;) &mdash;{" "}
              {summaryText}
            </span>
          </div>
          <div className="hidden font-mono text-xs uppercase tracking-widest text-on-dark-muted sm:block">
            [SYS_READY // {skills.length}_MODULES]
          </div>
        </div>
      </div>
    </section>
  );
}
