import type { ReactNode } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Zone } from "@/lib/storage";
import { tzCity } from "@/lib/timezones";
import { chipFor, type ChatMessage } from "@/lib/timeDetect";
import { TimeChip } from "./TimeChip";

function MessageText({ message, author, viewer, participants, use24Hour }: { message: ChatMessage; author: Zone; viewer: Zone; participants: Zone[]; use24Hour: boolean }) {
  const parts: ReactNode[] = [];
  let cursor = 0;
  for (const e of [...message.detection.expressions].sort((a, b) => a.start - b.start)) {
    if (e.start < cursor) continue;
    const chip = chipFor(e, viewer, author.tz, use24Hour);
    const sourceCity = e.sourceZone ? (participants.find((z) => z.tz === e.sourceZone)?.city ?? tzCity(e.sourceZone)) : "";
    parts.push(message.text.slice(cursor, e.start));
    parts.push(
      <mark key={e.start} className="rounded bg-primary/10 px-0.5 text-foreground">
        {message.text.slice(e.start, e.end)}
      </mark>,
    );
    if (chip) parts.push(<TimeChip key={`${e.start}-chip`} chip={chip} e={e} sourceCity={sourceCity} use24Hour={use24Hour} />);
    cursor = e.end;
  }
  parts.push(message.text.slice(cursor));
  return <>{parts}</>;
}

export function ChatThread({
  messages,
  participants,
  you,
  viewer,
  onViewerChange,
  use24Hour,
}: {
  messages: ChatMessage[];
  participants: Zone[];
  you: Zone;
  viewer: Zone;
  onViewerChange: (id: string) => void;
  use24Hour: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="shrink-0 text-sm text-muted-foreground">Viewing as</span>
        <ToggleGroup type="single" aria-label="Viewing as" value={viewer.id} onValueChange={(v) => v && onViewerChange(v)} className="justify-start">
          {participants.map((z) => (
            <ToggleGroupItem key={z.id} value={z.id} size="sm" variant="outline" className="shrink-0">
              {z.city}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      {participants.length === 1 && (
        <p className="text-sm text-muted-foreground">Everyone here is in one time zone. Add a city on the main page to see conversions.</p>
      )}
      <div role="log" className="max-h-[60vh] space-y-3 overflow-y-auto rounded-lg border bg-muted/30 p-3 lg:h-[480px] lg:max-h-none">
        {messages.length === 0 && <p className="text-sm text-muted-foreground">No messages yet. Type one or pick a preset.</p>}
        {messages.map((m) => {
          const author = participants.find((z) => z.id === m.authorZoneId) ?? you;
          const mine = author.id === viewer.id;
          return (
            <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
              <span className="text-xs text-muted-foreground">{author.city}</span>
              <p dir="auto" className={`max-w-[90%] rounded-lg px-3 py-2 text-sm leading-7 ${mine ? "bg-primary/15" : "bg-card border"}`}>
                <MessageText message={m} author={author} viewer={viewer} participants={participants} use24Hour={use24Hour} />
              </p>
              {m.detection.status === "pending" && (
                <span role="status" className="text-xs text-muted-foreground">
                  Detecting time...
                </span>
              )}
              {m.detection.status === "error" && (
                <span role="status" className="text-xs text-destructive">
                  Couldn't reach the AI. Presets still work offline.
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
