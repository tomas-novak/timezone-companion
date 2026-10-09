import { afterEach, describe, expect, it, vi } from "vitest";
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
  // Every Intl.DateTimeFormat reports this zone, so the result can't depend on the machine's zone or on Intl canonicalizing aliases
  const mockBrowserTz = (timeZone: string) =>
    vi
      .spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions")
      .mockReturnValue({ timeZone } as Intl.ResolvedDateTimeFormatOptions);

  afterEach(() => vi.restoreAllMocks());

  it("uses the stored zone when valid", () => {
    expect(resolveHomeTz("Asia/Qatar")).toBe("Asia/Qatar");
  });

  it("falls back to the browser zone for null or invalid values", () => {
    mockBrowserTz("Europe/Berlin");
    expect(resolveHomeTz(null)).toBe("Europe/Berlin");
    expect(resolveHomeTz("Mars/Olympus")).toBe("Europe/Berlin");
  });

  it("maps an aliased browser zone to the configured id", () => {
    mockBrowserTz("Asia/Calcutta");
    expect(resolveHomeTz(null)).toBe("Asia/Kolkata");
  });

  it("maps an equivalent alias to the configured zone id, but keeps distinct places", () => {
    mockBrowserTz("Europe/Berlin");
    expect(resolveHomeTz("Asia/Calcutta")).toBe("Asia/Kolkata");
    expect(resolveHomeTz("Europe/Belfast")).toBe("Europe/London");
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

  it("ends at the next local midnight when DST starts at midnight", () => {
    const now = DateTime.fromISO("2026-04-24T12:00", { zone: "Africa/Cairo" });
    const rows = getHomeDayHours(now, "Africa/Cairo");
    expect(rows).toHaveLength(23);
    expect(rows[0].hour).toBe(1);
    expect(rows.at(-1)!.toISODate()).toBe("2026-04-24");
  });
});
