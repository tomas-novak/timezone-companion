import { describe, expect, it } from "vitest";
import { buildCalendar } from "./prompt";
import { DEMO_NOW } from "./demoPresets";

describe("buildCalendar", () => {
  it("labels 14 days for Prague at the demo clock", () => {
    const cal = buildCalendar(DEMO_NOW, "Europe/Prague");
    expect(cal).toHaveLength(14);
    expect(cal[0]).toBe("2026-10-13 Tue (this week)");
    expect(cal).toContain("2026-10-19 Mon (next week)");
    expect(cal).toContain("2026-10-26 Mon (later)");
  });

  it("starts on the sender's own date", () => {
    expect(buildCalendar("2026-10-13T20:00:00Z", "Asia/Kolkata")[0]).toBe("2026-10-14 Wed (this week)");
  });

  it("keeps week labels across the new year", () => {
    const cal = buildCalendar("2026-12-30T10:00:00Z", "Europe/Prague");
    expect(cal[0]).toBe("2026-12-30 Wed (this week)");
    expect(cal).toContain("2027-01-03 Sun (this week)");
    expect(cal).toContain("2027-01-04 Mon (next week)");
    expect(cal).toContain("2027-01-11 Mon (later)");
  });
});
