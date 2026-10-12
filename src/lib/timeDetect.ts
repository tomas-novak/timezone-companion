import { DateTime } from "luxon";
import { getWorkStatus, parseTimeToMinutes, type WorkStatus } from "./workStatus";
import type { Zone } from "./storage";
import { CITY_PRESETS, tzCity } from "./timezones";
import { locate, sanitize, type Expr, type ParseTimeRequest } from "./extraction";

// clock_change is set here, never by the model: the time falls in an hour a clock change skips or repeats
export type Flag = NonNullable<Expr["flag"]> | "clock_change";
export type TimeExpression = Omit<Expr, "flag"> & { flag?: Flag | null; start: number; end: number; utcInstant: string | null; endUtcInstant: string | null };
export type TimeChip = { type: "time"; time: string; weekday: string | null; status: WorkStatus; suffix: "" | "early" | "late" | "after hours" | "weekend" };
export type Chip = TimeChip | { type: "unclear"; flag: Flag | null };

export interface DetectionResult {
  status: "no-candidate" | "ready" | "pending" | "done" | "error";
  source: "live" | "cache" | null;
  request: ParseTimeRequest | null;
  response: unknown;
  expressions: TimeExpression[];
}

export interface ChatMessage {
  id: string;
  authorZoneId: string;
  text: string;
  createdAt: string;
  detection: DetectionResult;
}

// English and ASCII digits whatever the browser locale, to match the English copy
export const formatTime = (d: DateTime, use24Hour: boolean) => d.toFormat(use24Hour ? "HH:mm" : "h:mm a", { locale: "en" });

// Names come from the zone, not the label people typed, so a city renamed to a person never reaches the AI
export function teamZonesFor(zones: Zone[]): Record<string, string> {
  return Object.fromEntries(zones.map((z) => [CITY_PRESETS[z.tz]?.city ?? tzCity(z.tz), z.tz]));
}

// Luxon moves a skipped local time forward and silently picks one offset for a repeated one
const inClockChange = (d: DateTime, hhmm: string) => d.toISO()!.slice(11, 16) !== hhmm || d.getPossibleOffsets().length > 1;

// A manual controller: AbortSignal.timeout is missing in jsdom and in Safari before 16
export async function callParseTime(body: ParseTimeRequest): Promise<Expr[]> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch("/api/parse-time", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const expressions = res.ok ? sanitize(await res.json(), body.message, body.senderZone) : null;
    if (!expressions) throw new Error(`parse-time ${res.status}`);
    return expressions;
  } finally {
    clearTimeout(timer);
  }
}

export function toExpressions(exprs: Expr[], message: string, nowIso: string): TimeExpression[] {
  return locate(message, exprs).map((e) => {
    if (e.kind !== "exact" && e.kind !== "range") return { ...e, utcInstant: null, endUtcInstant: null };
    const zone = e.sourceZone!;
    const date = e.localDate ?? DateTime.fromISO(nowIso).setZone(zone).toISODate();
    const start = DateTime.fromISO(`${date}T${e.localTime}`, { zone });
    let end = e.endLocalTime ? DateTime.fromISO(`${date}T${e.endLocalTime}`, { zone }) : null;
    if (end && end <= start) end = end.plus({ days: 1 });
    if (inClockChange(start, e.localTime!) || (end && inClockChange(end, e.endLocalTime!)))
      return { ...e, kind: "ambiguous" as const, flag: "clock_change" as const, utcInstant: null, endUtcInstant: null };
    return { ...e, utcInstant: start.toUTC().toISO(), endUtcInstant: end?.toUTC().toISO() ?? null };
  });
}

export function chipFor(
  e: TimeExpression,
  reader: Zone,
  authorTz: string,
  use24Hour: boolean,
  opts: { keepSameOffset?: boolean } = {},
): Chip | null {
  // Unclear items have no instant, so "same zone" means the same offset now and in half a year
  if (!e.utcInstant) return sameOffsetEverywhere([reader.tz, authorTz], DateTime.now()) ? null : { type: "unclear", flag: e.flag };
  const t = DateTime.fromISO(e.utcInstant, { zone: "utc" });
  const src = t.setZone(e.sourceZone!);
  const local = t.setZone(reader.tz);
  const end = e.endUtcInstant ? DateTime.fromISO(e.endUtcInstant, { zone: "utc" }).setZone(reader.tz) : null;
  // A range can cross a clock change in only one of the two zones, so its end must match too
  const sameEnd = !end || end.offset === end.setZone(e.sourceZone!).offset;
  if (!opts.keepSameOffset && local.offset === src.offset && sameEnd) return null;
  // A range is as bad as its worst moment: its start or its last minute
  const moments = end ? [local, end.minus({ minutes: 1 })] : [local];
  const [worst, status] = moments
    .map((m) => [m, getWorkStatus(m, reader.tz, reader)] as const)
    .reduce((a, b) => (SEVERITY.indexOf(b[1]) > SEVERITY.indexOf(a[1]) ? b : a));
  const suffix =
    status === "working" ? "" : status === "reasonable" ? (isEarly(worst, reader) ? "early" : "late") : status === "outside" ? "after hours" : "weekend";
  return {
    type: "time",
    time: end ? `${formatTime(local, use24Hour)}–${formatTime(end, use24Hour)}` : formatTime(local, use24Hour),
    weekday: local.toISODate() === src.toISODate() ? null : local.toFormat("ccc", { locale: "en" }),
    status,
    suffix,
  };
}

const SEVERITY: WorkStatus[] = ["working", "reasonable", "outside", "weekend"];
const ahead = (from: number, to: number) => (((to - from) % 1440) + 1440) % 1440;

// Circular like getWorkStatus, so a night shift (22:00–06:00) reads 07:00 as late, not early
function isEarly(local: DateTime, reader: Zone) {
  const now = local.hour * 60 + local.minute;
  return ahead(now, parseTimeToMinutes(reader.workingStart)) < ahead(parseTimeToMinutes(reader.workingEnd), now);
}

// The author never sees a chip, so after sending the thread jumps to a reader who does
export function firstReaderWithChip(exprs: TimeExpression[], author: Zone, participants: Zone[], use24Hour: boolean) {
  const others = participants.filter((z) => z.id !== author.id);
  return others.find((z) => exprs.some((e) => chipFor(e, z, author.tz, use24Hour))) ?? others[0];
}

export function sameOffsetEverywhere(zones: string[], now: DateTime): boolean {
  const one = (t: DateTime) => new Set(zones.map((z) => t.setZone(z).offset)).size <= 1;
  return one(now) && one(now.plus({ days: 182 }));
}
