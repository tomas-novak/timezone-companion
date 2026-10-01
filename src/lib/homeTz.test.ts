import { describe, expect, it } from "vitest";
import { DateTime } from "luxon";
import { formatOffsetDiff, getHomeDayHours, resolveHomeTz } from "./timezones";

describe("formatOffsetDiff", () => {
  it("formats whole hours, fractions and sign", () => {
    expect(formatOffsetDiff(120)).toBe("+2 h");
    expect(formatOffsetDiff(-60)).toBe("−1 h");
    expect(formatOffsetDiff(210)).toBe("+3:30 h");
    expect(formatOffsetDiff(345)).toBe("+5:45 h");
    expect(formatOffsetDiff(-30)).toBe("−0:30 h");
    expect(formatOffsetDiff(0)).toBe("0 h");
  });
});

describe("resolveHomeTz", () => {
  const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  it("uses the stored zone when valid", () => {
    expect(resolveHomeTz("Asia/Qatar")).toBe("Asia/Qatar");
  });

  it("falls back to the browser zone for null or invalid values", () => {
    expect(resolveHomeTz(null)).toBe(browserTz);
    expect(resolveHomeTz("Mars/Olympus")).toBe(browserTz);
  });

  it("maps an equivalent alias to the configured zone id, but keeps distinct places", () => {
    expect(resolveHomeTz("Asia/Calcutta")).toBe("Asia/Kolkata");
    expect(resolveHomeTz("Europe/Bratislava")).toBe("Europe/Bratislava");
  });
});

describe("getHomeDayHours", () => {
  const at = (iso: string) => DateTime.fromISO(iso, { zone: "Europe/Prague" });

  it("has 24, 23 or 25 rows depending on DST", () => {
    expect(getHomeDayHours(at("2026-10-01T12:00"), "Europe/Prague")).toHaveLength(24);
    expect(getHomeDayHours(at("2026-03-29T12:00"), "Europe/Prague")).toHaveLength(23);
    expect(getHomeDayHours(at("2026-10-25T12:00"), "Europe/Prague")).toHaveLength(25);
  });

  it("lists real home hours, skipping or repeating the DST hour", () => {
    const spring = getHomeDayHours(at("2026-03-29T12:00"), "Europe/Prague").map((t) => t.hour);
    expect(spring.slice(0, 4)).toEqual([0, 1, 3, 4]);
    const fall = getHomeDayHours(at("2026-10-25T12:00"), "Europe/Prague").map((t) => t.hour);
    expect(fall.slice(0, 5)).toEqual([0, 1, 2, 2, 3]);
  });
});
