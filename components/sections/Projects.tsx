// Section #works: the scroll-pinned project overview (components/works/WorksOverview.tsx), built on
// the Adaline feature-overview layout with this portfolio's projects. Tokens live in app/adaline.css.

import WorksOverview from "@/components/works/WorksOverview";

export default function Projects() {
  return (
    <section id="works" aria-labelledby="works-head" className="adaline">
      <h2 id="works-head" className="sr-only">Works</h2>
      <WorksOverview />
    </section>
  );
}
