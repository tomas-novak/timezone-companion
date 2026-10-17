import { useRef, useState } from "react";
import { SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DEMO_CITIES, EXAMPLES, type Example } from "@/lib/demoPresets";
import { headline, landingRows } from "@/lib/landing";
import { Headline, MessageText } from "./TimesPopover";
import { H2 } from "./PitchSections";
import { TeamsWindow } from "./ChatFrame";

export function ExampleSwitch({ example, onExampleChange }: { example: Example; onExampleChange: (id: Example["id"]) => void }) {
  return (
    <ToggleGroup
      type="single"
      aria-label="Example message"
      value={example.id}
      onValueChange={(v) => v && onExampleChange(v as Example["id"])}
      className="flex-wrap justify-center"
    >
      {EXAMPLES.map((x) => (
        <ToggleGroupItem key={x.id} value={x.id} size="sm" variant="outline" className="h-auto min-h-8 rounded-2xl px-3 py-1 text-left">
          {x.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

export function MomentWrite({ example, onExampleChange, onSent, use24Hour }: { example: Example; onExampleChange: (id: Example["id"]) => void; onSent: () => void; use24Hour: boolean }) {
  // Keyed by example so switching the example closes the check
  const [checkFor, setCheckFor] = useState<Example["id"] | null>(null);
  const sendRef = useRef<HTMLButtonElement>(null);
  const open = checkFor === example.id;
  const others = DEMO_CITIES.filter((z) => z.id !== example.author.id);
  const lines = headline(example.expressions.filter((e) => e.utcInstant).map((e) => landingRows(e, DEMO_CITIES, example.author, null, use24Hour)));
  const edit = () => {
    setCheckFor(null);
    requestAnimationFrame(() => sendRef.current?.focus());
  };

  return (
    <section id="write" className="grid items-center gap-6 rounded-2xl border bg-tint-cyan p-6 shadow-sm sm:p-10">
      <div className="space-y-4 text-center">
        <h2 className={H2}>Before you send, see how your time lands</h2>
        <p className="text-muted-foreground">Write in your own time. Before it goes out, you see what it means for every city.</p>
        <ExampleSwitch example={example} onExampleChange={onExampleChange} />
      </div>

      <div className="space-y-2">
        <TeamsWindow title={example.subject}>
          <div className="space-y-3 p-4">
            <p className="text-xs text-muted-foreground">
              From {example.author.city} to the {others.map((z) => z.city).join(", ")} team
            </p>
            {open && (
              <div
                role="alertdialog"
                aria-labelledby="send-check-title"
                aria-describedby="send-check-lines"
                onKeyDown={(e) => e.key === "Escape" && edit()}
                className="space-y-3 rounded-md border bg-muted/40 px-4 py-3"
              >
                <p id="send-check-title" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Before you send
                </p>
                <div id="send-check-lines">
                  <Headline lines={lines} />
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <Button size="sm" variant="outline" autoFocus onClick={edit}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setCheckFor(null);
                      onSent();
                    }}
                  >
                    Send anyway
                  </Button>
                </div>
              </div>
            )}
            <div className="flex items-end gap-2 rounded-md border border-b-2 border-b-[#5B5FC7] px-3 py-2">
              <p dir="auto" className="min-h-16 flex-1 text-base leading-8">
                <MessageText text={example.text} expressions={example.expressions} cities={DEMO_CITIES} author={example.author} viewer={null} use24Hour={use24Hour} />
              </p>
              {!open && (
                <Button ref={sendRef} size="icon" variant="ghost" aria-label="Send" className="shrink-0 text-[#5B5FC7] hover:text-[#5B5FC7]" onClick={() => setCheckFor(example.id)}>
                  <SendHorizontal />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Hover or tap the highlighted time.</p>
          </div>
        </TeamsWindow>
        <p className="text-sm text-muted-foreground">In Outlook this check runs when you press Send. In Teams it is one button before you send.</p>
      </div>
    </section>
  );
}
