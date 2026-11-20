"use client";

// The stack so far (portfolio.md §3), on the cream ground: the circuit stage behind a left rail
// (heading, rule, intro, the skills list) and the standings plate bottom right.

import { useEffect, useRef } from "react";
import { gate, isReducedMotion, loopInView, motion, reveal, SPRINGS, type MotionHandle } from "@/lib/engine";
import { skillCategories, skillLevelLabel, skills } from "@/lib/data";
import SeasonStage from "@/components/skills/SeasonStage";

const HEAD_LINES = ["the stack", "so far"] as const;
const INTRO = "Technologies I work with to bring ideas to life.";
/** The two full stacks the table covers (Postgres or Mongo, Express, React, Node). */
const STACKS = ["PERN", "MERN"] as const;

const rows = skillCategories
  .map((category) => ({ category, items: skills.filter((s) => s.category === category) }))
  .filter((row) => row.items.length > 0);

const stats = [
  { figure: String(skills.length), label: "technologies" },
  { figure: String(skills.filter((s) => skillLevelLabel(s.level) === "Expert").length), label: "at expert level" },
  { figure: String(STACKS.length), label: "full stacks." },
];

export default function Skills() {
  const sectionRef = useRef<HTMLElement>(null);
  const globeRef = useRef<SVGSVGElement>(null);
  const meridianRef = useRef<SVGEllipseElement>(null);

  // Entrances (mode forward, enabled while the block is in view). Reduced motion: shown as is.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || isReducedMotion()) return;
    const q = <T extends Element = HTMLElement>(selector: string) => Array.from(section.querySelectorAll<T & HTMLElement>(selector));
    const motions: MotionHandle[] = [];

    q("[data-season-line]").forEach((line, index) => {
      motions.push(reveal(line, {
        by: "words", stagger: 110, config: SPRINGS.REVEAL, delayIn: index * 130, mode: "forward", text: HEAD_LINES[index],
      }));
    });
    motions.push(motion(q("[data-season-stop]")[0], {
      from: { opacity: 0 }, to: { opacity: 1 }, delayIn: 130 + 110, mode: "forward",
    }));
    motions.push(motion(q("[data-season-rule]")[0], {
      from: { opacity: 0, scaleX: 0 }, to: { opacity: 1, scaleX: 1 }, delayIn: 2 * 130, mode: "forward",
    }));
    motions.push(reveal(q("[data-season-intro]")[0], {
      by: "words", stagger: 34, config: SPRINGS.COPY_FAST, columnGap: "0.22em", delayIn: 2 * 130 + 90, mode: "forward", text: INTRO,
    }));
    q("[data-season-row]").forEach((row, index) => {
      motions.push(motion(row, {
        from: { opacity: 0, y: "0.5rem" }, to: { opacity: 1, y: 0 }, config: SPRINGS.ROW,
        delayIn: 2 * 130 + 260 + index * 90, mode: "forward",
      }));
    });
    motions.push(motion(q("[data-season-plate]")[0], {
      from: { opacity: 0, y: "0.75rem" }, to: { opacity: 1, y: 0 }, config: SPRINGS.REVEAL, delayIn: 260, mode: "forward",
    }));

    // Letter by letter; the text is passed so a second run (Strict Mode) never reads the split spans.
    const typeLetters = (el: HTMLElement, text: string, delayIn: number, columnGap = "0.3em") => {
      motions.push(reveal(el, { by: "letters", stagger: 22, config: SPRINGS.TYPE, delayIn, mode: "forward", columnGap, text }));
    };
    const [pern, mern] = q(".season-badge [data-season-type]");
    typeLetters(pern, STACKS[0], 430);
    typeLetters(mern, `/ ${STACKS[1]}`, 490);
    q(".season-stats > div").forEach((row, index) => {
      typeLetters(row.querySelector("dt")!, stats[index].figure, 430 + index * 110, "0.25em");
      typeLetters(row.querySelector("dd")!, stats[index].label, 430 + index * 110 + 70, "0.25em");
    });

    return gate(section, motions);
  }, []);

  // The plate's globe: the meridian turns once every 10s, paused off screen and under reduced motion.
  useEffect(() => {
    const badge = globeRef.current?.parentElement;
    const meridian = meridianRef.current;
    if (!badge || !meridian || isReducedMotion()) return;
    let elapsed = 0;
    let previous: number | null = null;
    return loopInView(badge, (time) => {
      if (previous !== null) elapsed += Math.min(64, Math.max(0, time - previous));
      previous = time;
      const turn = ((elapsed % 10000) / 10000) * Math.PI * 2;
      meridian.setAttribute("rx", Math.max(0.5, Math.abs(Math.cos(turn)) * 18).toFixed(3));
    });
  }, []);

  return (
    <section ref={sectionRef} id="skills" data-season aria-labelledby="skills-head" className="skills-light">
      <SeasonStage />
      <div className="season-copy">
        <div className="season-rail">
          <h2 id="skills-head" className="season-head">
            <span className="season-line" data-season-line>{HEAD_LINES[0]}</span>
            <span className="season-last">
              <span className="season-line" data-season-line>{HEAD_LINES[1]}</span>
              <span className="season-stop" data-season-stop aria-hidden="true">.</span>
            </span>
          </h2>
          <span className="season-rule" data-season-rule aria-hidden="true" />
          <p className="season-intro" data-season-intro>{INTRO}</p>
          <dl className="season-skills">
            {rows.map((row) => (
              <div key={row.category} className="season-skill-row" data-season-row>
                <dt>{row.category}</dt>
                <dd>
                  {row.items.map((skill, i) => (
                    <span key={skill.name} className="season-skill-item">
                      {i > 0 && <span className="season-skill-sep" aria-hidden="true">·</span>}
                      <span className="season-skill">
                        <span className="season-skill-name">{skill.name}</span>{" "}
                        <span className="season-skill-level">{skillLevelLabel(skill.level)}</span>
                      </span>
                    </span>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="season-plate" data-season-plate>
          <svg className="season-plate-frame" viewBox="0 0 277 78" preserveAspectRatio="none" aria-hidden="true" focusable="false">
            <path d="M0.5 0.5H276.5V69L268 77.5H0.5Z" />
            <line x1="83" y1="0.5" x2="83" y2="77.5" />
          </svg>
          <div className="season-badge">
            <svg ref={globeRef} className="season-globe" viewBox="0 0 37 23" aria-hidden="true" focusable="false">
              <ellipse cx="18.5" cy="11.5" rx="18" ry="11" />
              <line x1="0.5" y1="11.5" x2="36.5" y2="11.5" />
              <ellipse ref={meridianRef} cx="18.5" cy="11.5" rx="18" ry="11" />
            </svg>
            <p className="season-badge-type">
              <span className="season-badge-pern" data-season-type>{STACKS[0]}</span>{" "}
              <span className="season-badge-mern" data-season-type>/ {STACKS[1]}</span>
            </p>
          </div>
          <dl className="season-stats">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt data-season-type>{stat.figure}</dt>
                <dd data-season-type>{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
