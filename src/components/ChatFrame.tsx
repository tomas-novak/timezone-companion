import { useId, type ReactNode } from "react";
import { Minus, Square, X } from "lucide-react";
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

const initials = (city: string) => {
  const words = city.split(" ");
  return (words.length > 1 ? words.map((w) => w[0]).join("") : city.slice(0, 2)).toUpperCase();
};

export function TeamsWindow({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="light overflow-hidden rounded-lg border bg-background text-foreground shadow-md">
      <div className="flex items-center justify-between gap-3 bg-[#EBEBEB] px-4 py-2 text-sm">
        <span className="truncate">{title}</span>
        <span aria-hidden className="flex items-center gap-4 text-neutral-600">
          <Minus className="size-4" />
          <Square className="size-3" />
          <X className="size-4" />
        </span>
      </div>
      {children}
    </div>
  );
}

export function TeamsMessage({ author, mine, children }: { author: Zone; mine: boolean; children: ReactNode }) {
  if (mine)
    return (
      <div className="flex flex-col items-end">
        <span className="sr-only">{author.city}</span>
        <div className="max-w-[85%] rounded-md bg-[#E8EBFA] px-3 py-2 text-sm leading-7 [overflow-wrap:anywhere]">{children}</div>
      </div>
    );
  return (
    <div className="flex items-start gap-2">
      <span aria-hidden className="mt-5 grid size-8 shrink-0 place-items-center rounded-full bg-[#F3D6E9] text-xs font-semibold text-[#6B2152]">
        {initials(author.city)}
      </span>
      <div className="flex min-w-0 flex-col items-start">
        <span className="text-xs text-muted-foreground">{author.city}</span>
        <div className="max-w-full rounded-md bg-[#F5F5F5] px-3 py-2 text-sm leading-7 [overflow-wrap:anywhere]">{children}</div>
      </div>
    </div>
  );
}

export function ChatFrame({
  title = "Team chat",
  messages,
  cities,
  viewer,
  onViewerChange,
  use24Hour,
}: {
  title?: string;
  messages: FrameMessage[];
  cities: Zone[];
  viewer: Zone;
  onViewerChange: (id: string) => void;
  use24Hour: boolean;
}) {
  const labelId = useId();
  return (
    <TeamsWindow title={title}>
      <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
        <span id={labelId} className="text-sm text-muted-foreground">Viewing as</span>
        <ToggleGroup type="single" aria-labelledby={labelId} value={viewer.id} onValueChange={(v) => v && onViewerChange(v)} className="flex-wrap justify-start">
          {cities.map((z) => (
            <ToggleGroupItem key={z.id} value={z.id} size="sm" variant="outline" className="h-8 px-2.5">
              {z.city}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <div role="log" className="space-y-3 p-4">
        {messages.map((m) => (
          <div key={m.id}>
            <TeamsMessage author={m.author} mine={m.author.id === viewer.id}>
              <p dir="auto">
                <MessageText text={m.text} expressions={m.expressions} cities={cities} author={m.author} viewer={viewer} use24Hour={use24Hour} />
              </p>
            </TeamsMessage>
            {m.status === "pending" && <span className="text-xs text-muted-foreground">Reading the time…</span>}
            {m.status === "error" && <span className="text-xs text-destructive">Couldn't reach the AI.</span>}
          </div>
        ))}
      </div>
    </TeamsWindow>
  );
}
