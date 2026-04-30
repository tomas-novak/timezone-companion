import { describe, expect, it } from "vitest";
import { TIMEZONE_CONFIGS } from "./timezones";
import { getDefaultSettings, getDefaultZoneOrder } from "./storage";

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

describe("TIMEZONE_CONFIGS", () => {
  it("contains New Delhi with the Asia/Kolkata timezone", () => {
    expect(TIMEZONE_CONFIGS).toContainEqual(
      expect.objectContaining({
        id: "Asia/Kolkata",
        city: "New Delhi",
        country: "India",
      }),
    );
  });

  it("uses unique timezone IDs", () => {
    const ids = TIMEZONE_CONFIGS.map((zone) => zone.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has valid day-of-week and time ranges for each zone", () => {
    TIMEZONE_CONFIGS.forEach((zone) => {
      zone.defaultWorkingDays.forEach((day) => {
        expect(day).toBeGreaterThanOrEqual(1);
        expect(day).toBeLessThanOrEqual(7);
      });

      expect(zone.defaultWorkingStart).toMatch(TIME_REGEX);
      expect(zone.defaultWorkingEnd).toMatch(TIME_REGEX);
      expect(zone.defaultReasonableStart).toMatch(TIME_REGEX);
      expect(zone.defaultReasonableEnd).toMatch(TIME_REGEX);
    });
  });
});

describe("default settings derived from timezone configs", () => {
  it("builds zone order from timezone IDs", () => {
    expect(getDefaultZoneOrder()).toEqual(TIMEZONE_CONFIGS.map((zone) => zone.id));
  });

  it("creates defaults for every configured zone", () => {
    const settings = getDefaultSettings();

    TIMEZONE_CONFIGS.forEach((zone) => {
      expect(settings.zones[zone.id]).toBeDefined();
      expect(settings.zones[zone.id]).toMatchObject({
        workingStart: zone.defaultWorkingStart,
        workingEnd: zone.defaultWorkingEnd,
        reasonableStart: zone.defaultReasonableStart,
        reasonableEnd: zone.defaultReasonableEnd,
        hidden: false,
      });
      expect(settings.zones[zone.id].workingDays).toEqual(zone.defaultWorkingDays);
    });
  });
});
