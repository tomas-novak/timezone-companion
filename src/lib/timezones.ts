import { DateTime, IANAZone } from "luxon";

export interface TimeZoneConfig {
  id: string;
  city: string;
  country: string;
  defaultWorkingDays: number[];
  defaultWorkingStart: string;
  defaultWorkingEnd: string;
  defaultReasonableStart: string;
  defaultReasonableEnd: string;
}

// Default working days: 1=Mon, 2=Tue, ... 7=Sun
export const TIMEZONE_CONFIGS: TimeZoneConfig[] = [
  {
    id: "Africa/Tunis",
    city: "Tunis",
    country: "Tunisia",
    defaultWorkingDays: [1, 2, 3, 4, 5], // Mon-Fri
    defaultWorkingStart: "09:00",
    defaultWorkingEnd: "17:00",
    defaultReasonableStart: "08:00",
    defaultReasonableEnd: "19:00",
  },
  {
    id: "Europe/Prague",
    city: "Prague",
    country: "Czech Republic",
    defaultWorkingDays: [1, 2, 3, 4, 5], // Mon-Fri
    defaultWorkingStart: "09:00",
    defaultWorkingEnd: "17:00",
    defaultReasonableStart: "08:00",
    defaultReasonableEnd: "19:00",
  },
  {
    id: "Europe/London",
    city: "London",
    country: "United Kingdom",
    defaultWorkingDays: [1, 2, 3, 4, 5], // Mon-Fri
    defaultWorkingStart: "09:00",
    defaultWorkingEnd: "17:00",
    defaultReasonableStart: "08:00",
    defaultReasonableEnd: "19:00",
  },
  {
    id: "Asia/Muscat",
    city: "Muscat",
    country: "Oman",
    defaultWorkingDays: [7, 1, 2, 3, 4], // Sun-Thu
    defaultWorkingStart: "09:00",
    defaultWorkingEnd: "17:00",
    defaultReasonableStart: "08:00",
    defaultReasonableEnd: "19:00",
  },
  {
    id: "Asia/Qatar",
    city: "Doha",
    country: "Qatar",
    defaultWorkingDays: [7, 1, 2, 3, 4], // Sun-Thu
    defaultWorkingStart: "09:00",
    defaultWorkingEnd: "17:00",
    defaultReasonableStart: "08:00",
    defaultReasonableEnd: "19:00",
  },
  {
    id: "Asia/Baghdad",
    city: "Baghdad",
    country: "Iraq",
    defaultWorkingDays: [7, 1, 2, 3, 4], // Sun-Thu
    defaultWorkingStart: "09:00",
    defaultWorkingEnd: "17:00",
    defaultReasonableStart: "08:00",
    defaultReasonableEnd: "19:00",
  },
  {
    id: "Asia/Kolkata",
    city: "New Delhi",
    country: "India",
    defaultWorkingDays: [1, 2, 3, 4, 5], // Mon-Fri
    defaultWorkingStart: "09:00",
    defaultWorkingEnd: "17:00",
    defaultReasonableStart: "08:00",
    defaultReasonableEnd: "19:00",
  },
];

export const DAYS_OF_WEEK = [
  { value: 1, short: "Mon", full: "Monday" },
  { value: 2, short: "Tue", full: "Tuesday" },
  { value: 3, short: "Wed", full: "Wednesday" },
  { value: 4, short: "Thu", full: "Thursday" },
  { value: 5, short: "Fri", full: "Friday" },
  { value: 6, short: "Sat", full: "Saturday" },
  { value: 7, short: "Sun", full: "Sunday" },
];

const canonicalTz = (tz: string) => new Intl.DateTimeFormat("en", { timeZone: tz }).resolvedOptions().timeZone;

// ponytail: relies on the engine canonicalizing renamed zones (ICU/Firefox do); otherwise aliases fall back to plain id equality
export function resolveHomeTz(homeTz: string | null): string {
  const tz = homeTz && IANAZone.isValidZone(homeTz)
    ? homeTz
    : Intl.DateTimeFormat().resolvedOptions().timeZone;
  return TIMEZONE_CONFIGS.find((zone) => canonicalTz(zone.id) === canonicalTz(tz))?.id ?? tz;
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
  const hours = Math.round(start.plus({ days: 1 }).diff(start, "hours").hours);
  return Array.from({ length: hours }, (_, i) => start.plus({ hours: i }));
}
