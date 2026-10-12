// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { DateTime, Settings } from "luxon";
import { createZone } from "./storage";
import { sanitize, type Expr } from "./extraction";
import { callParseTime, chipFor, firstReaderWithChip, sameOffsetEverywhere, teamZonesFor, toExpressions } from "./timeDetect";
import { DEMO_NOW, PRESETS, fixtureFor } from "./demoPresets";

const PRAGUE = "Europe/Prague";
const prague = createZone(PRAGUE);
const tunis = createZone("Africa/Tunis");
const doha = createZone("Asia/Qatar");
const muscat = createZone("Asia/Muscat");
const delhi = createZone("Asia/Kolkata");

const exact = (localDate: string | null, localTime: string, sourceZone = PRAGUE, over: Partial<Expr> = {}): Expr => ({
  text: "x",
  localDate,
  localTime,
  endLocalTime: null,
  sourceZone,
  zoneReason: "sender_default",
  flag: null,
  kind: "exact",
  ...over,
});
const one = (e: Expr, now = DEMO_NOW) => toExpressions([e], "x", now)[0];

describe("toExpressions", () => {
  it("resolves a null date to today in the source zone", () => {
    const e = one(exact(null, "09:00", "Asia/Kolkata"), "2026-10-13T20:00:00Z");
    expect(DateTime.fromISO(e.utcInstant!).setZone("Asia/Kolkata").toISODate()).toBe("2026-10-14");
  });

  it("ends a 23:00–01:00 range the next day", () => {
    const e = one(exact("2026-10-15", "23:00", PRAGUE, { kind: "range", endLocalTime: "01:00" }));
    expect(e.endUtcInstant).toBe("2026-10-15T23:00:00.000Z");
  });

  it("does not convert a time skipped or repeated by a clock change", () => {
    for (const date of ["2026-03-29", "2026-10-25"]) {
      const e = one(exact(date, "02:30"));
      expect(e.utcInstant).toBeNull();
      expect(e.flag).toBe("clock_change");
    }
    expect(one(exact("2026-10-25", "01:00", PRAGUE, { kind: "range", endLocalTime: "02:30" })).utcInstant).toBeNull();
  });

  it("leaves unclear items without an instant", () => {
    expect(one(exact(null, "15:00", null, { kind: "ambiguous", flag: "zone_unclear" })).utcInstant).toBeNull();
  });
});

describe("chipFor", () => {
  it("follows the EU clock change on 26 Oct", () => {
    const e = one(exact("2026-10-26", "15:00"));
    expect(chipFor(e, doha, PRAGUE, true)).toMatchObject({ time: "17:00", weekday: null, suffix: "late" });
    expect(chipFor(e, tunis, PRAGUE, true)).toBeNull();
  });

  it("leads with the weekday when the reader's date differs", () => {
    const e = one(exact("2026-10-15", "23:00"));
    expect(chipFor(e, doha, PRAGUE, true)).toMatchObject({ time: "00:00", weekday: "Fri", status: "weekend", suffix: "weekend" });
    expect(chipFor(e, delhi, PRAGUE, true)).toMatchObject({ time: "02:30", weekday: "Fri", status: "outside", suffix: "after hours" });
  });

  it("marks early and late", () => {
    expect(chipFor(one(exact("2026-10-15", "07:30")), doha, PRAGUE, true)).toMatchObject({ time: "08:30", suffix: "early" });
    expect(chipFor(one(exact("2026-10-15", "16:00", "Asia/Qatar")), muscat, "Asia/Qatar", true)).toMatchObject({
      time: "17:00",
      status: "reasonable",
      suffix: "late",
    });
  });

  it("reads early and late around a night shift", () => {
    const night = { ...doha, workingStart: "22:00", workingEnd: "06:00", reasonableStart: "20:00", reasonableEnd: "08:00" };
    expect(chipFor(one(exact("2026-10-15", "21:00", "Asia/Qatar")), night, PRAGUE, true, { keepSameOffset: true })).toMatchObject({ suffix: "early" });
    expect(chipFor(one(exact("2026-10-15", "07:00", "Asia/Qatar")), night, PRAGUE, true, { keepSameOffset: true })).toMatchObject({ suffix: "late" });
  });

  it("judges a range by its worst moment, not only its start", () => {
    const e = one(exact("2026-10-15", "16:00", PRAGUE, { kind: "range", endLocalTime: "20:00" }));
    expect(chipFor(e, prague, PRAGUE, true, { keepSameOffset: true })).toMatchObject({ time: "16:00–20:00", status: "outside", suffix: "after hours" });
  });

  it("shows a range whose end crosses a clock change only in the source zone", () => {
    const e = one(exact("2026-03-28", "23:00", PRAGUE, { kind: "range", endLocalTime: "04:00" }));
    expect(chipFor(e, tunis, PRAGUE, true)).toMatchObject({ time: "23:00–03:00" });
  });

  it("keeps same-offset readers for sender pills", () => {
    const e = one(exact("2026-10-26", "15:00"));
    expect(chipFor(e, tunis, PRAGUE, true, { keepSameOffset: true })).toMatchObject({ time: "15:00" });
  });

  it("shows unclear to readers, nothing to the author", () => {
    const e = one(exact(null, "15:00", null, { kind: "ambiguous", flag: "zone_unclear" }));
    expect(chipFor(e, doha, PRAGUE, true)).toEqual({ type: "unclear", flag: "zone_unclear" });
    expect(chipFor(e, prague, PRAGUE, true)).toBeNull();
    expect(chipFor(e, createZone("Asia/Riyadh"), "Asia/Qatar", true)).toBeNull();
  });

  it("formats 12-hour time", () => {
    expect(chipFor(one(exact("2026-10-15", "15:00")), doha, PRAGUE, false)).toMatchObject({ time: "4:00 PM" });
  });

  it("stays English in a Czech browser", () => {
    Settings.defaultLocale = "cs";
    try {
      expect(chipFor(one(exact("2026-10-15", "23:00")), doha, PRAGUE, false)).toMatchObject({ time: "12:00 AM", weekday: "Fri" });
    } finally {
      Settings.defaultLocale = "en-US";
    }
  });

  it("reads early correctly with Arabic-Indic digits", () => {
    Settings.defaultLocale = "ar-QA";
    try {
      expect(chipFor(one(exact("2026-10-15", "07:30")), doha, PRAGUE, true)).toMatchObject({ time: "08:30", suffix: "early" });
    } finally {
      Settings.defaultLocale = "en-US";
    }
  });
});

describe("teamZonesFor", () => {
  it("sends city names from the zone, never the labels people typed", () => {
    const team = teamZonesFor([{ ...prague, city: "Alice" }, { ...delhi, city: "" }, { ...doha, city: "Office" }, createZone("America/Argentina/Buenos_Aires")]);
    expect(team).toEqual({ Prague: PRAGUE, "New Delhi": "Asia/Kolkata", Doha: "Asia/Qatar", "Buenos Aires": "America/Argentina/Buenos_Aires" });
  });
});

describe("firstReaderWithChip", () => {
  it("skips readers on the author's offset", () => {
    const algiers = createZone("Africa/Algiers");
    const [e] = toExpressions([exact("2026-10-15", "15:00", "Africa/Tunis")], "x", DEMO_NOW);
    expect(firstReaderWithChip([e], tunis, [tunis, algiers, doha], true)?.tz).toBe("Asia/Qatar");
    expect(firstReaderWithChip([], tunis, [tunis, algiers, doha], true)?.tz).toBe("Africa/Algiers");
  });
});

describe("sameOffsetEverywhere", () => {
  const at = (iso: string) => DateTime.fromISO(iso);
  it("is true for Doha and Baghdad", () => {
    expect(sameOffsetEverywhere(["Asia/Qatar", "Asia/Baghdad"], at(DEMO_NOW))).toBe(true);
  });
  it("is false for Prague and Tunis, before and after the clock change", () => {
    expect(sameOffsetEverywhere([PRAGUE, "Africa/Tunis"], at(DEMO_NOW))).toBe(false);
    expect(sameOffsetEverywhere([PRAGUE, "Africa/Tunis"], at("2026-11-01T10:00:00Z"))).toBe(false);
  });
});

describe("demo fixtures", () => {
  it.each(PRESETS)("$id passes sanitize", (p) => {
    const authorTz = p.authorTz ?? PRAGUE;
    const exprs = sanitize(fixtureFor(p.id), p.text, authorTz);
    expect(exprs).not.toBeNull();
    if (p.id === "not-time") expect(exprs).toEqual([]);
    else if (p.id === "unclear") expect(exprs![0].kind).toBe("ambiguous");
    else expect(exprs!.map((e) => e.kind)).toEqual(["exact"]);
  });
});

describe("callParseTime", () => {
  const body = { message: "call at 3pm", senderZone: PRAGUE, now: "2026-10-13T10:00:00.000+02:00", teamZones: {} };
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("aborts after 8 s", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      (_: string, init: RequestInit) =>
        new Promise((_, reject) => init.signal!.addEventListener("abort", () => reject(new Error("aborted")))),
    );
    const p = callParseTime(body);
    const assertion = expect(p).rejects.toThrow("aborted");
    await vi.advanceTimersByTimeAsync(8000);
    await assertion;
  });

  it("throws on 502", async () => {
    vi.stubGlobal("fetch", async () => new Response(null, { status: 502 }));
    await expect(callParseTime(body)).rejects.toThrow("parse-time 502");
  });
});
