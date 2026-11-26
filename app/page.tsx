import Hero from "@/components/sections/Hero";
import Intro from "@/components/sections/Intro";
import Expertise from "@/components/sections/Expertise";
import Works from "@/components/sections/Works";
import Process from "@/components/sections/Process";
import { Pager } from "@/components/shared/Pager";
import { LoadingVeil } from "@/components/shared/LoadingVeil";

export default function HomePage() {
  return (
    <>
      <LoadingVeil />
      <div className="asset-errors" data-asset-errors role="alert" hidden />
      <main>
        <Pager
          slides={[
            { id: "home", label: "home", node: <Hero /> },
            { id: "intro", label: "intro", node: <Intro /> },
            { id: "expertise", label: "expertise", node: <Expertise /> },
            { id: "works", label: "works", node: <Works /> },
            { id: "process", label: "process", node: <Process /> },
          ]}
        />
      </main>
    </>
  );
}
