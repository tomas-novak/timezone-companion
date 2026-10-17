import { useMemo } from "react";
import { Link, useMatch } from "react-router-dom";
import { ArrowLeft, Info, Moon, Sparkles, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { resolveHomeTz, tzCity, worldTimeZones } from "@/lib/timezones";
import type { Zone } from "@/lib/storage";

interface HeaderProps {
  use24Hour: boolean;
  isDarkMode: boolean;
  onToggle24Hour: () => void;
  onToggleDarkMode: () => void;
  homeTz: string | null;
  onHomeTzChange: (homeTz: string | null) => void;
  zones: Zone[];
}

export function Header({
  use24Hour,
  isDarkMode,
  onToggle24Hour,
  onToggleDarkMode,
  homeTz,
  onHomeTzChange,
  zones,
}: HeaderProps) {
  const onConcept = !!useMatch("/concept");
  const detectedTz = resolveHomeTz(null);
  const zoneLabel = (tz: string) => zones.find((zone) => zone.tz === tz)?.city ?? tzCity(tz);
  const zoneTzs = [...new Set(zones.map((zone) => zone.tz))];
  const world = useMemo(worldTimeZones, []);
  const otherTzs = world.filter((tz) => !zoneTzs.includes(tz));
  // The detected zone can be missing from the world list (old browsers fall back to presets only)
  const extraZones = [...new Set([detectedTz, resolveHomeTz(homeTz)])].filter(
    (tz) => !zoneTzs.includes(tz) && !otherTzs.includes(tz)
  );

  return (
    <header className="border-b bg-background/90 backdrop-blur-sm sm:sticky sm:top-0 z-50">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      <div className="container flex min-h-16 flex-wrap items-center justify-between gap-y-2 py-2">
        {/* Logo / Title */}
        <div className="flex items-center gap-3">
          <img src="/favicon.svg" alt="" className="h-9 w-9" />
          {onConcept ? (
            <p className="font-display text-xl font-bold">Timezone Companion</p>
          ) : (
            <h1 className="text-xl font-bold">Timezone Companion</h1>
          )}
        </div>

        {/* Controls */}
        <div className="ml-auto flex flex-wrap items-center justify-end gap-x-3 gap-y-2">
          <Button asChild variant={onConcept ? "outline" : "default"} size="sm">
            {onConcept ? (
              <Link to="/">
                <ArrowLeft size={16} aria-hidden /> Back to clocks
              </Link>
            ) : (
              <Link to="/concept">
                <Sparkles size={16} aria-hidden /> Feature concept
              </Link>
            )}
          </Button>
          <div className="flex items-center gap-1">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              My time zone
              <select
                value={homeTz ?? ""}
                onChange={(e) => onHomeTzChange(e.target.value || null)}
                className="max-w-40 truncate rounded-full border border-input bg-background px-3 py-1.5 text-sm text-foreground"
              >
                <option value="">Auto ({zoneLabel(detectedTz)})</option>
                {extraZones.map((tz) => (
                  <option key={tz} value={tz}>
                    {zoneLabel(tz)}
                  </option>
                ))}
                <optgroup label="Your cities">
                  {zoneTzs.map((tz) => (
                    <option key={tz} value={tz}>
                      {zoneLabel(tz)}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="All time zones">
                  {otherTzs.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz.replace(/_/g, " ")}
                    </option>
                  ))}
                </optgroup>
              </select>
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" aria-label="What is My time zone?">
                  <Info size={16} />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="text-sm">
                Pick the time zone you are in. The Schedule View is laid out in your hours and each clock
                shows how far ahead or behind you it is (e.g. +2 h); your own city is marked "You". Auto
                follows your browser, so it updates when you travel; pick a city to keep it fixed.
              </PopoverContent>
            </Popover>
          </div>

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
