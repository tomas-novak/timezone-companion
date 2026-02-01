import { DateTime } from "luxon";
import type { ZoneSettings } from "@/lib/storage";

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function getCurrentMinutes(now: DateTime, zone: string): number {
  const local = now.setZone(zone);
  return local.hour * 60 + local.minute;
}

export type WorkStatus = "working" | "reasonable" | "outside" | "weekend";

function isInTimeRange(currentMins: number, startMins: number, endMins: number): boolean {
  if (endMins <= startMins) {
    // Overnight range
    return currentMins >= startMins || currentMins < endMins;
  }
  // Normal range
  return currentMins >= startMins && currentMins < endMins;
}

export function getWorkStatus(
  now: DateTime,
  zone: string,
  settings: ZoneSettings
): WorkStatus {
  const local = now.setZone(zone);
  const dayOfWeek = local.weekday; // 1 = Monday, 7 = Sunday

  // Check if it's a working day
  if (!settings.workingDays.includes(dayOfWeek)) {
    return "weekend";
  }

  const currentMins = getCurrentMinutes(now, zone);
  const workStartMins = parseTimeToMinutes(settings.workingStart);
  const workEndMins = parseTimeToMinutes(settings.workingEnd);
  const reasonableStartMins = parseTimeToMinutes(settings.reasonableStart);
  const reasonableEndMins = parseTimeToMinutes(settings.reasonableEnd);

  // Check working hours first
  if (isInTimeRange(currentMins, workStartMins, workEndMins)) {
    return "working";
  }

  // Check reasonable hours
  if (isInTimeRange(currentMins, reasonableStartMins, reasonableEndMins)) {
    return "reasonable";
  }

  return "outside";
}
