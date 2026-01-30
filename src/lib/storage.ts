import { TIMEZONE_CONFIGS } from "./timezones";

export interface ZoneSettings {
  workingStart: string;
  workingEnd: string;
  workingDays: number[];
  reasonableStart: string;
  reasonableEnd: string;
}

export interface AppSettings {
  use24Hour: boolean;
  isDarkMode: boolean;
  zones: Record<string, ZoneSettings>;
  zoneOrder: string[];
}

const STORAGE_KEY = "4zone-clock-settings";

export function getDefaultZoneOrder(): string[] {
  return TIMEZONE_CONFIGS.map((tz) => tz.id);
}

export function getDefaultSettings(): AppSettings {
  const zones: Record<string, ZoneSettings> = {};
  
  TIMEZONE_CONFIGS.forEach((tz) => {
    zones[tz.id] = {
      workingStart: tz.defaultWorkingStart,
      workingEnd: tz.defaultWorkingEnd,
      workingDays: [...tz.defaultWorkingDays],
      reasonableStart: tz.defaultReasonableStart,
      reasonableEnd: tz.defaultReasonableEnd,
    };
  });

  return {
    use24Hour: true,
    isDarkMode: window.matchMedia("(prefers-color-scheme: dark)").matches,
    zones,
    zoneOrder: getDefaultZoneOrder(),
  };
}

export function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const defaults = getDefaultSettings();
      
      // Validate zoneOrder - ensure all zones are present
      let zoneOrder = parsed.zoneOrder;
      if (!Array.isArray(zoneOrder) || zoneOrder.length !== defaults.zoneOrder.length) {
        zoneOrder = defaults.zoneOrder;
      }
      
      // Merge with defaults to handle missing keys
      return {
        ...defaults,
        ...parsed,
        zones: {
          ...defaults.zones,
          ...parsed.zones,
        },
        zoneOrder,
      };
    }
  } catch (e) {
    console.error("Failed to load settings:", e);
  }
  return getDefaultSettings();
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save settings:", e);
  }
}

// Debounced save function
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export function debouncedSave(settings: AppSettings, delay = 500): void {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  saveTimeout = setTimeout(() => {
    saveSettings(settings);
  }, delay);
}
