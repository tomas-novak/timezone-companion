import { useState } from "react";
import { DEMO_CITIES, type Example } from "@/lib/demoPresets";
import { worstReader } from "@/lib/timeDetect";
import { ChatFrame } from "./ChatFrame";
import { ExampleSwitch } from "./MomentWrite";
import { H2 } from "./PitchSections";

export function MomentRead({ example, onExampleChange, use24Hour }: { example: Example; onExampleChange: (id: Example["id"]) => void; use24Hour: boolean }) {
  // A pick only lasts for the example it was made on
  const [pick, setPick] = useState<{ key: string; id: string } | null>(null);
  const viewer = (pick?.key === example.id && DEMO_CITIES.find((z) => z.id === pick.id)) || worstReader(example.expressions, example.author, DEMO_CITIES, use24Hour);

  return (
    <section id="read" className="grid items-center gap-6 rounded-2xl border bg-tint-purple p-6 shadow-sm sm:p-10">
      <div className="space-y-4 text-center">
        <h2 className={H2}>Every reader sees their own time</h2>
        <p className="text-muted-foreground">Switch who is reading. The words stay as written; each reader gets their own time.</p>
        <ExampleSwitch example={example} onExampleChange={onExampleChange} />
        <p className="text-sm text-muted-foreground">Tap the time to check everyone else.</p>
      </div>
      <ChatFrame
        title={example.subject}
        messages={[{ id: example.id, author: example.author, text: example.text, expressions: example.expressions }]}
        cities={DEMO_CITIES}
        viewer={viewer}
        onViewerChange={(id) => setPick({ key: example.id, id })}
        use24Hour={use24Hour}
      />
    </section>
  );
}
