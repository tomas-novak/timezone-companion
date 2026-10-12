import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { TimeChip } from "@/lib/timeDetect";
import { Pill } from "./TimeChip";

const pill = (time: string, status: TimeChip["status"], suffix: TimeChip["suffix"] = ""): TimeChip => ({ type: "time", time, weekday: null, status, suffix });

const PILLS: [string, TimeChip][] = [
  ["Tunis", pill("14:00", "working")],
  ["Muscat", pill("17:00", "reasonable", "late")],
  ["Doha", pill("16:00", "working")],
  ["New Delhi", pill("18:30", "reasonable", "late")],
];

function Frame({ title, caption, children }: { title: string; caption: string; children: ReactNode }) {
  return (
    <figure className="space-y-3">
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="border-b bg-muted/50 px-4 py-2 text-sm font-medium">{title}</div>
        <div className="space-y-3 p-4">{children}</div>
      </div>
      <figcaption className="text-sm text-muted-foreground">{caption}</figcaption>
    </figure>
  );
}

export function IntegrationPreview() {
  return (
    <div className="space-y-4">
      <div className="grid gap-6 lg:grid-cols-2">
        <Frame
          title="Team chat"
          caption="Concept: sent with the Timezone Companion action, each reader's Teams shows the time on their own device."
        >
          <div className="space-y-2 rounded-lg border p-3 shadow-sm">
            <p className="text-sm font-medium">Timezone Companion: how others will see it</p>
            <div className="flex flex-wrap gap-1.5">
              {PILLS.map(([city, chip]) => (
                <Pill key={city} city={city} chip={chip} />
              ))}
            </div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3 text-sm">
            <p>Can we meet Thursday at 3pm?</p>
            <p className="mt-1 font-medium">Thu 15 Oct, 16:00 (your time)</p>
          </div>
        </Frame>
        <Frame title="Email" caption="Concept: checked when you press Send. Readers see conversions in a side pane.">
          <div className="space-y-3 rounded-lg border p-3 shadow-sm">
            <p className="text-sm">Late in the day for 2 people: Muscat 17:00, New Delhi 18:30</p>
            <div className="flex gap-2">
              <Button type="button" size="sm" tabIndex={-1}>
                Send anyway
              </Button>
              <Button type="button" size="sm" variant="outline" tabIndex={-1}>
                Don't send
              </Button>
            </div>
          </div>
        </Frame>
      </div>
      <p className="text-sm text-muted-foreground">
        Concept only. In Teams, conversion applies to messages sent through the action, not every typed message. The Outlook check runs on
        web and desktop, not mobile.
      </p>
    </div>
  );
}
