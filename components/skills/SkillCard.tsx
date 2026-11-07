"use client";

import { motion } from "framer-motion";
import { type Skill, skillLevelLabel } from "@/lib/data";
import { BrandIcon } from "@/components/skills/brandIcons";
import { CornerBrackets } from "@/components/shared/CornerBrackets";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export function SkillCard({
  skill,
  reducedMotion = false,
}: {
  skill: Skill;
  reducedMotion?: boolean;
}) {
  const levelLabel = skillLevelLabel(skill.level);
  const tierBadge = levelLabel.toUpperCase();
  const isExpert = tierBadge === "EXPERT";

  return (
    <motion.article
      data-testid="skill-card"
      initial={reducedMotion ? false : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: reducedMotion ? 0 : 0.24, ease: EASE_OUT }}
      className="group relative flex flex-col justify-between border border-border-dark bg-surface-dark p-5 transition-[border-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] [@media(hover:hover)]:hover:border-accent/60 sm:p-6"
    >
      <CornerBrackets
        size="0.5rem"
        className="text-border-dark/60 transition-colors duration-200 [@media(hover:hover)]:group-hover:text-accent/80"
      />

      {/* Top row: category path & tier badge */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs uppercase tracking-wider text-on-dark-muted">
          {"// "}{skill.category.toLowerCase()}
        </span>
        <span
          className={`inline-flex items-center border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider ${
            isExpert
              ? "border-accent/50 bg-accent/10 font-semibold text-accent"
              : "border-border-dark bg-surface-dark-raised text-on-dark-muted"
          }`}
        >
          {tierBadge}
        </span>
      </div>

      {/* Middle row: BrandIcon in dark-raised framed square + skill name */}
      <div className="my-5 flex items-center gap-3.5">
        <div
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center border border-border-dark bg-surface-dark-raised text-on-dark"
        >
          <BrandIcon name={skill.name} className="h-5 w-5" />
        </div>
        <h3 className="break-words font-sans text-lg font-bold uppercase tracking-tight text-on-dark">
          {skill.name}
        </h3>
      </div>

      {/* Bottom row: terminal proficiency bar & level readout */}
      <div className="space-y-2.5">
        <div
          role="progressbar"
          aria-label={`${skill.name} proficiency`}
          aria-valuenow={skill.level}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-[3px] w-full overflow-hidden bg-surface-dark-raised"
        >
          <motion.div
            initial={reducedMotion ? false : { scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: reducedMotion ? 0 : 0.28, ease: EASE_OUT }}
            style={{ width: `${skill.level}%`, transformOrigin: "left" }}
            className="h-full bg-accent"
          />
        </div>

        <div className="flex items-center justify-between font-mono text-xs text-on-dark-muted">
          <span className="lowercase">{levelLabel.toLowerCase()}</span>
          <span className="tabular-nums">{skill.level}%</span>
        </div>
      </div>
    </motion.article>
  );
}
