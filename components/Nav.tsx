"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion, type Transition } from "framer-motion";
import { Briefcase, House, Mail, Menu, User, X } from "@/components/icons";
import { ThemeToggle } from "@/components/ThemeToggle";

const LINKS = [
  { label: "home", hash: "#home", id: "home", icon: House },
  { label: "about", hash: "#about", id: "about", icon: User },
  { label: "works", hash: "#works", id: "works", icon: Briefcase },
  { label: "contact", hash: "#contact", id: "contact", icon: Mail },
] as const;

function NavAnchor({
  hash,
  isHome,
  className,
  onClick,
  ariaCurrent,
  children,
}: {
  hash: string;
  isHome: boolean;
  className: string;
  onClick?: () => void;
  ariaCurrent?: boolean | "true" | "false" | "page";
  children: ReactNode;
}) {
  if (isHome) {
    return (
      <a
        href={hash}
        onClick={onClick}
        className={className}
        aria-current={ariaCurrent ? "true" : undefined}
      >
        {children}
      </a>
    );
  }
  return (
    <Link
      href={`/${hash}`}
      onClick={onClick}
      className={className}
      aria-current={ariaCurrent ? "true" : undefined}
    >
      {children}
    </Link>
  );
}

export function Nav() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("home");
  const headerRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const transition: Transition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.2, ease: "easeOut" };

  useEffect(() => {
    if (!isHome) return;

    const onHashChange = () => {
      const hashId = window.location.hash.replace("#", "");
      if (LINKS.some((l) => l.id === hashId)) {
        setActiveSection(hashId);
      }
    };

    window.addEventListener("hashchange", onHashChange);

    const sectionElements = LINKS.map(({ id }) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null,
    );

    if (sectionElements.length === 0) {
      return () => window.removeEventListener("hashchange", onHashChange);
    }

    const entryMap = new Map<string, IntersectionObserverEntry>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          entryMap.set(entry.target.id, entry);
        }

        const visibleEntries = Array.from(entryMap.values()).filter(
          (entry) => entry.isIntersecting,
        );

        if (visibleEntries.length > 0) {
          visibleEntries.sort((a, b) => {
            const distA = Math.abs(a.boundingClientRect.top - 64);
            const distB = Math.abs(b.boundingClientRect.top - 64);
            return distA - distB;
          });
          setActiveSection(visibleEntries[0].target.id);
        }
      },
      {
        rootMargin: "-64px 0px -40% 0px",
        threshold: [0, 0.2, 0.4, 0.6, 0.8, 1],
      },
    );

    for (const el of sectionElements) {
      observer.observe(el);
    }

    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 50
      ) {
        setActiveSection("contact");
      } else if (window.scrollY < 50) {
        setActiveSection("home");
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, [isHome]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    const onPointerDown = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [mobileOpen]);

  return (
    <header
      ref={headerRef}
      className="fixed inset-x-0 top-0 z-50 h-16 border-b border-border bg-background/80 backdrop-blur-md"
    >
      <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <NavAnchor
          hash="#home"
          isHome={isHome}
          className="inline-flex min-h-11 items-center text-lg font-bold tracking-tight text-foreground transition-opacity duration-150 ease-out hover:opacity-80"
        >
          <span className="text-accent">&lt;</span>RithyReach<span className="text-accent">/&gt;</span>
        </NavAnchor>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {LINKS.map(({ label, hash, id, icon: Icon }) => {
            const isActive = isHome && activeSection === id;
            return (
              <NavAnchor
                key={hash}
                hash={hash}
                isHome={isHome}
                ariaCurrent={isActive}
                onClick={() => {
                  if (isHome) setActiveSection(id);
                }}
                className={`group relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg px-4 text-sm font-medium transition-colors duration-150 ease-out ${
                  isActive
                    ? "text-accent"
                    : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId={shouldReduceMotion ? undefined : "activeNavPill"}
                    className="absolute inset-0 rounded-lg border border-accent/20 bg-accent/10"
                    initial={shouldReduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={transition}
                    aria-hidden="true"
                  />
                )}
                <span className="relative z-10 inline-flex items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{label}</span>
                </span>
                {isActive && (
                  <motion.span
                    layoutId={shouldReduceMotion ? undefined : "activeNavDot"}
                    className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-accent"
                    initial={shouldReduceMotion ? false : { opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={transition}
                    aria-hidden="true"
                  />
                )}
              </NavAnchor>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <NavAnchor
            hash="#contact"
            isHome={isHome}
            className="hidden min-h-11 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-white transition-[opacity,transform,background-color] duration-150 ease-out hover:bg-accent-hover active:scale-95 md:inline-flex"
          >
            <Mail className="h-4 w-4" />
            <span>Let&apos;s Talk</span>
          </NavAnchor>

          <ThemeToggle />

          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-panel"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-[opacity,transform] duration-150 ease-out hover:bg-muted active:scale-95 md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div
        id="mobile-nav-panel"
        hidden={!mobileOpen}
        className={`border-b border-border bg-card/95 backdrop-blur-md transition-[opacity,transform] duration-200 ease-out md:hidden ${
          mobileOpen ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0 pointer-events-none"
        }`}
      >
        <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6">
          <div className="mb-3 flex items-center justify-between border-b border-border pb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Navigation
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
              <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
              Online
            </span>
          </div>

          <nav aria-label="Mobile" className="flex flex-col gap-1">
            {LINKS.map(({ label, hash, id, icon: Icon }) => {
              const isActive = isHome && activeSection === id;
              return (
                <NavAnchor
                  key={hash}
                  hash={hash}
                  isHome={isHome}
                  ariaCurrent={isActive}
                  onClick={() => {
                    if (isHome) setActiveSection(id);
                    setMobileOpen(false);
                  }}
                  className={`flex min-h-11 items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-colors duration-150 ease-out ${
                    isActive
                      ? "border border-accent/20 bg-accent/10 text-accent font-semibold"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{label}</span>
                </NavAnchor>
              );
            })}

            <NavAnchor
              hash="#contact"
              isHome={isHome}
              onClick={() => setMobileOpen(false)}
              className="mt-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-white transition-[opacity,transform,background-color] duration-150 ease-out hover:bg-accent-hover active:scale-95"
            >
              <Mail className="h-4 w-4" />
              <span>Let&apos;s Talk</span>
            </NavAnchor>
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Nav;
