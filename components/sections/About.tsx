"use client";

import { useEffect, useState } from "react";
import { ContourCanvas } from "@/components/shared/ContourCanvas";
import { CornerBrackets } from "@/components/shared/CornerBrackets";
import { SectionSeam } from "@/components/shared/SectionSeam";
import { contactChannels, type ContactChannel } from "@/lib/data";
import { scrollToTarget } from "@/lib/engine";
import { getPortraitsReady } from "@/lib/portrait-maps";

const ENGINEERING_PRINCIPLES = [
  {
    title: "Full-Stack Architecture",
    description:
      "End-to-end PERN & MERN systems from relational schema design to App Router UI.",
  },
  {
    title: "Clean & Typed Code",
    description:
      "Maintainable TypeScript modules, predictable state, and automated Playwright testing.",
  },
  {
    title: "Frontend Craft",
    description:
      "Responsive layouts, restrained spring motion, and WCAG-accessible interactions.",
  },
  {
    title: "Team Collaboration",
    description:
      "Git workflows, code reviews, and agile delivery on multi-developer builds.",
  },
] as const;

const SPEC_FIGURES = [
  {
    label: "Response Time",
    figure: "24H",
    icon: (
      <svg
        viewBox="0 0 31 31"
        stroke="currentColor"
        strokeWidth={1}
        fill="none"
        className="h-6 w-6 shrink-0 text-foreground"
        aria-hidden="true"
      >
        <circle cx="15.5" cy="15.5" r="14" />
        <path d="M15.5 7V15.5L21 19" />
      </svg>
    ),
  },
  {
    label: "Time Zone",
    figure: "GMT+7",
    icon: (
      <svg
        viewBox="0 0 31 31"
        stroke="currentColor"
        strokeWidth={1}
        fill="none"
        className="h-6 w-6 shrink-0 text-foreground"
        aria-hidden="true"
      >
        <circle cx="15.5" cy="15.5" r="14" />
        <ellipse cx="15.5" cy="15.5" rx="6" ry="14" />
        <path d="M1.5 15.5H29.5" />
      </svg>
    ),
  },
  {
    label: "Year at CADT",
    figure: "2ND",
    icon: (
      <svg
        viewBox="0 0 31 31"
        stroke="currentColor"
        strokeWidth={1}
        fill="none"
        className="h-6 w-6 shrink-0 text-foreground"
        aria-hidden="true"
      >
        <path d="M1.5 11L15.5 5L29.5 11L15.5 17Z" />
        <path d="M7 13.5V21C10 24 21 24 24 21V13.5" />
      </svg>
    ),
  },
  {
    label: "Status",
    figure: "ACTIVE",
    icon: (
      <svg
        viewBox="0 0 31 31"
        stroke="currentColor"
        strokeWidth={1}
        fill="none"
        className="h-6 w-6 shrink-0 text-foreground"
        aria-hidden="true"
      >
        <path d="M1.5 15.5H9L12 8L18 23L21 15.5H29.5" />
      </svg>
    ),
  },
] as const;

const CHANNEL_ORDER: ContactChannel["platform"][] = [
  "Email",
  "Discord",
  "Telegram",
  "Facebook",
  "Instagram",
];

export default function About() {
  const [altUrl, setAltUrl] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    getPortraitsReady()
      .then(({ alt }) => {
        if (mounted && alt?.cutoutUrl) {
          setAltUrl(alt.cutoutUrl);
        }
      })
      .catch(() => {
        // Fallback handled by <img> src fallback
      });
    return () => {
      mounted = false;
    };
  }, []);

  const orderedChannels = CHANNEL_ORDER.map((name) =>
    contactChannels.find((c) => c.platform === name)
  ).filter((c): c is ContactChannel => Boolean(c));

  return (
    <section
      id="about"
      aria-labelledby="about-head"
      className="relative isolate w-full overflow-x-clip bg-background text-foreground"
    >
      <SectionSeam carry="dark" />
      <ContourCanvas colorToken="--paddock-contour" />

      <div className="relative z-10 mx-auto w-full max-w-[84rem] px-6 py-16 sm:px-8 lg:px-10 lg:py-20">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start lg:gap-12">
          {/* Left Column */}
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-2 bg-surface-black px-3 py-1 font-mono text-xs font-medium uppercase tracking-widest text-accent">
              {"03 // DEVELOPER PROFILE"}
            </span>

            <h2
              id="about-head"
              className="mt-4 font-display text-5xl font-bold uppercase leading-[0.95] tracking-tight text-foreground sm:text-6xl lg:text-7xl"
            >
              behind{" "}
              <span className="block">
                the code
                <span className="text-accent" aria-hidden="true">
                  .
                </span>
              </span>
            </h2>

            <div className="relative mt-8 border border-border-muted bg-background/90 p-6 backdrop-blur-[2px] sm:p-8">
              <CornerBrackets className="text-foreground" />
              <p className="font-sans text-base leading-relaxed text-foreground sm:text-lg">
                You can call me Reach or Kaizen — a web development student at
                CADT (Cambodia Academy of Digital Technology), building
                full-stack web applications with React, Next.js, Node.js,
                Express.js, and PostgreSQL.
              </p>
              <p className="mt-4 font-sans text-sm leading-relaxed text-muted-foreground sm:text-base">
                Trained across the PERN and MERN stacks, I focus on clean
                component architecture, responsive interfaces, and reliable
                backend APIs — turning complex product requirements into fast,
                accessible software.
              </p>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {ENGINEERING_PRINCIPLES.map((principle, index) => (
                  <div
                    key={principle.title}
                    className="border border-border-muted bg-surface-muted/50 p-4 transition-colors hover:border-accent/50"
                  >
                    <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      {`0${index + 1} //`}
                    </span>
                    <h3 className="mt-1 font-sans text-sm font-bold uppercase tracking-tight text-foreground">
                      {principle.title}
                    </h3>
                    <p className="mt-1 font-sans text-xs leading-relaxed text-muted-foreground">
                      {principle.description}
                    </p>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => scrollToTarget("#contact")}
                className="mt-8 inline-flex min-h-12 cursor-pointer items-center justify-center gap-3 border border-accent bg-surface-black px-6 py-3 font-sans text-sm font-bold uppercase tracking-wider text-accent transition-colors duration-150 [@media(hover:hover)]:hover:bg-accent [@media(hover:hover)]:hover:text-surface-black active:scale-[0.98] motion-reduce:transform-none"
              >
                <span>Let&apos;s Talk</span>
                <svg
                  viewBox="0 0 14 11"
                  className="h-3.5 w-3.5 stroke-current fill-none"
                  aria-hidden="true"
                >
                  <path
                    d="M0 5.5H12M7.5 10.5L12 5.5L7.5 0.5"
                    strokeWidth="1.5"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-5">
            <div className="relative overflow-hidden border border-border-muted bg-surface-muted/70">
              <CornerBrackets className="text-foreground" />
              <div className="relative aspect-[4/3] w-full overflow-hidden sm:aspect-[16/11] lg:aspect-[5/4]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={altUrl || "/image/less_professional.png"}
                  alt="Reach in a cap and T-shirt"
                  className="h-full w-full object-contain object-bottom"
                />
              </div>
              <div className="border-t border-border-muted bg-background/95 px-3 py-2 font-mono text-[11px] text-foreground/80 sm:text-xs">
                reach@cadt:~/profile $ whoami -&gt; Um Lyrithyreach (Kaizen)
              </div>
            </div>

            <div className="relative mt-4 border border-border-muted bg-background/90 p-5">
              <CornerBrackets className="text-foreground" />
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                {"// ACADEMIC TRACK"}
              </p>
              <p className="mt-1 font-sans text-sm uppercase text-foreground">
                <strong className="font-bold text-foreground">CADT</strong> ·
                Computer Science · Software Development
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
              {SPEC_FIGURES.map((spec) => (
                <div
                  key={spec.label}
                  className="relative border border-border-muted bg-background/90 p-4"
                >
                  <CornerBrackets className="text-foreground" size="0.5rem" />
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] uppercase tracking-tight text-foreground/70">
                      {spec.label}
                    </span>
                    {spec.icon}
                  </div>
                  <p className="mt-3 font-display text-3xl font-medium uppercase leading-none text-foreground">
                    {spec.figure}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Dark 5-Channel Developer Network Strip */}
      <div className="relative z-10 border-t border-border-dark bg-surface-black text-on-dark">
        <div className="mx-auto max-w-[84rem] px-6 py-8 sm:px-8 lg:px-10">
          <p className="font-mono text-xs uppercase tracking-wider text-on-dark-muted">
            {"// DIRECT CHANNELS — PREFERRED: TELEGRAM & EMAIL"}
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {orderedChannels.map((ch) => {
              const isPreferred = ch.platform === "Telegram";
              return (
                <a
                  key={ch.platform}
                  href={ch.url}
                  target={ch.url.startsWith("mailto:") ? undefined : "_blank"}
                  rel={
                    ch.url.startsWith("mailto:")
                      ? undefined
                      : "noopener noreferrer"
                  }
                  className={`group relative flex min-h-11 flex-col justify-between p-4 transition-colors ${
                    isPreferred
                      ? "border border-accent/60 bg-surface-dark"
                      : "border border-border-dark bg-surface-dark/40 hover:border-accent/40 hover:bg-surface-dark"
                  }`}
                >
                  {isPreferred && (
                    <CornerBrackets className="text-accent" size="0.5rem" />
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] uppercase text-on-dark-muted">
                      {ch.description}
                    </span>
                    {isPreferred && (
                      <span className="inline-flex items-center gap-1.5 bg-accent/20 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-accent">
                        <span
                          className="inline-block h-1.5 w-1.5 rounded-full bg-accent animate-pulse"
                          aria-hidden="true"
                        />
                        PREFERRED
                      </span>
                    )}
                  </div>

                  <div className="mt-3">
                    <p className="font-display text-xl font-bold uppercase text-on-dark transition-colors group-hover:text-accent">
                      {ch.platform}
                    </p>
                    <p
                      className={`mt-1 truncate font-mono text-xs break-all ${
                        isPreferred ? "text-accent" : "text-on-dark-muted"
                      }`}
                    >
                      {ch.handle}
                    </p>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
