"use client";

// Process: how I work, in four steps, each shown with a real example from my projects (the CV).
// It opens with the shared expand box (components/shared/ExpandSection.tsx), dark, starting as a
// thin bar that opens into the screen while the title scales in. Then the section pins: a rail on
// the left fills with the scroll, and each step takes the stage in turn (its words on the left,
// a small drawing of the example on the right that draws itself in).
// Reduced motion: no expand and no pin; the steps are listed one under another, fully drawn.

import { useState, type ReactNode } from "react";
import { motion, useMotionValueEvent, useTransform, type MotionValue } from "framer-motion";
import { ExpandSection } from "@/components/shared/ExpandSection";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";

interface Step {
  name: string;
  line: string;
  body: string;
  from: string;
  visual: (on: boolean) => ReactNode;
}

const STEPS: Step[] = [
  {
    name: "Plan",
    line: "Understand the problem before the code.",
    body: "I start with the people who will use it. For Samki Digital Market we researched what small Cambodian businesses need, then mapped the system in UML, sequence and use case diagrams.",
    from: "Samki Digital Market",
    visual: (on) => <UseCaseDiagram on={on} />,
  },
  {
    name: "Build",
    line: "Keep each layer doing one job.",
    body: "Data, logic and UI live apart, so each can change without breaking the others. In Velotolouse that meant MVVM with Provider, over a data layer of models and repositories.",
    from: "Velotolouse",
    visual: (on) => <Layers on={on} />,
  },
  {
    name: "Ship",
    line: "Let the pipeline do the release.",
    body: "Every push builds the app on its own. For WiFiGuard I set up GitHub Actions to build the Android APK and the iOS IPA automatically.",
    from: "WiFiGuard",
    visual: (on) => <Pipeline on={on} />,
  },
  {
    name: "Iterate",
    line: "Fix it, then write it down.",
    body: "After launch I track down what breaks and leave notes for whoever comes next, including me.",
    from: "WiFiGuard and Automata Simulator",
    visual: (on) => <Fixes on={on} />,
  },
];

/** Progress spent on the title before the first step comes in. */
const TITLE_SHARE = 0.12;

/** Starts as a thin bar across the screen. */
const FROM = { wide: { width: "75%", height: "10px" }, narrow: { width: "100%", height: "10px" } };

export default function Process() {
  return (
    <ExpandSection id="process" labelledBy="pr-head" tone="dark" pinScreens={3} from={FROM}>
      {(progress) => <ProcessStage progress={progress} />}
    </ExpandSection>
  );
}

function ProcessStage({ progress }: { progress: MotionValue<number> }) {
  const reduceMotion = usePrefersReducedMotion();
  const stepOf = (p: number) => (p < TITLE_SHARE ? -1 : Math.min(STEPS.length - 1, Math.floor(((p - TITLE_SHARE) / (1 - TITLE_SHARE)) * STEPS.length)));
  const [active, setActive] = useState(-1);
  useMotionValueEvent(progress, "change", (p) => {
    const next = stepOf(p);
    setActive((a) => (a === next ? a : next));
  });
  const fill = useTransform(progress, (p) => Math.min(Math.max((p - TITLE_SHARE) / (1 - TITLE_SHARE), 0), 1));

  if (reduceMotion) {
    return (
      <div className="pr-list">
        <Title />
        {STEPS.map((step, i) => (
          <StepView key={step.name} step={step} index={i} on />
        ))}
      </div>
    );
  }

  return (
    <div className="pr-stage" data-started={active >= 0 || undefined}>
      <div className="pr-title-slot" data-shown={active < 0 || undefined}>
        <Title />
      </div>
      <ol className="pr-rail" aria-label="Steps">
        <motion.span className="pr-rail-fill" style={{ scaleY: fill }} aria-hidden="true" />
        {STEPS.map((step, i) => (
          <li key={step.name} data-on={i <= active || undefined} aria-current={i === active ? "step" : undefined}>
            {step.name}
          </li>
        ))}
      </ol>
      <div className="pr-steps">
        {STEPS.map((step, i) => (
          <div key={step.name} className="pr-step-slot" data-shown={i === active || undefined} inert={i !== active}>
            <StepView step={step} index={i} on={i === active} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Title() {
  return (
    <div className="pr-title">
      <div data-expand-heading>
        <h2 id="pr-head">
          How I
          <br />
          work.
        </h2>
        <p>Four steps I follow on every project, each with an example from one of them.</p>
      </div>
    </div>
  );
}

function StepView({ step, index, on }: { step: Step; index: number; on: boolean }) {
  return (
    <article className="pr-step" data-on={on || undefined}>
      <div className="pr-words">
        <p className="pr-count">
          Step {index + 1} of {STEPS.length}
        </p>
        <h3>{step.name}</h3>
        <p className="pr-line">{step.line}</p>
        <p className="pr-body">{step.body}</p>
      </div>
      <figure className="pr-visual">
        {step.visual(on)}
        <figcaption>From {step.from}</figcaption>
      </figure>
    </article>
  );
}

/* ---- the four drawings: line work in the text colour, drawn in when their step is on ---- */

function UseCaseDiagram({ on }: { on: boolean }) {
  const cases = ["List a product", "Pay with Bakong KHQR", "Track an order"];
  return (
    <svg className="pr-svg" viewBox="0 0 420 260" role="img" aria-label="Use case diagram: a seller and a buyer connected to listing a product, paying with Bakong KHQR, and tracking an order" data-on={on || undefined}>
      <rect className="pr-draw" x="110" y="14" width="200" height="232" rx="10" pathLength={1} />
      <text className="pr-svg-label" x="210" y="36" textAnchor="middle">Samki Digital Market</text>
      {cases.map((c, i) => (
        <g key={c}>
          <ellipse className="pr-draw" cx="210" cy={84 + i * 62} rx="86" ry="22" pathLength={1} style={{ transitionDelay: `${0.25 + i * 0.12}s` }} />
          <text className="pr-svg-text" x="210" y={88 + i * 62} textAnchor="middle">{c}</text>
        </g>
      ))}
      {[{ x: 50, label: "Seller", to: [0, 2] }, { x: 370, label: "Buyer", to: [1, 2] }].map((a) => (
        <g key={a.label}>
          <circle className="pr-draw" cx={a.x} cy="108" r="11" pathLength={1} />
          <path className="pr-draw" d={`M${a.x} 119 v34 M${a.x - 16} 131 h32 M${a.x} 153 l-13 22 M${a.x} 153 l13 22`} pathLength={1} />
          <text className="pr-svg-text" x={a.x} y="198" textAnchor="middle">{a.label}</text>
          {a.to.map((ci) => (
            <path key={ci} className="pr-draw pr-draw--faint" d={`M${a.x < 210 ? a.x + 14 : a.x - 14} 130 L${a.x < 210 ? 124 : 296} ${84 + ci * 62}`} pathLength={1} style={{ transitionDelay: "0.7s" }} />
          ))}
        </g>
      ))}
    </svg>
  );
}

function Layers({ on }: { on: boolean }) {
  const layers = [
    { name: "UI", what: "Screens and shared widgets" },
    { name: "Logic", what: "View models, with Provider" },
    { name: "Data", what: "Models, DTOs, repositories, Firebase" },
  ];
  return (
    <ol className="pr-layers" data-on={on || undefined}>
      {layers.map((l, i) => (
        <li key={l.name} style={{ transitionDelay: `${0.1 + i * 0.12}s` }}>
          <b>{l.name}</b>
          <span>{l.what}</span>
        </li>
      ))}
    </ol>
  );
}

function Pipeline({ on }: { on: boolean }) {
  const jobs = ["Push to GitHub", "Build the Android APK", "Build the iOS IPA", "Both builds ready to install"];
  return (
    <ol className="pr-pipeline" data-on={on || undefined}>
      {jobs.map((job, i) => (
        <li key={job} style={{ transitionDelay: `${0.15 + i * 0.22}s` }}>
          <span className="pr-tick" aria-hidden="true" />
          {job}
        </li>
      ))}
    </ol>
  );
}

function Fixes({ on }: { on: boolean }) {
  const fixes = [
    { what: "Restored Wi-Fi scanning on Android", where: "WiFiGuard" },
    { what: "Fixed the Firebase and iOS build configuration", where: "WiFiGuard" },
    { what: "Fixed input-handling bugs", where: "Automata Simulator" },
    { what: "Wrote the project documentation", where: "Automata Simulator" },
  ];
  return (
    <ul className="pr-fixes" data-on={on || undefined}>
      {fixes.map((f, i) => (
        <li key={f.what} style={{ transitionDelay: `${0.1 + i * 0.12}s` }}>
          <span className="pr-tick" aria-hidden="true" />
          <span>
            {f.what}
            <small>{f.where}</small>
          </span>
        </li>
      ))}
    </ul>
  );
}
