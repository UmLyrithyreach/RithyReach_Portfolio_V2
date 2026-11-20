// The two bracket panels (portfolio.md §5): the school, and the four stats. On the right rail from
// lg; between sm and lg they trade places (CSS); hidden below sm. Entrances live in About.

import type { ReactNode } from "react";
import Brackets from "@/components/about/Brackets";

export const ABOUT_STATS: { label: string; figure: string; icon: ReactNode }[] = [
  {
    label: "response time",
    figure: "24h",
    icon: (
      <>
        <circle cx="15.5" cy="15.5" r="14" />
        <path d="M15.5 7V15.5L21 19" />
      </>
    ),
  },
  {
    label: "time zone",
    figure: "gmt+7",
    icon: (
      <>
        <circle cx="15.5" cy="15.5" r="14" />
        <ellipse cx="15.5" cy="15.5" rx="6" ry="14" />
        <path d="M1.5 15.5H29.5" />
      </>
    ),
  },
  {
    label: "year at cadt",
    figure: "2nd",
    icon: (
      <>
        <path d="M1.5 11L15.5 5L29.5 11L15.5 17Z" />
        <path d="M7 13.5V21C10 24 21 24 24 21V13.5" />
      </>
    ),
  },
  {
    label: "status",
    figure: "active",
    icon: <path d="M1.5 15.5H9L12 8L18 23L21 15.5H29.5" />,
  },
];

export default function Panels() {
  return (
    <>
      <Brackets className="about-school-frame" dataKey="school" />
      <p className="about-school" data-about-school>
        <strong>cadt</strong>
        <span>computer science</span>
        <span>software development</span>
      </p>

      <Brackets className="about-stats-frame" dataKey="stats" />
      <ul className="about-stats" role="list">
        {ABOUT_STATS.map((stat, row) => (
          <li key={stat.label} className="about-stat">
            {row > 0 && <span className="about-stat-rule" data-about-stat-rule aria-hidden="true" />}
            <div className="about-stat-row" data-about-stat-row>
              <svg className="about-stat-icon" viewBox="0 0 31 31" aria-hidden="true" focusable="false">
                {stat.icon}
              </svg>
              <p className="about-stat-text">
                <span className="about-stat-label">{stat.label}</span>{" "}
                <span className="about-stat-figure" data-about-stat-figure>{stat.figure}</span>
              </p>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
