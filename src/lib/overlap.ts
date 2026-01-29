import { DateTime, Interval } from "luxon";
import type { ZoneSettings } from "./storage";

interface TimeInterval {
  start: DateTime;
  end: DateTime;
}

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function getLocalIntervalsForDay(
  date: DateTime,
  zone: string,
  settings: ZoneSettings
): TimeInterval[] {
  const startMinutes = parseTimeToMinutes(settings.reasonableStart);
  const endMinutes = parseTimeToMinutes(settings.reasonableEnd);
  
  const dayStart = date.setZone(zone).startOf("day");
  const start = dayStart.plus({ minutes: startMinutes });
  
  // Handle overnight ranges
  if (endMinutes <= startMinutes) {
    // Crosses midnight: split into two intervals
    const midnight = dayStart.plus({ days: 1 });
    const endNextDay = dayStart.plus({ days: 1, minutes: endMinutes });
    
    return [
      { start, end: midnight },
      { start: midnight, end: endNextDay },
    ];
  }
  
  const end = dayStart.plus({ minutes: endMinutes });
  return [{ start, end }];
}

function intervalsToUtc(intervals: TimeInterval[]): TimeInterval[] {
  return intervals.map((i) => ({
    start: i.start.toUTC(),
    end: i.end.toUTC(),
  }));
}

function intersectTwo(a: TimeInterval, b: TimeInterval): TimeInterval | null {
  const start = a.start > b.start ? a.start : b.start;
  const end = a.end < b.end ? a.end : b.end;
  
  if (start >= end) return null;
  return { start, end };
}

function intersectIntervalLists(
  listA: TimeInterval[],
  listB: TimeInterval[]
): TimeInterval[] {
  const result: TimeInterval[] = [];
  
  for (const a of listA) {
    for (const b of listB) {
      const intersection = intersectTwo(a, b);
      if (intersection) {
        result.push(intersection);
      }
    }
  }
  
  return result;
}

export interface OverlapResult {
  found: boolean;
  start?: DateTime;
  end?: DateTime;
  duration?: number; // minutes
  localTimes?: Record<string, { start: string; end: string }>;
}

export function findNextOverlap(
  zones: string[],
  zoneSettings: Record<string, ZoneSettings>,
  searchDays = 7
): OverlapResult {
  const now = DateTime.now();
  
  for (let dayOffset = 0; dayOffset < searchDays; dayOffset++) {
    const searchDate = now.plus({ days: dayOffset });
    
    // Get UTC intervals for each zone for this day
    let allZoneIntervals: TimeInterval[][] = [];
    
    for (const zone of zones) {
      const settings = zoneSettings[zone];
      if (!settings) continue;
      
      const localIntervals = getLocalIntervalsForDay(searchDate, zone, settings);
      const utcIntervals = intervalsToUtc(localIntervals);
      allZoneIntervals.push(utcIntervals);
    }
    
    if (allZoneIntervals.length < zones.length) continue;
    
    // Intersect all intervals
    let overlaps = allZoneIntervals[0];
    for (let i = 1; i < allZoneIntervals.length; i++) {
      overlaps = intersectIntervalLists(overlaps, allZoneIntervals[i]);
    }
    
    // Find first overlap that starts after now
    for (const overlap of overlaps) {
      const effectiveStart = overlap.start < now ? now : overlap.start;
      
      if (effectiveStart < overlap.end) {
        const duration = overlap.end.diff(effectiveStart, "minutes").minutes;
        
        if (duration >= 15) { // Minimum 15 minutes overlap
          const localTimes: Record<string, { start: string; end: string }> = {};
          
          for (const zone of zones) {
            const localStart = effectiveStart.setZone(zone);
            const localEnd = overlap.end.setZone(zone);
            localTimes[zone] = {
              start: localStart.toFormat("HH:mm"),
              end: localEnd.toFormat("HH:mm"),
            };
          }
          
          return {
            found: true,
            start: effectiveStart,
            end: overlap.end,
            duration: Math.round(duration),
            localTimes,
          };
        }
      }
    }
  }
  
  return { found: false };
}

export function formatOverlapForCopy(
  result: OverlapResult,
  zones: { id: string; city: string }[]
): string {
  if (!result.found || !result.localTimes || !result.start) return "";
  
  const dateStr = result.start.setZone("Europe/Prague").toFormat("EEE, d LLL yyyy");
  let text = `Next overlap (${dateStr}):\n`;
  
  for (const zone of zones) {
    const times = result.localTimes[zone.id];
    if (times) {
      text += `${zone.city}: ${times.start}–${times.end}\n`;
    }
  }
  
  text += `Duration: ${result.duration} min`;
  
  return text;
}
