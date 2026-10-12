import { DateTime } from "luxon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatTime, type Chip, type Flag, type TimeChip as TimeChipData, type TimeExpression } from "@/lib/timeDetect";

const BASE = "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium";
const STYLE: Record<TimeChipData["status"], string> = {
  working: "badge-working",
  reasonable: `${BASE} bg-amber-400/25 text-foreground`,
  outside: "badge-outside",
  weekend: "badge-outside",
};
const UNCLEAR = `${BASE} border border-dashed border-muted-foreground/60 text-muted-foreground`;

const UNCLEAR_TOOLTIP: Record<Flag, string> = {
  zone_unclear: "could mean several time zones in this chat",
  day_unclear: "could mean more than one day",
  ampm_unclear: "could be morning or evening",
  not_specific: "has no exact time",
  ampm_assumed: "has no exact time",
  clock_change: "falls in an hour a clock change skips or repeats",
};

function sentAs(e: TimeExpression, sourceCity: string, use24Hour: boolean) {
  const src = DateTime.fromISO(e.utcInstant!, { zone: "utc" }).setZone(e.sourceZone!);
  const time = formatTime(src, use24Hour);
  const date = src.toFormat("ccc d LLL", { locale: "en" });
  const assumed = e.flag === "ampm_assumed" ? ` Read as ${e.localTime}.` : "";
  return { time, date, text: `Sent as ${time} ${sourceCity} time (${date})${assumed}` };
}

function TimeLabel({ chip }: { chip: TimeChipData }) {
  return (
    <>
      {chip.weekday && <b>{chip.weekday}</b>} {chip.time}
    </>
  );
}

const suffixText = (chip: TimeChipData) => (chip.suffix ? ` · ${chip.suffix}` : "");

export function TimeChip({ chip, e, sourceCity, use24Hour }: { chip: Chip; e: TimeExpression; sourceCity: string; use24Hour: boolean }) {
  let label: string;
  let tooltip: string;
  if (chip.type === "unclear") {
    tooltip = `"${e.text}" ${UNCLEAR_TOOLTIP[chip.flag ?? "not_specific"]}, so it wasn't converted.`;
    label = `Time unclear. ${tooltip}`;
  } else {
    const sent = sentAs(e, sourceCity, use24Hour);
    tooltip = sent.text;
    label = `${chip.weekday ? `${chip.weekday} ` : ""}${chip.time} your time. Sent as ${sent.time} ${sourceCity} time, ${sent.date}.`;
  }
  // Readers know their own hours, so their chip only converts; early/late/weekend is for the sender's pills
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" aria-label={label} className={`${chip.type === "unclear" ? UNCLEAR : STYLE.working} mx-1 align-baseline`}>
          {chip.type === "unclear" ? (
            "time unclear"
          ) : (
            <span dir="ltr">
              <span aria-hidden>→ </span>
              <TimeLabel chip={chip} /> your time
            </span>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

export function Pill({ city, chip }: { city: string; chip: TimeChipData }) {
  return (
    <span className={STYLE[chip.status]}>
      {city} <TimeLabel chip={chip} />
      {suffixText(chip)}
    </span>
  );
}
