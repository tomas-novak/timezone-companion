import { useEffect, useState, type FocusEvent } from "react";
import { useLocation } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MomentWrite } from "@/components/MomentWrite";
import { MomentRead } from "@/components/MomentRead";
import { TryIt } from "@/components/TryIt";
import { Ask, Build, Hero, Today, Trust } from "@/components/PitchSections";
import { useSettings } from "@/hooks/useSettings";
import { EXAMPLES, youFor, type Example } from "@/lib/demoPresets";

// Keyboard focus can land in a pinned card the next one covers; scroll back to where it sits in the flow
function revealCoveredCard(e: FocusEvent<HTMLDivElement>) {
  const card = (e.target as Element).closest<HTMLElement>(".card-stack > section");
  const next = card?.nextElementSibling;
  if (!card || !next || next.getBoundingClientRect().top >= card.getBoundingClientRect().bottom) return;
  if (!(e.target as Element).matches(":focus-visible")) return;
  card.style.position = "static";
  card.scrollIntoView();
  card.style.position = "";
}

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
        <div className="card-stack" onFocus={revealCoveredCard}>
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
        </div>
        <Trust use24Hour={settings.use24Hour} />
        <Build />
        <Ask />
      </main>
      <Footer />
    </div>
  );
};

export default Concept;
