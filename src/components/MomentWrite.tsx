import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DEMO_CITIES, EXAMPLES, type Example } from "@/lib/demoPresets";
import { H2 } from "./PitchSections";
import { SendCheck } from "./TryIt";

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

export function MomentWrite({ example, onExampleChange, use24Hour }: { example: Example; onExampleChange: (id: Example["id"]) => void; use24Hour: boolean }) {
  return (
    <section id="write" className="grid items-center gap-6 rounded-2xl border bg-tint-cyan p-6 shadow-sm sm:p-10">
      <div className="space-y-4 text-center">
        <h2 className={H2}>Before you send, see your time in every city</h2>
        <p className="text-muted-foreground">Write in your own time. Before it goes out, you see what it means for every city.</p>
        <ExampleSwitch example={example} onExampleChange={onExampleChange} />
        <p className="text-sm text-muted-foreground">
          These examples replay a saved AI answer from Sat 17 Oct 2026, so the times never change. Your own message below calls the AI live.
        </p>
      </div>

      <div className="space-y-2">
        <SendCheck text={example.text} expressions={example.expressions} note="saved answer" you={example.author} cities={DEMO_CITIES} use24Hour={use24Hour} />
        <p className="text-sm text-muted-foreground">In Outlook this check would run when you press Send. In Teams it would be one button before you send.</p>
      </div>
    </section>
  );
}
