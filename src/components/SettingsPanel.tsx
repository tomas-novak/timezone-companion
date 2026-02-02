import { useState } from "react";
import { ChevronDown, ChevronUp, Settings2, ArrowUp, ArrowDown, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TIMEZONE_CONFIGS, DAYS_OF_WEEK } from "@/lib/timezones";
import type { ZoneSettings } from "@/lib/storage";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface SettingsPanelProps {
  zoneSettings: Record<string, ZoneSettings>;
  zoneOrder: string[];
  use24Hour: boolean;
  onUpdateZone: (zoneId: string, updates: Partial<ZoneSettings>) => void;
  onMoveZone: (zoneId: string, direction: "up" | "down") => void;
}

function formatHourDisplay(hour: number, use24Hour: boolean): string {
  if (use24Hour) {
    return `${hour.toString().padStart(2, "0")}:00`;
  }
  const suffix = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:00 ${suffix}`;
}

function parseHourFromValue(value: string): number {
  const [hours] = value.split(":").map(Number);
  return hours;
}

function HourSelect({
  value,
  onChange,
  label,
  use24Hour,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  use24Hour: boolean;
}) {
  const currentHour = parseHourFromValue(value);
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      <select
        value={currentHour}
        onChange={(e) => onChange(`${e.target.value.padStart(2, "0")}:00`)}
        className="time-input"
      >
        {hours.map((hour) => (
          <option key={hour} value={hour}>
            {formatHourDisplay(hour, use24Hour)}
          </option>
        ))}
      </select>
    </div>
  );
}

function DaySelector({
  selectedDays,
  onChange,
}: {
  selectedDays: number[];
  onChange: (days: number[]) => void;
}) {
  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      onChange(selectedDays.filter((d) => d !== day));
    } else {
      onChange([...selectedDays, day].sort((a, b) => a - b));
    }
  };

  return (
    <div className="flex gap-1.5 flex-wrap">
      {DAYS_OF_WEEK.map((day) => (
        <button
          key={day.value}
          type="button"
          onClick={() => toggleDay(day.value)}
          className={`day-checkbox ${
            selectedDays.includes(day.value) ? "day-checkbox-active" : ""
          }`}
          title={day.full}
        >
          {day.short.charAt(0)}
        </button>
      ))}
    </div>
  );
}

function ZoneSettingsCard({
  zone,
  settings,
  use24Hour,
  onUpdate,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  position,
}: {
  zone: (typeof TIMEZONE_CONFIGS)[0];
  settings: ZoneSettings;
  use24Hour: boolean;
  onUpdate: (updates: Partial<ZoneSettings>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  position: number;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <GripVertical size={16} className="text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
            #{position}
          </span>
          <h4 className="font-medium">
            {zone.city}, {zone.country}
          </h4>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onMoveUp}
            disabled={isFirst}
            title="Move up"
          >
            <ArrowUp size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onMoveDown}
            disabled={isLast}
            title="Move down"
          >
            <ArrowDown size={14} />
          </Button>
        </div>
      </div>

      {/* Working Hours */}
      <div className="mb-4">
        <p className="text-sm font-medium mb-2">Working Hours</p>
        <div className="flex flex-wrap items-end gap-3 mb-2">
          <HourSelect
            value={settings.workingStart}
            onChange={(v) => onUpdate({ workingStart: v })}
            label="Start"
            use24Hour={use24Hour}
          />
          <span className="pb-2 text-muted-foreground">–</span>
          <HourSelect
            value={settings.workingEnd}
            onChange={(v) => onUpdate({ workingEnd: v })}
            label="End"
            use24Hour={use24Hour}
          />
        </div>
        <div className="mt-2">
          <label className="text-xs text-muted-foreground mb-1 block">
            Working Days
          </label>
          <DaySelector
            selectedDays={settings.workingDays}
            onChange={(days) => onUpdate({ workingDays: days })}
          />
        </div>
      </div>

      {/* Visibility */}
      <div className="mt-4 border-t pt-4">
        <p className="text-sm font-medium mb-2">Visibility</p>
        <label className="flex items-start gap-2 text-sm">
          <Checkbox
            checked={settings.hidden}
            onCheckedChange={(checked) => onUpdate({ hidden: Boolean(checked) })}
            aria-label={`Hide ${zone.city}`}
          />
          <span>
            Hide this city from the clocks and schedule view.
          </span>
        </label>
      </div>

      {/* Reasonable Hours */}
      <div>
        <p className="text-sm font-medium mb-2">Reasonable Hours</p>
        <div className="flex flex-wrap items-end gap-3">
          <HourSelect
            value={settings.reasonableStart}
            onChange={(v) => onUpdate({ reasonableStart: v })}
            label="Start"
            use24Hour={use24Hour}
          />
          <span className="pb-2 text-muted-foreground">–</span>
          <HourSelect
            value={settings.reasonableEnd}
            onChange={(v) => onUpdate({ reasonableEnd: v })}
            label="End"
            use24Hour={use24Hour}
          />
        </div>
      </div>
    </div>
  );
}

export function SettingsPanel({ zoneSettings, zoneOrder, use24Hour, onUpdateZone, onMoveZone }: SettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Get zones in order
  const orderedZones = zoneOrder
    .map((id) => TIMEZONE_CONFIGS.find((z) => z.id === id))
    .filter((z): z is (typeof TIMEZONE_CONFIGS)[0] => z !== undefined);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="settings-panel">
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full flex items-center justify-between p-0 h-auto hover:bg-transparent"
        >
          <div className="flex items-center gap-2">
            <Settings2 size={20} className="text-primary" />
            <span className="font-semibold text-lg">Settings</span>
          </div>
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-4">
        <p className="text-sm text-muted-foreground mb-4">
          Configure working hours, reasonable hours, and visibility for each timezone. Use the arrows to change the display order. Hidden cities stay in your settings but are removed from the clock and schedule views.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {orderedZones.map((zone, index) => (
            <ZoneSettingsCard
              key={zone.id}
              zone={zone}
              settings={zoneSettings[zone.id]}
              use24Hour={use24Hour}
              onUpdate={(updates) => onUpdateZone(zone.id, updates)}
              onMoveUp={() => onMoveZone(zone.id, "up")}
              onMoveDown={() => onMoveZone(zone.id, "down")}
              isFirst={index === 0}
              isLast={index === orderedZones.length - 1}
              position={index + 1}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
