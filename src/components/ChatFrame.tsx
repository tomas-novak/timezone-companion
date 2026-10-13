import { useId } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Zone } from "@/lib/storage";
import type { TimeExpression } from "@/lib/timeDetect";
import { MessageText } from "./TimesPopover";

export interface FrameMessage {
  id: string;
  author: Zone;
  text: string;
  expressions: TimeExpression[];
  status?: "pending" | "error";
}

export function ChatFrame({
  messages,
  cities,
  viewer,
  onViewerChange,
  use24Hour,
}: {
  messages: FrameMessage[];
  cities: Zone[];
  viewer: Zone;
  onViewerChange: (id: string) => void;
  use24Hour: boolean;
}) {
  const labelId = useId();
  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b bg-muted/40 px-3 py-2">
        <span id={labelId} className="text-sm text-muted-foreground">Viewing as</span>
        <ToggleGroup type="single" aria-labelledby={labelId} value={viewer.id} onValueChange={(v) => v && onViewerChange(v)} className="flex-wrap justify-start">
          {cities.map((z) => (
            <ToggleGroupItem key={z.id} value={z.id} size="sm" variant="outline" className="h-8 px-2.5">
              {z.city}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <div role="log" className="space-y-3 p-3">
        {messages.map((m) => {
          const mine = m.author.id === viewer.id;
  return (
            <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
              <span className="text-xs text-muted-foreground">{m.author.city}</span>
              <p dir="auto" className={`max-w-[90%] rounded-lg px-3 py-2 text-sm leading-7 ${mine ? "bg-primary/15" : "border bg-background"}`}>
                <MessageText text={m.text} expressions={m.expressions} cities={cities} author={m.author} viewer={viewer} use24Hour={use24Hour} />
              </p>
              {m.status === "pending" && (
                <span className="text-xs text-muted-foreground">
                  Reading the time…
                </span>
              )}
              {m.status === "error" && (
                <span className="text-xs text-destructive">
                  Couldn't reach the AI.
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
