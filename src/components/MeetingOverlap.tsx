import { useState, useMemo } from "react";
import { Copy, Check, CalendarClock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ZoneSettings } from "@/lib/storage";
import { TIMEZONE_CONFIGS } from "@/lib/timezones";
import { findNextOverlap, formatOverlapForCopy } from "@/lib/overlap";
import { DateTime } from "luxon";

interface MeetingOverlapProps {
  zoneSettings: Record<string, ZoneSettings>;
  now: DateTime;
  use24Hour: boolean;
}

export function MeetingOverlap({ zoneSettings, now, use24Hour }: MeetingOverlapProps) {
  const [copied, setCopied] = useState(false);

  const zones = TIMEZONE_CONFIGS.map((z) => z.id);
  const result = useMemo(
    () => findNextOverlap(zones, zoneSettings),
    [zoneSettings, Math.floor(now.toMillis() / 60000)] // Update every minute
  );

  const handleCopy = async () => {
    const text = formatOverlapForCopy(
      result,
      TIMEZONE_CONFIGS.map((z) => ({ id: z.id, city: z.city }))
    );
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (time: string) => {
    if (use24Hour) return time;
    const [h, m] = time.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${m.toString().padStart(2, "0")} ${suffix}`;
  };

  return (
    <div className="settings-panel">
      <div className="flex items-center gap-2 mb-4">
        <CalendarClock size={20} className="text-primary" />
        <h3 className="font-semibold text-lg">Meeting Overlap</h3>
      </div>

      {result.found && result.localTimes && result.start ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Next window where all zones are within reasonable hours:
          </p>

          <div className="grid gap-2">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <span>
                {result.start.setZone("Europe/Prague").toFormat("EEE, d LLL yyyy")}
              </span>
              <span className="text-muted-foreground">•</span>
              <span>{result.duration} min</span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              {TIMEZONE_CONFIGS.map((zone) => {
                const times = result.localTimes![zone.id];
                return (
                  <div
                    key={zone.id}
                    className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2"
                  >
                    <span className="text-sm font-medium">{zone.city}</span>
                    <span className="text-sm text-muted-foreground font-mono">
                      {formatTime(times.start)}–{formatTime(times.end)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-2"
          >
            {copied ? (
              <>
                <Check size={14} />
                Copied!
              </>
            ) : (
              <>
                <Copy size={14} />
                Copy to clipboard
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-accent/10 text-accent-foreground">
          <AlertCircle size={20} className="shrink-0 mt-0.5 text-accent" />
          <div>
            <p className="font-medium">No overlap found in the next 7 days</p>
            <p className="text-sm mt-1 text-muted-foreground">
              Try widening the reasonable hours in settings to find a suitable
              meeting time.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
