"use client";

import { useEffect, useState } from "react";
import { ContourCanvas } from "@/components/shared/ContourCanvas";
import { CornerBrackets } from "@/components/shared/CornerBrackets";
import ContactForm from "@/components/contact/ContactForm";
import { connectCopy, email, socials } from "@/lib/data";
import { scrollToTarget } from "@/lib/engine";
import { getPortraitsReady } from "@/lib/portrait-maps";

const NAV_LINKS = [
  { label: "home", href: "#home" },
  { label: "skills", href: "#skills" },
  { label: "works", href: "#works" },
  { label: "about", href: "#about" },
  { label: "contact", href: "#contact" },
] as const;

export default function Contact() {
  const [proUrl, setProUrl] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    getPortraitsReady()
      .then(({ pro }) => {
        if (mounted && pro?.cutoutUrl) {
          setProUrl(pro.cutoutUrl);
        }
      })
      .catch(() => {
        // Fallback handled by <img> src fallback
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section
      id="contact"
      data-footer
      aria-labelledby="contact-head"
      className="relative isolate w-full overflow-x-clip bg-accent p-3 sm:p-4"
    >
      <div className="relative overflow-hidden bg-surface-black text-on-dark">
        <ContourCanvas colorToken="--footer-contour" />

        <div className="relative z-10 mx-auto w-full max-w-[84rem] px-6 py-14 sm:px-8 lg:px-10 lg:py-20">
          <div className="flex flex-col gap-6 border-b border-border-dark pb-10 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-sans text-2xl font-bold tracking-tight text-on-dark">
                <span className="text-accent" aria-hidden="true">
                  &lt;
                </span>{" "}
                RithyReach{" "}
                <span className="text-accent" aria-hidden="true">
                  /&gt;
                </span>
              </p>
              <p className="mt-3 max-w-md font-mono text-xs uppercase tracking-wider text-on-dark-muted">
                {connectCopy}
              </p>
            </div>

            <h2
              id="contact-head"
              className="font-display text-5xl font-bold uppercase leading-[0.95] tracking-tight text-accent sm:text-6xl sm:text-right"
            >
              let&apos;s build{" "}
              <span className="block">
                together
                <span className="text-on-dark" aria-hidden="true">
                  .
                </span>
              </span>
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-7">
              <div className="relative border border-border-dark bg-surface-dark p-6 sm:p-8">
                <CornerBrackets className="text-accent" />
                <div className="mb-6 flex items-center justify-between border-b border-border-dark pb-4 font-mono text-xs uppercase tracking-wider text-on-dark-muted">
                  <span>POST /api/contact — DIRECT MESSAGE DISPATCH</span>
                  <span
                    className="inline-block h-2 w-2 rounded-full bg-accent animate-pulse"
                    aria-hidden="true"
                  />
                </div>
                <ContactForm />
              </div>
            </div>

            <div className="flex flex-col justify-between gap-8 lg:col-span-5">
              <nav aria-label="Footer" className="space-y-4">
                <p className="font-mono text-xs uppercase tracking-widest text-on-dark-muted">
                  {"// NAVIGATION INDEX"}
                </p>
                <ul className="space-y-2.5">
                  {NAV_LINKS.map(({ label, href }) => (
                    <li key={label}>
                      <a
                        href={href}
                        onClick={(e) => {
                          e.preventDefault();
                          scrollToTarget(href);
                        }}
                        className="group inline-flex items-center gap-3 font-display text-2xl font-bold uppercase tracking-tight text-on-dark transition-colors duration-150 [@media(hover:hover)]:hover:text-accent sm:text-3xl"
                      >
                        <span>{label}</span>
                        <svg
                          viewBox="0 0 14 11"
                          className="h-3 w-3 stroke-accent fill-none opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                          aria-hidden="true"
                        >
                          <path
                            d="M0 5.5H12M7.5 10.5L12 5.5L7.5 0.5"
                            strokeWidth="1.5"
                          />
                        </svg>
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="space-y-4">
                <a
                  href={`mailto:${email}`}
                  className="group flex min-h-12 items-center justify-between border border-accent bg-transparent px-6 py-3 font-sans text-sm font-bold uppercase tracking-wider text-accent transition-colors duration-150 [@media(hover:hover)]:hover:bg-accent [@media(hover:hover)]:hover:text-surface-black"
                >
                  <span>Email Me — {email}</span>
                  <svg
                    viewBox="0 0 14 11"
                    className="h-3.5 w-3.5 stroke-current fill-none transition-transform duration-150 group-hover:translate-x-1"
                    aria-hidden="true"
                  >
                    <path
                      d="M0 5.5H12M7.5 10.5L12 5.5L7.5 0.5"
                      strokeWidth="1.5"
                    />
                  </svg>
                </a>

                <div className="flex items-center gap-4 border border-border-dark bg-surface-dark/80 p-3.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={proUrl || "/image/professional.png"}
                    alt=""
                    aria-hidden="true"
                    className="h-16 w-16 shrink-0 rounded-none border border-border-dark bg-surface-dark object-cover object-top"
                  />
                  <div className="min-w-0 font-mono text-xs text-on-dark-muted">
                    <p className="font-bold text-on-dark">Um Lyrithyreach</p>
                    <p className="text-accent">Full-Stack Web Developer</p>
                    <p className="text-[11px] text-on-dark-muted/80">
                      Phnom Penh, Cambodia (GMT+7)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-14 flex flex-col gap-4 border-t border-border-dark pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-mono text-xs uppercase text-on-dark-muted">
              © 2026 Um Lyrithyreach. All rights reserved.
            </p>

            <div className="flex flex-wrap items-center gap-6">
              {(["github", "linkedin", "telegram"] as const).map((key) => (
                <a
                  key={key}
                  href={socials[key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center font-sans text-xs font-bold uppercase tracking-wider text-on-dark transition-colors duration-150 [@media(hover:hover)]:hover:text-accent"
                >
                  <span>{key}</span>
                  <span className="vh"> (opens in a new tab)</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
