import { DateTime } from "luxon";
import type { Zone } from "./storage";
import { tzCity } from "./timezones";
import { chipFor, formatTime, type Flag, type TimeChip, type TimeExpression } from "./timeDetect";

export type StatusWord = "Working" | "Early" | "Late" | "After hours" | "Weekend";

export interface LandingRow {
  zone: Zone;
  role: "author" | "you" | "other";
  date: string;
  time: string;
  // null for the author and the reader: the author chose the time, the reader knows their own hours
  status: StatusWord | null;
}

const WORD: Record<TimeChip["suffix"], StatusWord> = { "": "Working", early: "Early", late: "Late", "after hours": "After hours", weekend: "Weekend" };

export const NOT_CONVERTED: Record<Flag, string> = {
  zone_unclear: "say which time zone",
  day_unclear: "say which day",
  ampm_unclear: "add am or pm",
  not_specific: "give an exact time",
  ampm_assumed: "give an exact time",
  clock_change: "pick a time outside the clock change",
};

export function landingRows(e: TimeExpression, cities: Zone[], author: Zone, viewer: Zone | null, use24Hour: boolean): LandingRow[] {
  if (!e.utcInstant) return [];
  const t = DateTime.fromISO(e.utcInstant, { zone: "utc" });
  return cities
    .filter((z) => viewer || z.id !== author.id)
    .map((z) => {
      const chip = chipFor(e, z, author.tz, use24Hour, { keepSameOffset: true }) as TimeChip;
      const role = z.id === author.id ? "author" : z.id === viewer?.id ? "you" : "other";
      // The author's row shows the time as written, which can name another city's time
      if (role === "author") {
        const named = e.sourceZone === author.tz ? "" : ` ${cities.find((c) => c.tz === e.sourceZone)?.city ?? tzCity(e.sourceZone!)} time`;
        return { zone: z, role, date: t.setZone(e.sourceZone!).toFormat("ccc d LLL", { locale: "en" }), time: sentAs(e, use24Hour) + named, status: null };
      }
      return { zone: z, role, date: t.setZone(z.tz).toFormat("ccc d LLL", { locale: "en" }), time: chip.time, status: role === "other" ? WORD[chip.suffix] : null };
    });
}

const ORDER: [StatusWord, string][] = [
  ["Weekend", "Weekend"],
  ["After hours", "After hours"],
  ["Late", "Late in the day"],
  ["Early", "Early in the day"],
];

export function headline(rowsPerTime: LandingRow[][]): string[] {
  const worst = new Map<string, { city: string; rank: number }>();
  for (const row of rowsPerTime.flat()) {
    const rank = ORDER.findIndex(([w]) => w === row.status);
    if (rank < 0) continue;
    const prev = worst.get(row.zone.id);
    if (!prev || rank < prev.rank) worst.set(row.zone.id, { city: row.zone.city, rank });
  }
  const lines = ORDER.flatMap(([, phrase], rank) => {
    const names = [...worst.values()].filter((w) => w.rank === rank).map((w) => w.city);
    return names.length ? [`${phrase} for ${names.length} ${names.length === 1 ? "city" : "cities"}: ${names.join(", ")}`] : [];
  });
  // The reader gets no status about themselves, so "every city" would include an unchecked one
  const reader = rowsPerTime.flat().some((r) => r.role === "you");
  return lines.length ? lines : [`Working hours for every ${reader ? "other " : ""}city`];
}

export function sentAs(e: TimeExpression, use24Hour: boolean) {
  const at = (iso: string) => formatTime(DateTime.fromISO(iso, { zone: "utc" }).setZone(e.sourceZone!), use24Hour);
  return e.endUtcInstant ? `${at(e.utcInstant!)}–${at(e.endUtcInstant)}` : at(e.utcInstant!);
}
