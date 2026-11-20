"use client";

// The footer's nav column (portfolio.md §6): five section links in Oswald, each label resolving
// letter by letter (the entrance lives in Contact.tsx). Below sm each is a full-width ruled row
// with an accent arrow at its end.

import type { MouseEvent } from "react";
import { scrollToTarget } from "@/lib/engine";
import { ARROW_PATH } from "@/lib/footer/geometry";

export const FOOTER_NAV = ["home", "skills", "works", "about", "contact"] as const;

export default function FooterNav() {
  const go = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    event.preventDefault();
    scrollToTarget(`#${id}`);
  };

  return (
    <nav className="footer-nav" aria-label="Footer">
      {FOOTER_NAV.map((id) => (
        <a key={id} href={`#${id}`} onClick={(event) => go(event, id)}>
          <span data-footer-nav>{id}</span>
          <svg className="footer-nav-arrow" viewBox="0 0 13.71 10.71" aria-hidden="true" focusable="false">
            <path d={ARROW_PATH} />
          </svg>
        </a>
      ))}
    </nav>
  );
}
