import type { Zone } from "@/lib/storage";
import { chipFor, type DetectionResult, type Flag, type TimeChip } from "@/lib/timeDetect";
import { Pill } from "./TimeChip";

const NOT_CONVERTED: Record<Flag, string> = {
  zone_unclear: "say which time zone",
  day_unclear: "say which day",
  ampm_unclear: "add am or pm",
  not_specific: "give an exact time",
  ampm_assumed: "give an exact time",
  clock_change: "pick a time outside the clock change",
};

export function SenderPreview({
  detection,
  author,
  participants,
  use24Hour,
}: {
  detection: DetectionResult | null;
  author: Zone;
  participants: Zone[];
  use24Hour: boolean;
}) {
  if (!detection) return null;
  if (detection.status === "ready")
    return <p className="text-sm text-muted-foreground">Time found. The AI reads it when you press Send.</p>;
  if (detection.status === "no-candidate")
    return (
      <p className="text-sm text-muted-foreground">
        No time found. Write in English or Arabic and include a time, like "3pm", "15:00" or "<span dir="rtl">الساعة ٣</span>".
      </p>
    );
  if (detection.status === "pending") return <p role="status" className="text-sm text-muted-foreground">Detecting time...</p>;
  if (detection.status === "error")
    return (
      <p role="status" className="text-sm text-destructive">
        Couldn't reach the AI. Presets still work offline.
      </p>
    );

  const converted = detection.expressions.filter((e) => e.utcInstant);
  const unclear = detection.expressions.filter((e) => !e.utcInstant);
  const readers = participants.filter((z) => z.id !== author.id);
  const rows = converted.map((e) => ({
    e,
    pills: readers.map((z) => ({ z, chip: chipFor(e, z, author.tz, use24Hour, { keepSameOffset: true }) as TimeChip })),
  }));
  const flagged = new Set(rows.flatMap((r) => r.pills.filter((p) => p.chip.status === "outside" || p.chip.status === "weekend").map((p) => p.z.id)));
  const n = flagged.size;

  return (
    <div className={`space-y-2 rounded-lg border p-3 ${n ? "border-amber-400 bg-amber-400/10" : ""}`}>
      <p className="text-sm font-medium">How others will see it</p>
      {rows.length > 0 && (
        <p className="text-xs text-muted-foreground">
          You're in {author.city}. Each pill is that colleague's local time: green is working hours, amber is early or late, gray is after
          hours or their weekend.
        </p>
      )}
      {n > 0 && (
        <p className="text-sm">
          {n} {n === 1 ? "person" : "people"} after hours or on their weekend
        </p>
      )}
      {rows.map(({ e, pills }) => (
        <div key={e.start} className="flex flex-wrap gap-1.5">
          {pills.map(({ z, chip }) => (
            <Pill key={z.id} city={z.city} chip={chip} />
          ))}
        </div>
      ))}
      {unclear.map((e) => (
        <p key={e.start} className="text-sm text-muted-foreground">
          Not converted: {NOT_CONVERTED[e.flag ?? "not_specific"]}
        </p>
      ))}
      {!detection.expressions.length && <p className="text-sm text-muted-foreground">No times to convert.</p>}
    </div>
  );
}
