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

export type WorkStatus = "working" | "outside" | "weekend";

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
  const startMins = parseTimeToMinutes(settings.workingStart);
  const endMins = parseTimeToMinutes(settings.workingEnd);

  // Handle overnight range
  if (endMins <= startMins) {
    // Overnight: e.g., 22:00 - 06:00
    if (currentMins >= startMins || currentMins < endMins) {
      return "working";
    }
  } else {
    // Normal range
    if (currentMins >= startMins && currentMins < endMins) {
      return "working";
    }
  }

  return "outside";
}
