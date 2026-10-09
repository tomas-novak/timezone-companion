import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import logo from "@/assets/logo.png";
import { TIMEZONE_CONFIGS, resolveHomeTz } from "@/lib/timezones";

interface HeaderProps {
  use24Hour: boolean;
  isDarkMode: boolean;
  onToggle24Hour: () => void;
  onToggleDarkMode: () => void;
  homeTz: string | null;
  onHomeTzChange: (homeTz: string | null) => void;
}

const zoneLabel = (tz: string) =>
  TIMEZONE_CONFIGS.find((zone) => zone.id === tz)?.city ?? tz.split("/").pop()!.replace(/_/g, " ");

export function Header({
  use24Hour,
  isDarkMode,
  onToggle24Hour,
  onToggleDarkMode,
  homeTz,
  onHomeTzChange,
}: HeaderProps) {
  const detectedTz = resolveHomeTz(null);
  const extraZones = [...new Set([detectedTz, resolveHomeTz(homeTz)])].filter(
    (tz) => !TIMEZONE_CONFIGS.some((zone) => zone.id === tz)
  );

  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container flex min-h-16 flex-wrap items-center justify-between gap-y-2 py-2">
        {/* Logo / Title */}
        <div className="flex items-center gap-3">
          <img src={logo} alt="OFTI logo" className="h-9 w-9 rounded-lg object-cover" />
          <h1 className="text-lg font-semibold">OFTI time zones</h1>
        </div>

        {/* Controls */}
        <div className="ml-auto flex flex-wrap items-center justify-end gap-x-3 gap-y-2">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            Home
            <select
              value={homeTz ?? ""}
              onChange={(e) => onHomeTzChange(e.target.value || null)}
              title="Your timezone. The schedule uses your hours and each clock shows the difference from you. Auto follows your browser; pick a city to keep it fixed."
              className="max-w-40 truncate rounded-md border bg-background px-2 py-1 text-sm text-foreground"
            >
              <option value="">Auto ({zoneLabel(detectedTz)})</option>
              {extraZones.map((tz) => (
                <option key={tz} value={tz}>
                  {zoneLabel(tz)}
                </option>
              ))}
              {TIMEZONE_CONFIGS.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.city}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-center gap-2">
            {/* 12h/24h Toggle */}
            <div className="flex items-center gap-2">
              <span className={`text-sm ${!use24Hour ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                12h
              </span>
              <Switch
                checked={use24Hour}
                onCheckedChange={onToggle24Hour}
                aria-label="Toggle 24-hour format"
              />
              <span className={`text-sm ${use24Hour ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                24h
              </span>
            </div>

            {/* Dark mode toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleDarkMode}
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
