"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

export function HeroPortrait() {
  const reducedMotion = useReducedMotion();

  return (
    <div className="relative mx-auto flex w-full max-w-[320px] flex-col items-center gap-3.5 py-3">
      {/* Subtle corner brackets inside container bounds */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1 left-2 h-6 w-6 border-t-2 border-l-2 border-border"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1 right-2 h-6 w-6 border-t-2 border-r-2 border-border"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-1 left-2 h-6 w-6 border-b-2 border-l-2 border-border"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-2 bottom-1 h-6 w-6 border-r-2 border-b-2 border-border"
      />

      {/* Ambient radial glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-6 -z-10 rounded-full bg-gradient-to-tr from-accent/20 via-purple-500/15 to-[#f7931e]/20 blur-2xl"
      />

      <motion.span
        animate={reducedMotion ? undefined : { opacity: [0.55, 1, 0.55] }}
        transition={
          reducedMotion
            ? undefined
            : { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
        }
        className="font-mono text-xs tracking-wide text-muted-foreground"
      >
        &lt;developer/&gt;
      </motion.span>

      <div className="relative aspect-square w-full max-w-[280px] rounded-full bg-gradient-to-br from-purple-500 via-accent to-[#f7931e] p-1 shadow-xl">
        <div className="relative h-full w-full overflow-hidden rounded-full border-2 border-background bg-card">
          <Image
            src="/portrait-light.jpg"
            alt="Um Lyrithyreach"
            width={280}
            height={280}
            priority
            className="block h-full w-full rounded-full object-cover dark:hidden"
          />
          <Image
            src="/portrait-dark.png"
            alt="Um Lyrithyreach"
            width={280}
            height={280}
            priority
            className="hidden h-full w-full rounded-full object-cover dark:block"
          />
        </div>
      </div>

      <motion.span
        animate={reducedMotion ? undefined : { opacity: [0.55, 1, 0.55] }}
        transition={
          reducedMotion
            ? undefined
            : { duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: 0.9 }
        }
        className="break-words text-center font-mono text-xs tracking-wide text-muted-foreground"
      >
        console.log(&quot;Hello World&quot;)
      </motion.span>
    </div>
  );
}
