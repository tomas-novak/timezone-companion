import { useState } from "react";
import { DEMO_CITIES, type Example } from "@/lib/demoPresets";
import type { Zone } from "@/lib/storage";
import { firstReaderWithChip } from "@/lib/timeDetect";
import { ChatFrame } from "./ChatFrame";
import { ExampleSwitch } from "./MomentWrite";

export function MomentRead({ example, onExampleChange, you, inDemo, use24Hour }: { example: Example; onExampleChange: (id: Example["id"]) => void; you: Zone; inDemo: boolean; use24Hour: boolean }) {
  const preferred = inDemo ? you : DEMO_CITIES.find((z) => z.tz === "Asia/Qatar")!;
  const fallback = preferred.id === example.author.id ? firstReaderWithChip(example.expressions, example.author, DEMO_CITIES, use24Hour) : preferred;
  // A pick only lasts for the example and home city it was made on
  const key = `${example.id}|${you.tz}`;
  const [pick, setPick] = useState<{ key: string; id: string } | null>(null);
  const viewer = (pick?.key === key && DEMO_CITIES.find((z) => z.id === pick.id)) || fallback;

  return (
    <section id="read" className="scroll-mt-20 grid items-center gap-6 py-10 lg:grid-cols-[2fr_3fr] lg:gap-10">
      <div className="space-y-4">
        <h2 id="read-title" tabIndex={-1} className="outline-none text-2xl font-semibold tracking-tight sm:text-3xl">Every reader sees their own time</h2>
        <p className="text-muted-foreground">Switch who is reading. The words stay as written; each reader gets their own time.</p>
        <ExampleSwitch example={example} onExampleChange={onExampleChange} />
        <p className="text-sm text-muted-foreground">Tap the time to check everyone else.</p>
      </div>
      <ChatFrame
        messages={[{ id: example.id, author: example.author, text: example.text, expressions: example.expressions }]}
        cities={DEMO_CITIES}
        viewer={viewer}
        onViewerChange={(id) => setPick({ key, id })}
        use24Hour={use24Hour}
      />
    </section>
  );
}
