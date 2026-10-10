import { DateTime, IANAZone } from "luxon";

export interface CityPreset {
  city: string;
  country: string;
  workingDays: number[];
}

// Working days: 1=Mon, 2=Tue, ... 7=Sun
const MON_FRI = [1, 2, 3, 4, 5];
const SUN_THU = [7, 1, 2, 3, 4];

export const DEFAULT_HOURS = {
  workingStart: "09:00",
  workingEnd: "17:00",
  reasonableStart: "08:00",
  reasonableEnd: "19:00",
};

export const CITY_PRESETS: Record<string, CityPreset> = {
  "Africa/Tunis": { city: "Tunis", country: "Tunisia", workingDays: MON_FRI },
  "Europe/Prague": { city: "Prague", country: "Czech Republic", workingDays: MON_FRI },
  "Europe/London": { city: "London", country: "United Kingdom", workingDays: MON_FRI },
  "Asia/Muscat": { city: "Muscat", country: "Oman", workingDays: SUN_THU },
  "Asia/Qatar": { city: "Doha", country: "Qatar", workingDays: SUN_THU },
  "Asia/Baghdad": { city: "Baghdad", country: "Iraq", workingDays: SUN_THU },
  "Asia/Kolkata": { city: "New Delhi", country: "India", workingDays: MON_FRI },
  "Asia/Kuwait": { city: "Kuwait City", country: "Kuwait", workingDays: SUN_THU },
  "Africa/Algiers": { city: "Algiers", country: "Algeria", workingDays: SUN_THU },
  "Indian/Maldives": { city: "Malé", country: "Maldives", workingDays: SUN_THU },
  "Asia/Jakarta": { city: "Jakarta", country: "Indonesia", workingDays: MON_FRI },
};

export const MAX_ZONES = 8;

export const DEFAULT_TZS = ["Africa/Tunis", "Europe/Prague", "Asia/Muscat", "Asia/Qatar", "Asia/Kolkata"];

export const OOREDOO_TZS = [
  "Asia/Qatar",
  "Asia/Muscat",
  "Asia/Kuwait",
  "Asia/Baghdad",
  "Africa/Algiers",
  "Africa/Tunis",
  "Indian/Maldives",
  "Asia/Jakarta",
];

export const tzCity = (tz: string) => tz.split("/").pop()!.replace(/_/g, " ");

export function tzLabel(tz: string): string {
  return (
    new Intl.DateTimeFormat("en", { timeZone: tz, timeZoneName: "longGeneric" })
      .formatToParts(new Date())
      .find((part) => part.type === "timeZoneName")?.value ?? ""
  );
}

export function worldTimeZones(): string[] {
  // Chrome < 99, Firefox < 93 and Safari < 15.4 lack supportedValuesOf; offer the presets there
  const all = Intl.supportedValuesOf?.("timeZone") ?? Object.keys(CITY_PRESETS);
  return [...new Set(all.map(canonicalTz))];
}

export const DAYS_OF_WEEK = [
  { value: 1, short: "Mon", full: "Monday" },
  { value: 2, short: "Tue", full: "Tuesday" },
  { value: 3, short: "Wed", full: "Wednesday" },
  { value: 4, short: "Thu", full: "Thursday" },
  { value: 5, short: "Fri", full: "Friday" },
  { value: 6, short: "Sat", full: "Saturday" },
  { value: 7, short: "Sun", full: "Sunday" },
];

// Renamed IANA ids (tzdata "backward") that point at a preset zone; Chrome still lists some of them. Links to other places, such as
// Europe/Bratislava -> Europe/Prague or Asia/Bahrain -> Asia/Qatar, stay separate on purpose.
// ponytail: add entries here when a preset zone gains an alias
const TZ_ALIASES: Record<string, string> = {
  "Asia/Calcutta": "Asia/Kolkata",
  "Europe/Belfast": "Europe/London",
  GB: "Europe/London",
  "GB-Eire": "Europe/London",
};

export const canonicalTz = (tz: string) => TZ_ALIASES[tz] ?? tz;

export function resolveHomeTz(homeTz: string | null): string {
  const tz = homeTz && IANAZone.isValidZone(homeTz)
    ? homeTz
    : Intl.DateTimeFormat().resolvedOptions().timeZone;
  return canonicalTz(tz);
}

export function formatOffsetDiff(minutes: number): string {
  if (minutes === 0) return "0 h";
  const sign = minutes > 0 ? "+" : "−";
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `${sign}${h}${m ? `:${String(m).padStart(2, "0")}` : ""} h`;
}

export function getHomeDayHours(now: DateTime, homeTz: string): DateTime[] {
  const start = now.setZone(homeTz).startOf("day");
  // startOf("day") is 01:00 where DST starts at midnight; plus({ days: 1 }) keeps that 01:00, so snap back to the next day's own start
  const end = start.plus({ days: 1 }).startOf("day");
  const hours = Math.round(end.diff(start, "hours").hours);
  return Array.from({ length: hours }, (_, i) => start.plus({ hours: i }));
}
