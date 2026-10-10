import { useState, useEffect, useCallback } from "react";
import { MAX_ZONES } from "@/lib/timezones";
import { AppSettings, loadSettings, debouncedSave, createZone, type Zone } from "@/lib/storage";

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

  const updateZone = useCallback((zoneId: string, updates: Partial<Zone>) => {
    setSettings((prev) => ({
      ...prev,
      zones: prev.zones.map((zone) => (zone.id === zoneId ? { ...zone, ...updates } : zone)),
    }));
  }, []);

  const addZone = useCallback((tz: string) => {
    setSettings((prev) =>
      prev.zones.length >= MAX_ZONES ? prev : { ...prev, zones: [...prev.zones, createZone(tz)] }
    );
  }, []);

  const removeZone = useCallback((zoneId: string) => {
    setSettings((prev) => ({ ...prev, zones: prev.zones.filter((zone) => zone.id !== zoneId) }));
  }, []);

  const setHomeTz = useCallback((homeTz: string | null) => {
    setSettings((prev) => ({ ...prev, homeTz }));
  }, []);

  const moveZone = useCallback((zoneId: string, direction: "up" | "down") => {
    setSettings((prev) => {
      const currentIndex = prev.zones.findIndex((zone) => zone.id === zoneId);
      if (currentIndex === -1) return prev;

      const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= prev.zones.length) return prev;

      const zones = [...prev.zones];
      [zones[currentIndex], zones[newIndex]] = [zones[newIndex], zones[currentIndex]];

      return { ...prev, zones };
    });
  }, []);

  return {
    settings,
    toggle24Hour,
    toggleDarkMode,
    updateZone,
    addZone,
    removeZone,
    moveZone,
    setHomeTz,
  };
}
