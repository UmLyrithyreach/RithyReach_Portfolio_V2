// The footer's foot row (portfolio.md §6): the copyright, the hollow "email me" button and the
// socials, all three ending 32 frame px above the foot. Each carries data-footer-foot for the
// entrance in Contact.tsx.

import { email, socials } from "@/lib/data";
import { ARROW_PATH, CTA, CTA_PATH } from "@/lib/footer/geometry";

const SOCIALS = ["github", "linkedin", "telegram"] as const;

export default function FooterFoot() {
  return (
    <>
      <p className="footer-copy" data-footer-foot>
        © 2026 Um Lyrithyreach. All rights reserved.
      </p>

      <a className="footer-cta" data-footer-foot href={`mailto:${email}`}>
        <svg
          className="footer-cta-frame"
          viewBox={`0 0 ${CTA.width} ${CTA.height}`}
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          <path className="footer-cta-flood" d={CTA_PATH} />
          <path className="footer-cta-outline" d={CTA_PATH} />
        </svg>
        <span className="footer-cta-label">
          email me
          <svg className="footer-cta-arrow" viewBox="0 0 13.71 10.71" aria-hidden="true" focusable="false">
            <path d={ARROW_PATH} />
          </svg>
        </span>
      </a>

      <ul className="footer-socials" data-footer-foot role="list">
        {SOCIALS.map((key) => (
          <li key={key}>
            <a href={socials[key]} target="_blank" rel="noopener">
              {key}
              <span className="vh"> (opens in a new tab)</span>
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}
