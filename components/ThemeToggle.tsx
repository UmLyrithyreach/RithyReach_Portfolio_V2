"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Check, Monitor, Moon, Sun } from "@/components/icons";

export type Theme = "light" | "dark" | "system";

const THEME_EVENT = "portfolio-theme-change";

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  try {
    const raw = localStorage.getItem("theme");
    return raw === "light" || raw === "dark" || raw === "system" ? raw : "dark";
  } catch {
    return "dark";
  }
}

function applyTheme(next: Theme) {
  const root = document.documentElement;
  const resolved =
    next === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : next;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
}

function subscribeTheme(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(THEME_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(THEME_EVENT, callback);
  };
}

const ITEMS: { value: Theme; label: string; testId: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Light", testId: "theme-light", Icon: Sun },
  { value: "dark", label: "Dark", testId: "theme-dark", Icon: Moon },
  { value: "system", label: "System", testId: "theme-system", Icon: Monitor },
];

export function ThemeToggle() {
  const theme = useSyncExternalStore<Theme>(subscribeTheme, readStoredTheme, () => "dark");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (theme !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [theme]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  function selectTheme(next: Theme) {
    try {
      localStorage.setItem("theme", next);
    } catch {
      // ponytail: ignore storage quota/privacy failures; in-memory DOM class still updates.
    }
    applyTheme(next);
    window.dispatchEvent(new Event(THEME_EVENT));
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        data-testid="theme-toggle"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-[opacity,transform,background-color] duration-150 ease-out hover:bg-muted active:scale-95"
      >
        <Sun className="block h-5 w-5 dark:hidden" />
        <Moon className="hidden h-5 w-5 dark:block" />
        <span className="sr-only">Toggle theme</span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Theme"
          className="absolute right-0 mt-2 w-40 origin-top-right rounded-lg border border-border bg-card p-1 shadow-lg transition-[opacity,transform] duration-150 ease-out"
        >
          {ITEMS.map(({ value, label, testId, Icon }) => {
            const checked = theme === value;
            return (
              <button
                key={value}
                type="button"
                role="menuitemradio"
                aria-checked={checked}
                data-testid={testId}
                onClick={() => selectTheme(value)}
                className="flex min-h-11 w-full items-center gap-2.5 rounded-md px-3 text-sm text-foreground transition-opacity duration-150 ease-out hover:bg-muted"
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 text-left">{label}</span>
                {checked && <Check className="h-4 w-4 text-accent" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ThemeToggle;
