import { useMemo, useRef, useEffect } from "react";
import { DateTime } from "luxon";
import type { ZoneSettings } from "@/lib/storage";
import { TIMEZONE_CONFIGS, getHomeDayHours } from "@/lib/timezones";

interface ScheduleViewProps {
  zoneSettings: Record<string, ZoneSettings>;
  zoneOrder: string[];
  now: DateTime;
  use24Hour: boolean;
  homeTz: string;
}

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


function formatTimeWithMinutes(dt: DateTime, use24Hour: boolean): string {
  return dt.toFormat(use24Hour ? "HH:mm" : "h:mm a");
}

export function ScheduleView({ zoneSettings, zoneOrder, now, use24Hour, homeTz }: ScheduleViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentTimeRef = useRef<HTMLDivElement>(null);

  // Get zone configs in user-defined order
  const zones = useMemo(
    () =>
      zoneOrder
        .map((id) => TIMEZONE_CONFIGS.find((z) => z.id === id))
        .filter((z): z is (typeof TIMEZONE_CONFIGS)[0] => z !== undefined)
        .filter((zone) => !zoneSettings[zone.id]?.hidden),
    [zoneOrder, zoneSettings]
  );

  // Rows are real hours of the home day (23 or 25 on DST days), so the current row is found by elapsed time, not by wall-clock hour
  const homeHours = getHomeDayHours(now, homeTz);
  const elapsedHours = now.diff(homeHours[0], "hours").hours;
  const currentIndex = Math.floor(elapsedHours);
  const hourProgress = elapsedHours - currentIndex;

  // Scroll to current time on mount
  useEffect(() => {
    if (currentTimeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const bar = currentTimeRef.current;
      const containerHeight = container.clientHeight;
      // offsetTop is relative to the row (position: relative), so measure against the container
      const barTop = bar.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
      
      // Scroll so current time is roughly in the center
      container.scrollTop = barTop - containerHeight / 2 + 24;
    }
  }, [homeTz]);

  // Determine styling for each cell based on working/reasonable hours
  const getCellStyle = (zoneId: string, homeTime: DateTime): string => {
    const settings = zoneSettings[zoneId];
    if (!settings) return "";

    const localTime = homeTime.setZone(zoneId);
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

  // Check if a zone's local time crosses into a different day
  const getDayLabel = (zoneId: string, homeTime: DateTime): string | null => {
    const localTime = homeTime.setZone(zoneId);

    // Only show day label if it's different from home's day or if it's the first hour of that day
    if (localTime.day !== homeTime.day || localTime.hour === 0) {
      return localTime.toFormat("EEE").toUpperCase();
    }
    return null;
  };

  return (
    <div className="schedule-view">
      {/* Scrollable container for both header and grid */}
      <div ref={scrollRef} className="schedule-grid-container">
        {/* Header row - sticky */}
        <div className="schedule-header">
          {zones.map((zone) => (
            <div key={zone.id} className="schedule-header-cell">
              <span className="font-semibold">{zone.city}</span>
            </div>
          ))}
        </div>

        <div className="schedule-grid">
          {homeHours.map((homeTime, index) => {
            const isCurrentHour = index === currentIndex;

            return (
              <div key={homeTime.toMillis()} className="schedule-row">

                {/* Zone columns */}
                {zones.map((zone) => {
                  const localTime = homeTime.setZone(zone.id);
                  const dayLabel = getDayLabel(zone.id, homeTime);
                  const cellStyle = getCellStyle(zone.id, homeTime);

                  return (
                    <div
                      key={zone.id}
                      className={`schedule-cell ${cellStyle}`}
                    >
                      {dayLabel && localTime.hour === 0 && (
                        <span className="schedule-day-badge-inline">{dayLabel}</span>
                      )}
                      <span className="schedule-time-text">
                        {formatTimeWithMinutes(localTime, use24Hour)}
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
