import { useEffect, useRef, useState, type FocusEvent } from "react";
import { useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { MomentWrite } from "@/components/MomentWrite";
import { MomentRead } from "@/components/MomentRead";
import { TryIt } from "@/components/TryIt";
import { Ask, Build, Fix, Hero, Today, Trust } from "@/components/PitchSections";
import { useSettings } from "@/hooks/useSettings";
import { EXAMPLES, youFor, type Example } from "@/lib/demoPresets";

// Keyboard focus can land in a pinned card the next one covers; scroll back to where it sits in the flow
function revealCoveredCard(e: FocusEvent<HTMLDivElement>) {
  const card = (e.target as Element).closest<HTMLElement>(".card-stack > section");
  const next = card?.nextElementSibling;
  if (!card || !next || next.getBoundingClientRect().top >= card.getBoundingClientRect().bottom) return;
  if (!(e.target as Element).matches(":focus-visible")) return;
  card.style.position = "static";
  card.scrollIntoView({ behavior: "instant" });
  // A card taller than the screen can leave the focused control below the fold
  (e.target as Element).scrollIntoView({ block: "nearest", behavior: "instant" });
  card.style.position = "";
}

// Sticky cards have no in-flow position to scroll to, so step by most of a screen instead
export function ScrollHint() {
  const [atEnd, setAtEnd] = useState(false);
  const [progress, setProgress] = useState(0);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const ask = document.getElementById("ask");
    const main = document.getElementById("main");
    if (!ask || !main) return;
    // Full when the end of the page reaches the bottom of the screen, which is when the arrow hides
    const update = () => {
      const top = main.getBoundingClientRect().bottom;
      const end = top + window.scrollY - window.innerHeight;
      setProgress(end > 0 ? Math.min(1, window.scrollY / end) : 1);
      const hide = top <= window.innerHeight;
      // Hiding the focused hint would drop keyboard focus to the page body
      if (hide && document.activeElement === button.current) {
        const link = ask.querySelector<HTMLElement>("a, button");
        link?.focus({ preventScroll: true });
        // On a short screen the link can sit above the view; instant also cuts off the step's smooth scroll
        link?.scrollIntoView?.({ block: "nearest", behavior: "instant" });
      }
      setAtEnd(hide);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    // Opening details or a live result moves the end without a scroll or resize
    const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    ro?.observe(main);
    return () => {
      ro?.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  if (atEnd) return null;
  return (
    <Button
      ref={button}
      variant="outline"
      size="icon"
      aria-label="Scroll down"
      onClick={() => window.scrollBy({ top: window.innerHeight * 0.8 })}
      className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-full border-0 shadow-md"
    >
      <svg aria-hidden viewBox="0 0 40 40" className="absolute inset-0 !size-full -rotate-90">
        <circle cx="20" cy="20" r="18" fill="none" strokeWidth="2" className="stroke-border" />
        <circle cx="20" cy="20" r="18" fill="none" strokeWidth="2" pathLength={100} strokeDasharray={100} strokeDashoffset={100 - progress * 100} strokeLinecap="round" className="stroke-primary" />
      </svg>
      <ChevronDown aria-hidden className="motion-safe:animate-bounce" />
    </Button>
  );
}

const Concept = () => {
  const { settings, toggle24Hour, toggleDarkMode, setHomeTz } = useSettings();
  const { hash } = useLocation();
  const { you, cities } = youFor(settings.homeTz);
  const [exampleId, setExampleId] = useState<Example["id"]>(EXAMPLES[0].id);
  const example = EXAMPLES.find((x) => x.id === exampleId)!;

  // CSS cannot read an element's own height, and the phone stack pins each card by its bottom edge
  const stack = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (typeof ResizeObserver === "undefined") return;
    const header = document.querySelector("header");
    const ro = new ResizeObserver(() => {
      const pinned = header && getComputedStyle(header).position !== "static" ? header.offsetHeight : 0;
      stack.current?.style.setProperty("--header-h", `${pinned}px`);
      for (const s of stack.current?.children ?? []) (s as HTMLElement).style.setProperty("--h", `${(s as HTMLElement).offsetHeight}px`);
    });
    if (header) ro.observe(header);
    for (const s of stack.current?.children ?? []) ro.observe(s);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const prev = document.title;
    document.title = "Timezone Companion · AI demo";
    return () => {
      document.title = prev;
    };
  }, []);

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
      <ScrollHint />
      <main id="main" tabIndex={-1} className="container scroll-mt-24 outline-none max-w-6xl flex-1 space-y-16 py-10 sm:space-y-24">
        <Hero />
        <Today />
        <Fix />
        <div ref={stack} className="card-stack" onFocus={revealCoveredCard}>
          <MomentWrite example={example} onExampleChange={setExampleId} use24Hour={settings.use24Hour} />
          <MomentRead example={example} onExampleChange={setExampleId} use24Hour={settings.use24Hour} />
          <TryIt you={you} cities={cities} use24Hour={settings.use24Hour} />
        </div>
        <Trust use24Hour={settings.use24Hour} />
        <Build />
        <Ask />
      </main>
    </div>
  );
};

export default Concept;
