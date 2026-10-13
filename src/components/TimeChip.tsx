import type { Chip, TimeChip as TimeChipData } from "@/lib/timeDetect";
import type { StatusWord } from "@/lib/landing";
import type { WorkStatus } from "@/lib/workStatus";

const BASE = "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium";
export const STATUS_STYLE: Record<StatusWord, string> = {
  Working: "badge-working",
  Early: `${BASE} bg-amber-400/25 text-foreground`,
  Late: `${BASE} bg-amber-400/25 text-foreground`,
  "After hours": "badge-outside",
  Weekend: "badge-outside",
};
const CHIP_STYLE: Record<WorkStatus, string> = {
  working: STATUS_STYLE.Working,
  reasonable: STATUS_STYLE.Late,
  outside: STATUS_STYLE["After hours"],
  weekend: STATUS_STYLE.Weekend,
};
const UNCLEAR = `${BASE} border border-dashed border-muted-foreground/60 text-muted-foreground`;

export function TimeLabel({ chip }: { chip: TimeChipData }) {
  return (
    <>
      {chip.weekday && <b>{chip.weekday}</b>} {chip.time}
    </>
  );
}

// Readers know their own hours, so the chip names no status; its colour still says when the time is outside them
export function TimeChip({ chip }: { chip: Chip }) {
  if (chip.type === "unclear") return <span className={`${UNCLEAR} mx-1 align-baseline`}>time unclear</span>;
  return (
    <span dir="ltr" className={`${CHIP_STYLE[chip.status]} mx-1 align-baseline`}>
      <span aria-hidden>→ </span>
      <TimeLabel chip={chip} /> your time
    </span>
  );
}
