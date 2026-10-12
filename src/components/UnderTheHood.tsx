import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { DetectionResult } from "@/lib/timeDetect";

const plural = (n: number) => `${n} expression${n === 1 ? "" : "s"}`;

function steps(d: DetectionResult | null, readers: number): [string, string][] {
  const filter =
    !d ? "waiting for a message" : d.status === "no-candidate" ? "no time found (English or Arabic only)" : "candidate found";
  const ai =
    !d || d.status === "no-candidate"
      ? "not called"
      : d.status === "ready"
        ? "called once you send"
        : d.status === "pending"
        ? "Detecting time..."
        : d.status === "error"
          ? "Couldn't reach the AI."
          : d.source === "cache"
            ? `cached response (demo mode): ${plural(d.expressions.length)}`
            : `extracted ${plural(d.expressions.length)}`;
  const conversion = d?.status === "done" ? `${readers} readers, no AI` : "not needed yet";
  return [
    ["Local filter", filter],
    ["AI", ai],
    ["Conversion", conversion],
  ];
}

function Json({ title, value }: { title: string; value: unknown }) {
  return (
    <Collapsible className="rounded-lg border">
      <CollapsibleTrigger className="group flex w-full items-center justify-between p-3 text-left text-sm font-medium">
        {title}
        <ChevronDown size={16} aria-hidden className="transition-transform group-data-[state=open]:rotate-180 motion-reduce:transition-none" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <pre className="overflow-x-auto border-t p-3 text-xs">{value === null ? "Nothing yet." : JSON.stringify(value, null, 2)}</pre>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function UnderTheHood({ detection, readers }: { detection: DetectionResult | null; readers: number }) {
  const list = steps(detection, readers);
  const reached = !detection ? 0 : detection.status === "no-candidate" ? 0 : detection.status === "done" ? 2 : 1;
  return (
    <div className="space-y-4">
      <ol className="grid gap-3 lg:grid-cols-3">
        {list.map(([name, text], i) => (
          <li key={name} aria-current={detection && i === reached ? "step" : undefined} className="rounded-lg border bg-card p-4">
            <p className="text-sm font-medium">
              {i + 1} {name}
            </p>
            <p className="text-sm text-muted-foreground">{text}</p>
          </li>
        ))}
      </ol>
      <div className="grid items-start gap-3 lg:grid-cols-2">
        <Json title={detection?.source === "live" ? "What was sent to the AI" : "What would be sent to the AI"} value={detection?.request ?? null} />
        <Json title="What came back" value={detection?.response ?? null} />
      </div>
      <p className="text-sm text-muted-foreground">
        The AI sees the message as you wrote it, the sender's time zone, the current date and the team's city list. The app adds no names
        or calendars, and the AI never learns who is reading: each reader's time is computed in this browser.
      </p>
    </div>
  );
}
