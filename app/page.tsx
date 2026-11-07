import Hero from "@/components/sections/Hero";
import Skills from "@/components/sections/Skills";
import Projects from "@/components/sections/Projects";
import About from "@/components/sections/About";
import Contact from "@/components/sections/Contact";
import Footer from "@/components/sections/Footer";
import { StickyStack } from "@/components/shared/StickyStack";

export default function HomePage() {
  return (
    <>
      <div className="asset-errors" data-asset-errors role="alert" hidden />
      <main>
        <StickyStack
          hero={<Hero />}
          skills={<Skills />}
          works={<Projects />}
        />
        <About />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
