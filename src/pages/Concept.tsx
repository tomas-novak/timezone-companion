import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ChatDemo } from "@/components/ChatDemo";
import { IntegrationPreview } from "@/components/IntegrationPreview";
import { useSettings } from "@/hooks/useSettings";

const ROADMAP: [string, string][] = [
  ["Now", "Web tool and this demo."],
  ["Next", "A Teams compose action, piloted with one cross-country team."],
  ["Later", "A send-time check in Outlook and a reader pane."],
];

const PILL = "rounded-full border px-3 py-1 text-sm hover:bg-muted";

const Concept = () => {
  const { settings, toggle24Hour, toggleDarkMode, setHomeTz } = useSettings();
  const { hash } = useLocation();

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
      <main className="container max-w-6xl flex-1 space-y-16 py-10">
        <section id="top" className="space-y-4">
          <h1 className="text-3xl font-bold md:text-4xl">Times in team chat, converted for every reader</h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Across time zones and two work weeks, every "3pm" in chat leaves someone doing the maths or reading it on their day off.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link to="/" className={PILL}>
              Today: web tool
            </Link>
            <a href="#in-teams" className={PILL}>
              Next: inside Teams and Outlook
            </a>
          </div>
        </section>

        <ChatDemo zones={settings.zones} homeTz={settings.homeTz} use24Hour={settings.use24Hour} />

        <section id="in-teams" className="scroll-mt-20 space-y-4">
          <h2 className="text-2xl font-semibold">How it would work in Teams and Outlook</h2>
          <IntegrationPreview />
        </section>

        <section id="roadmap" className="scroll-mt-20 space-y-4">
          <h2 className="text-2xl font-semibold">Roadmap</h2>
          <div className="grid gap-4 lg:grid-cols-3">
            {ROADMAP.map(([when, what]) => (
              <div key={when} className="rounded-xl border bg-card p-4">
                <p className="font-medium">{when}</p>
                <p className="text-sm text-muted-foreground">{what}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Concept;
