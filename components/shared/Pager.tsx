import React from "react";

export interface PagerSlide {
  id: string;
  label: string;
  node: React.ReactNode;
}

/** One continuous scroll page: every section stacked in order, anchor links scroll to them. */
export function Pager({ slides }: { slides: PagerSlide[] }) {
  return (
    <div className="onepage">
      {slides.map((s) => (
        <div key={s.id} className="onepage-section" data-section={s.id}>
          {s.node}
        </div>
      ))}
    </div>
  );
}
