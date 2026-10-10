import { DateTime } from "luxon";
import { formatOffsetDiff } from "@/lib/timezones";
import type { Zone } from "@/lib/storage";
import { getWorkStatus, type WorkStatus } from "@/lib/workStatus";
import { Clock, Briefcase, Coffee, Calendar, Sun } from "lucide-react";

interface ClockCardProps {
  zone: Zone;
  now: DateTime;
  use24Hour: boolean;
  homeTz: string;
}

function WorkStatusBadge({ status }: { status: WorkStatus }) {
  switch (status) {
    case "working":
      return (
        <span className="badge-working">
          <Briefcase size={12} />
          Working hours
        </span>
      );
    case "reasonable":
      return (
        <span className="badge-reasonable">
          <Sun size={12} />
          Reasonable hours
        </span>
      );
    case "outside":
      return (
        <span className="badge-outside">
          <Coffee size={12} />
          Outside hours
        </span>
      );
    case "weekend":
      return (
        <span className="badge-weekend">
          <Calendar size={12} />
          Weekend
        </span>
      );
  }
}

export function ClockCard({ zone, now, use24Hour, homeTz }: ClockCardProps) {
  const local = now.setZone(zone.tz);
  const status = getWorkStatus(now, zone.tz, zone);
  const isActive = status === "working";

  // Format time
  const timeFormat = use24Hour ? "HH:mm:ss" : "h:mm:ss a";
  const timeString = local.toFormat(timeFormat);

  // Format date
  const dateString = local.toFormat("EEE, d LLL yyyy");

  // UTC offset
  const offset = local.toFormat("ZZZZ"); // e.g., "UTC+3"
  const abbr = local.toFormat("ZZZZZ"); // Full timezone name
  const homeDiff = zone.tz === homeTz ? "You" : formatOffsetDiff(local.offset - now.setZone(homeTz).offset);

  return (
    <div className={`clock-card min-w-0 ${isActive ? "clock-card-active" : ""}`}>
      {/* Status badge */}
      <div className="absolute right-4 top-4">
        <WorkStatusBadge status={status} />
      </div>

      {/* City & Country */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-foreground">{zone.city}</h2>
        <p className="text-sm text-muted-foreground">{zone.country}</p>
      </div>

      {/* Live Time */}
      <div className="mb-3">
        <div className="clock-time text-foreground">{timeString}</div>
      </div>

      {/* Date */}
      <div className="mb-4 text-sm text-muted-foreground">{dateString}</div>

      {/* Timezone info */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Clock size={12} />
        <span>{offset}</span>
        <span className="opacity-50">•</span>
        <span className="font-medium text-foreground">{homeDiff}</span>
        {abbr && abbr !== offset && (
          <>
            <span className="opacity-50">•</span>
            <span className="truncate max-w-[120px]">{abbr}</span>
          </>
        )}
      </div>
    </div>
  );
}
