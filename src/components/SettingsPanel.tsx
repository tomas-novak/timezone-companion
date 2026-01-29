import { useState } from "react";
import { ChevronDown, ChevronUp, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TIMEZONE_CONFIGS, DAYS_OF_WEEK } from "@/lib/timezones";
import type { ZoneSettings } from "@/lib/storage";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface SettingsPanelProps {
  zoneSettings: Record<string, ZoneSettings>;
  onUpdateZone: (zoneId: string, updates: Partial<ZoneSettings>) => void;
}

function TimeInput({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="time-input"
      />
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
  onUpdate,
}: {
  zone: (typeof TIMEZONE_CONFIGS)[0];
  settings: ZoneSettings;
  onUpdate: (updates: Partial<ZoneSettings>) => void;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h4 className="font-medium mb-3">
        {zone.city}, {zone.country}
      </h4>

      {/* Working Hours */}
      <div className="mb-4">
        <p className="text-sm font-medium mb-2">Working Hours</p>
        <div className="flex flex-wrap items-end gap-3 mb-2">
          <TimeInput
            value={settings.workingStart}
            onChange={(v) => onUpdate({ workingStart: v })}
            label="Start"
          />
          <span className="pb-2 text-muted-foreground">–</span>
          <TimeInput
            value={settings.workingEnd}
            onChange={(v) => onUpdate({ workingEnd: v })}
            label="End"
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

      {/* Reasonable Hours */}
      <div>
        <p className="text-sm font-medium mb-2">Reasonable Hours</p>
        <div className="flex flex-wrap items-end gap-3">
          <TimeInput
            value={settings.reasonableStart}
            onChange={(v) => onUpdate({ reasonableStart: v })}
            label="Start"
          />
          <span className="pb-2 text-muted-foreground">–</span>
          <TimeInput
            value={settings.reasonableEnd}
            onChange={(v) => onUpdate({ reasonableEnd: v })}
            label="End"
          />
        </div>
      </div>
    </div>
  );
}

export function SettingsPanel({ zoneSettings, onUpdateZone }: SettingsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

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
          Configure working hours and reasonable hours for each timezone.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {TIMEZONE_CONFIGS.map((zone) => (
            <ZoneSettingsCard
              key={zone.id}
              zone={zone}
              settings={zoneSettings[zone.id]}
              onUpdate={(updates) => onUpdateZone(zone.id, updates)}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
