import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MomentWrite } from "@/components/MomentWrite";
import { MomentRead } from "@/components/MomentRead";
import { TryIt } from "@/components/TryIt";
import { Ask, Build, Hero, Today, Trust } from "@/components/PitchSections";
import { useSettings } from "@/hooks/useSettings";
import { EXAMPLES, youFor, type Example } from "@/lib/demoPresets";

const Concept = () => {
  const { settings, toggle24Hour, toggleDarkMode, setHomeTz } = useSettings();
  const { hash } = useLocation();
  const { you, cities, inDemo } = youFor(settings.homeTz);
  const [exampleId, setExampleId] = useState<Example["id"]>(EXAMPLES[0].id);
  const example = EXAMPLES.find((x) => x.id === exampleId)!;

  // The page is lazy-loaded, so the browser's own hash scroll runs before the target exists
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        use24Hour={settings.use24Hour}
        isDarkMode={settings.isDarkMode}
        onToggle24Hour={toggle24Hour}
        onToggleDarkMode={toggleDarkMode}
        homeTz={settings.homeTz}
        onHomeTzChange={setHomeTz}
        zones={settings.zones}
      />
      <main className="container max-w-6xl flex-1 space-y-16 py-10 sm:space-y-20">
        <Hero />
        <Today />
        <MomentWrite
          example={example}
          onExampleChange={setExampleId}
          onSent={() => {
            document.getElementById("read")?.scrollIntoView();
            document.getElementById("read-title")?.focus({ preventScroll: true });
          }}
          use24Hour={settings.use24Hour}
        />
        <MomentRead example={example} onExampleChange={setExampleId} you={you} inDemo={inDemo} use24Hour={settings.use24Hour} />
        <TryIt you={you} cities={cities} use24Hour={settings.use24Hour} />
        <Trust use24Hour={settings.use24Hour} />
        <Build />
        <Ask />
      </main>
      <Footer />
    </div>
  );
};

export default Concept;
