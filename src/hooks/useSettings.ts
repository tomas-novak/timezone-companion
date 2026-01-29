import { useState, useEffect, useCallback } from "react";
import { AppSettings, loadSettings, debouncedSave, ZoneSettings } from "@/lib/storage";

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  // Apply dark mode to document
  useEffect(() => {
    if (settings.isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [settings.isDarkMode]);

  // Save settings when they change (debounced)
  useEffect(() => {
    debouncedSave(settings);
  }, [settings]);

  const toggle24Hour = useCallback(() => {
    setSettings((prev) => ({ ...prev, use24Hour: !prev.use24Hour }));
  }, []);

  const toggleDarkMode = useCallback(() => {
    setSettings((prev) => ({ ...prev, isDarkMode: !prev.isDarkMode }));
  }, []);

  const updateZoneSettings = useCallback(
    (zoneId: string, updates: Partial<ZoneSettings>) => {
      setSettings((prev) => ({
        ...prev,
        zones: {
          ...prev.zones,
          [zoneId]: {
            ...prev.zones[zoneId],
            ...updates,
          },
        },
      }));
    },
    []
  );

  return {
    settings,
    toggle24Hour,
    toggleDarkMode,
    updateZoneSettings,
  };
}
