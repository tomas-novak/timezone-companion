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

  const setHomeTz = useCallback((homeTz: string | null) => {
    setSettings((prev) => ({ ...prev, homeTz }));
  }, []);

  const updateZoneOrder = useCallback((newOrder: string[]) => {
    setSettings((prev) => ({
      ...prev,
      zoneOrder: newOrder,
    }));
  }, []);

  const moveZone = useCallback((zoneId: string, direction: "up" | "down") => {
    setSettings((prev) => {
      const currentIndex = prev.zoneOrder.indexOf(zoneId);
      if (currentIndex === -1) return prev;
      
      const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= prev.zoneOrder.length) return prev;
      
      const newOrder = [...prev.zoneOrder];
      [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];
      
      return { ...prev, zoneOrder: newOrder };
    });
  }, []);

  return {
    settings,
    toggle24Hour,
    toggleDarkMode,
    updateZoneSettings,
    updateZoneOrder,
    moveZone,
    setHomeTz,
  };
}
