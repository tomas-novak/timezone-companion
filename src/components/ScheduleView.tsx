import { useMemo, useRef, useEffect } from "react";
import { DateTime } from "luxon";
import type { ZoneSettings } from "@/lib/storage";
import { TIMEZONE_CONFIGS } from "@/lib/timezones";

interface ScheduleViewProps {
  zoneSettings: Record<string, ZoneSettings>;
  now: DateTime;
  use24Hour: boolean;
}

// Zone order for display
const ZONE_ORDER = [
  "Europe/Prague",
  "Africa/Tunis",
  "Asia/Qatar",
  "Asia/Muscat",
];

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function isWithinRange(hour: number, start: string, end: string): boolean {
  const hourMins = hour * 60;
  const startMins = parseTimeToMinutes(start);
  const endMins = parseTimeToMinutes(end);

  if (endMins <= startMins) {
    // Overnight range
    return hourMins >= startMins || hourMins < endMins;
  }
  return hourMins >= startMins && hourMins < endMins;
}

function formatHour(hour: number, use24Hour: boolean): string {
  if (use24Hour) {
    return `${hour.toString().padStart(2, "0")}:00`;
  }
  const suffix = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:00 ${suffix}`;
}

function formatTimeWithMinutes(dt: DateTime, use24Hour: boolean): string {
  return dt.toFormat(use24Hour ? "HH:mm" : "h:mm A");
}

export function ScheduleView({ zoneSettings, now, use24Hour }: ScheduleViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentTimeRef = useRef<HTMLDivElement>(null);

  // Get zone configs in display order
  const zones = useMemo(
    () =>
      ZONE_ORDER.map((id) => TIMEZONE_CONFIGS.find((z) => z.id === id)!).filter(
        Boolean
      ),
    []
  );

  // Get current hour position for scrolling
  const pragueNow = now.setZone("Europe/Prague");
  const currentHour = pragueNow.hour;
  const currentMinute = pragueNow.minute;
  const currentSecond = pragueNow.second;

  // Calculate position within the current hour (0-1)
  const hourProgress = (currentMinute * 60 + currentSecond) / 3600;

  // Scroll to current time on mount
  useEffect(() => {
    if (currentTimeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const bar = currentTimeRef.current;
      const containerHeight = container.clientHeight;
      const barTop = bar.offsetTop;
      
      // Scroll so current time is roughly in the center
      container.scrollTop = barTop - containerHeight / 2 + 24;
    }
  }, []);

  // Generate 24 hours
  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);

  // Determine styling for each cell based on working/reasonable hours
  const getCellStyle = (zoneId: string, hour: number): string => {
    const settings = zoneSettings[zoneId];
    if (!settings) return "";

    // Get the local time for this hour at this zone
    const pragueTime = now.setZone("Europe/Prague").startOf("day").plus({ hours: hour });
    const localTime = pragueTime.setZone(zoneId);
    const localHour = localTime.hour;
    const dayOfWeek = localTime.weekday;

    const isWorkingDay = settings.workingDays.includes(dayOfWeek);
    const inWorking = isWithinRange(localHour, settings.workingStart, settings.workingEnd);
    const inReasonable = isWithinRange(localHour, settings.reasonableStart, settings.reasonableEnd);

    if (isWorkingDay && inWorking) {
      return "schedule-cell-working";
    }
    if (isWorkingDay && inReasonable) {
      return "schedule-cell-reasonable";
    }
    return "schedule-cell-outside";
  };

  // Get local time for each zone at a given Prague hour
  const getLocalTime = (zoneId: string, pragueHour: number): DateTime => {
    const pragueTime = now.setZone("Europe/Prague").startOf("day").plus({ hours: pragueHour });
    return pragueTime.setZone(zoneId);
  };

  // Check if a zone's local time crosses into a different day
  const getDayLabel = (zoneId: string, pragueHour: number): string | null => {
    const localTime = getLocalTime(zoneId, pragueHour);
    const pragueTime = now.setZone("Europe/Prague").startOf("day").plus({ hours: pragueHour });
    
    // Only show day label if it's different from Prague's day or if it's the first hour of that day
    if (localTime.day !== pragueTime.day || localTime.hour === 0) {
      return localTime.toFormat("EEE").toUpperCase();
    }
    return null;
  };

  return (
    <div className="schedule-view">
      {/* Header row - sticky */}
      <div className="schedule-header">
        <div className="schedule-header-cell schedule-time-column" />
        {zones.map((zone) => (
          <div key={zone.id} className="schedule-header-cell">
            <span className="font-semibold">{zone.city}</span>
          </div>
        ))}
      </div>

      {/* Scrollable grid */}
      <div ref={scrollRef} className="schedule-grid-container">
        <div className="schedule-grid">
          {hours.map((hour) => {
            const isCurrentHour = hour === currentHour;

            return (
              <div key={hour} className="schedule-row">
                {/* Time label column */}
                <div className="schedule-time-column schedule-time-label">
                  {hour === 0 && (
                    <span className="schedule-day-badge">
                      {pragueNow.toFormat("EEE").toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Zone columns */}
                {zones.map((zone) => {
                  const localTime = getLocalTime(zone.id, hour);
                  const dayLabel = getDayLabel(zone.id, hour);
                  const cellStyle = getCellStyle(zone.id, hour);

                  return (
                    <div
                      key={zone.id}
                      className={`schedule-cell ${cellStyle}`}
                    >
                      {dayLabel && localTime.hour === 0 && (
                        <span className="schedule-day-badge-inline">{dayLabel}</span>
                      )}
                      <span className="schedule-time-text">
                        {formatHour(localTime.hour, use24Hour)}
                      </span>
                    </div>
                  );
                })}

                {/* Current time bar - positioned within the current hour row */}
                {isCurrentHour && (
                  <div
                    ref={currentTimeRef}
                    className="schedule-current-bar"
                    style={{
                      top: `${hourProgress * 100}%`,
                    }}
                  >
                    <div className="schedule-current-bar-label">
                      <span className="schedule-current-indicator">⋮⋮</span>
                      <span className="font-medium">Current time</span>
                    </div>
                    <div className="schedule-current-bar-times">
                      {zones.map((zone) => {
                        const localNow = now.setZone(zone.id);
                        return (
                          <div key={zone.id} className="schedule-current-time-cell">
                            <span className="schedule-current-day">
                              {localNow.toFormat("EEE").toUpperCase()}
                            </span>
                            <span className="schedule-current-time">
                              {formatTimeWithMinutes(localNow, use24Hour)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
