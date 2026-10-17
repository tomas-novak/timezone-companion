import { IANAZone } from "luxon";
import { CITY_PRESETS, DEFAULT_HOURS, DEFAULT_TZS, tzCity, tzLabel } from "./timezones";

export interface ZoneSettings {
  workingStart: string;
  workingEnd: string;
  workingDays: number[];
  reasonableStart: string;
  reasonableEnd: string;
}

export interface Zone extends ZoneSettings {
  id: string;
  tz: string;
  city: string;
  country: string;
}

export interface AppSettings {
  version: 2;
  use24Hour: boolean;
  isDarkMode: boolean;
  zones: Zone[];
  homeTz: string | null;
}

const STORAGE_KEY = "4zone-clock-settings";

// randomUUID is missing in older browsers and on plain-http hosts other than localhost
export const newId = () => crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

export function createZone(tz: string, id: string = newId()): Zone {
  const preset = CITY_PRESETS[tz];
  return {
    id,
    tz,
    city: preset?.city ?? tzCity(tz),
    country: preset?.country ?? tzLabel(tz),
    workingDays: [...(preset?.workingDays ?? [1, 2, 3, 4, 5])],
    ...DEFAULT_HOURS,
  };
}

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const TIME_KEYS = ["workingStart", "workingEnd", "reasonableStart", "reasonableEnd"] as const;

// Stored data is untrusted: a bad day or time would crash or garble every card, so fall back to the preset field
function withValidHours(zone: Zone, fallback: Zone): Zone {
  const days = zone.workingDays;
  const validDays = Array.isArray(days) && days.every((d) => Number.isInteger(d) && d >= 1 && d <= 7);
  const fixed = { ...zone, workingDays: validDays ? days : fallback.workingDays };
  for (const key of TIME_KEYS) if (typeof zone[key] !== "string" || !HHMM.test(zone[key])) fixed[key] = fallback[key];
  return fixed;
}

export function getDefaultSettings(): AppSettings {
  return {
    version: 2,
    use24Hour: true,
    isDarkMode: window.matchMedia("(prefers-color-scheme: dark)").matches,
    // The IANA id doubles as the zone id for presets, so migrated and default zones match
    zones: DEFAULT_TZS.map((tz) => createZone(tz, tz)),
    homeTz: null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function migrate(raw: any): AppSettings {
  const defaults = getDefaultSettings();
  if (!raw || typeof raw !== "object") return defaults;
  const { zoneOrder, zones: rawZones, ...rest } = raw;
  let zones: Zone[];

  if (raw.version === 2) {
    zones = Array.isArray(rawZones)
      ? rawZones
          .filter((z) => z && typeof z.id === "string" && IANAZone.isValidZone(z.tz))
          .map((z) => withValidHours({ ...createZone(z.tz, z.id), ...z }, createZone(z.tz, z.id)))
      : defaults.zones;
  } else {
    // v1 stored per-zone hours keyed by IANA id plus a separate zoneOrder; city names lived in code
    const old = rawZones && typeof rawZones === "object" ? rawZones : {};
    const order: string[] = Array.isArray(zoneOrder) ? zoneOrder : DEFAULT_TZS;
    zones = [...new Set([...order, ...Object.keys(old)])]
      .filter((tz) => IANAZone.isValidZone(tz))
      .map((tz) => {
        const { hidden, ...hours } = old[tz] ?? {};
        return withValidHours({ ...createZone(tz, tz), ...hours }, createZone(tz, tz));
      });
  }

  return { ...defaults, ...rest, version: 2, zones };
}

export function loadSettings(): AppSettings {
  // A page mounts and reads before the previous page unmounts, so write its pending save first
  flushSave();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return migrate(JSON.parse(stored));
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
let pending: AppSettings | null = null;

export function flushSave(): void {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = null;
  if (pending) saveSettings(pending);
  pending = null;
}

export function debouncedSave(settings: AppSettings, delay = 500): void {
  if (saveTimeout) clearTimeout(saveTimeout);
  pending = settings;
  saveTimeout = setTimeout(flushSave, delay);
}
