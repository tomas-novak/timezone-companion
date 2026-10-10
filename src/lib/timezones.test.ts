import { describe, expect, it } from "vitest";
import { CITY_PRESETS, DEFAULT_TZS, OOREDOO_TZS, worldTimeZones } from "./timezones";
import { createZone, getDefaultSettings, migrate } from "./storage";

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

describe("city presets", () => {
  it("cover every default and Ooredoo zone with valid IANA ids and working days", () => {
    const world = worldTimeZones();
    [...DEFAULT_TZS, ...OOREDOO_TZS].forEach((tz) => {
      expect(CITY_PRESETS[tz], tz).toBeDefined();
      expect(world).toContain(tz);
      CITY_PRESETS[tz].workingDays.forEach((day) => expect(day).toBeGreaterThanOrEqual(1));
      CITY_PRESETS[tz].workingDays.forEach((day) => expect(day).toBeLessThanOrEqual(7));
    });
  });

  it("prefills each Ooredoo market with its local working week", () => {
    const SUN_THU = [7, 1, 2, 3, 4];
    const MON_FRI = [1, 2, 3, 4, 5];
    const expected: Record<string, number[]> = {
      "Asia/Qatar": SUN_THU,
      "Asia/Muscat": SUN_THU,
      "Asia/Kuwait": SUN_THU,
      "Asia/Baghdad": SUN_THU,
      "Africa/Algiers": SUN_THU,
      "Africa/Tunis": MON_FRI,
      "Indian/Maldives": SUN_THU,
      "Asia/Jakarta": MON_FRI,
    };
    OOREDOO_TZS.forEach((tz) => expect(createZone(tz).workingDays, tz).toEqual(expected[tz]));
  });

  it("works without Intl.supportedValuesOf and crypto.randomUUID", () => {
    const intl = Intl as { supportedValuesOf?: unknown };
    const supportedValuesOf = intl.supportedValuesOf;
    intl.supportedValuesOf = undefined;
    // randomUUID lives on Crypto.prototype; an own undefined property hides it until deleted
    Object.defineProperty(crypto, "randomUUID", { value: undefined, configurable: true });
    try {
      expect(worldTimeZones()).toEqual(expect.arrayContaining(OOREDOO_TZS));
      expect(createZone("Asia/Qatar").id).not.toBe(createZone("Asia/Qatar").id);
    } finally {
      intl.supportedValuesOf = supportedValuesOf;
      delete (crypto as { randomUUID?: unknown }).randomUUID;
    }
  });

  it("names a non-preset zone after its IANA city and generic zone name", () => {
    const zone = createZone("America/New_York");
    expect(zone).toMatchObject({ tz: "America/New_York", city: "New York", country: "Eastern Time" });
    expect(zone.workingDays).toEqual([1, 2, 3, 4, 5]);
    expect(zone.workingStart).toMatch(TIME_REGEX);
  });

  it("gives each new zone its own id, so a zone can be added twice", () => {
    expect(createZone("Asia/Qatar").id).not.toBe(createZone("Asia/Qatar").id);
  });
});

describe("migrate", () => {
  it("defaults to the current cities", () => {
    expect(getDefaultSettings().zones.map((zone) => zone.tz)).toEqual(DEFAULT_TZS);
    expect(migrate(null).zones.map((zone) => zone.tz)).toEqual(DEFAULT_TZS);
  });

  it("converts v1 settings keeping order, edited hours and hidden cities", () => {
    const v1 = {
      use24Hour: false,
      homeTz: "Europe/Prague",
      zoneOrder: ["Asia/Qatar", "Europe/Prague"],
      zones: {
        "Asia/Qatar": { workingStart: "07:00", workingEnd: "15:00", workingDays: [7, 1, 2, 3], reasonableStart: "06:00", reasonableEnd: "20:00", hidden: true },
        "Europe/Prague": { workingStart: "09:00", workingEnd: "17:00", workingDays: [1, 2, 3, 4, 5], reasonableStart: "08:00", reasonableEnd: "19:00", hidden: false },
        "Europe/London": { workingStart: "10:00", workingEnd: "18:00", workingDays: [1, 2, 3, 4, 5], reasonableStart: "08:00", reasonableEnd: "19:00", hidden: false },
      },
    };

    const settings = migrate(v1);

    expect(settings).toMatchObject({ version: 2, use24Hour: false, homeTz: "Europe/Prague" });
    expect(settings).not.toHaveProperty("zoneOrder");
    expect(settings.zones.map((zone) => zone.id)).toEqual(["Asia/Qatar", "Europe/Prague", "Europe/London"]);
    expect(settings.zones[0]).toEqual({
      id: "Asia/Qatar",
      tz: "Asia/Qatar",
      city: "Doha",
      country: "Qatar",
      workingStart: "07:00",
      workingEnd: "15:00",
      workingDays: [7, 1, 2, 3],
      reasonableStart: "06:00",
      reasonableEnd: "20:00",
    });
    expect(settings.zones[2].workingStart).toBe("10:00");
  });

  it("keeps v2 zones as saved and drops ones with an unknown time zone", () => {
    const renamed = { ...createZone("Asia/Qatar", "a"), city: "Doha office" };
    const settings = migrate({ version: 2, zones: [renamed, { id: "b", tz: "Mars/Olympus" }] });
    expect(settings.zones).toEqual([renamed]);
  });

  it("keeps an empty v2 list empty", () => {
    expect(migrate({ version: 2, zones: [] }).zones).toEqual([]);
  });
});
