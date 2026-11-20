import Hero from "@/components/sections/Hero";
import Skills from "@/components/sections/Skills";
import Projects from "@/components/sections/Projects";
import About from "@/components/sections/About";
import Contact from "@/components/sections/Contact";
import { Pager } from "@/components/shared/Pager";
import { LoadingVeil } from "@/components/shared/LoadingVeil";
import { ScrollRail } from "@/components/shared/ScrollRail";

export default function HomePage() {
  return (
    <>
      <LoadingVeil />
      <div className="asset-errors" data-asset-errors role="alert" hidden />
      <main>
        <Pager
          slides={[
            { id: "home", label: "home", tone: "light", ownNav: true, node: <Hero /> },
            { id: "skills", label: "skills", tone: "light", node: <Skills /> },
            { id: "works", label: "works", tone: "light", node: <Projects /> },
            { id: "about", label: "about", tone: "light", node: <About /> },
            { id: "contact", label: "contact", tone: "dark", node: <Contact /> },
          ]}
        />
      </main>
      <ScrollRail />
    </>
  );
}
