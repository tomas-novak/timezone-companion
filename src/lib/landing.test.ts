import { describe, expect, it } from "vitest";
import { DEMO_CITIES, DEMO_NOW, EXAMPLES, UNCLEAR_EXAMPLE, youFor } from "./demoPresets";
import { headline, landingRows } from "./landing";
import { toExpressions } from "./timeDetect";

const [friday, thursday, sunday] = ["friday", "exact", "arabic"].map((id) => EXAMPLES.find((x) => x.id === id)!);
const doha = DEMO_CITIES.find((z) => z.city === "Doha")!;
const rows = (ex = thursday, viewer: typeof doha | null = null) => landingRows(ex.expressions[0], DEMO_CITIES, ex.author, viewer, true);

describe("story numbers", () => {
  it("Thursday 3pm from Tunis", () => {
    expect(rows().map((r) => `${r.zone.city} ${r.time} ${r.status}`)).toEqual([
      "Prague 16:00 Working hours",
      "Muscat 18:00 Late",
      "Doha 17:00 Late",
      "New Delhi 19:30 After hours",
    ]);
    expect(headline([rows()])).toEqual(["After hours for 1 city: New Delhi", "Late in the day for 2 cities: Muscat, Doha"]);
  });

  it("Friday 11am from Prague", () => {
    expect(headline([rows(friday)])).toEqual(["Weekend for 2 cities: Muscat, Doha"]);
  });

  it("Sunday 10am from Doha, in Arabic", () => {
    expect(sunday.expressions).toHaveLength(1);
    expect(headline([rows(sunday)])).toEqual(["Weekend for 3 cities: Tunis, Prague, New Delhi"]);
  });

  it("the reader and the author carry no status", () => {
    const r = rows(thursday, doha);
    expect(r.find((x) => x.role === "you")).toMatchObject({ zone: doha, time: "17:00", status: null });
    expect(r.find((x) => x.role === "author")).toMatchObject({ time: "15:00", status: null });
    expect(r.map((x) => x.date)).toContain("Thu 22 Oct");
  });

  it("the unclear example stays unconverted", () => {
    expect(UNCLEAR_EXAMPLE.expressions[0]).toMatchObject({ kind: "ambiguous", flag: "zone_unclear", utcInstant: null });
  });
});

describe("headline", () => {
  it("lists worst first and says so when everyone is working", () => {
    expect(headline([[]])).toEqual(["Working hours for every city"]);
  });
});

describe("youFor", () => {
  it("adds a sixth city when home is not one of the five", () => {
    expect(youFor("Asia/Jakarta")).toMatchObject({ inDemo: false, you: { city: "Jakarta" } });
    expect(youFor("Asia/Jakarta").cities).toHaveLength(6);
    expect(youFor("Asia/Qatar")).toMatchObject({ inDemo: true, you: doha });
  });
});

describe("rows as written", () => {
  const prague = DEMO_CITIES.find((z) => z.city === "Prague")!;
  const delhi = DEMO_CITIES.find((z) => z.city === "New Delhi")!;
  const text = "Lunch tomorrow 1pm Doha time";
  const [e] = toExpressions([{ text: "1pm Doha time", localDate: "2026-10-14", localTime: "13:00", endLocalTime: null, sourceZone: "Asia/Qatar", zoneReason: "explicit", flag: null, kind: "exact" }], text, DEMO_NOW);

  it("the author row keeps the zone the time was written in", () => {
    expect(landingRows(e, DEMO_CITIES, prague, doha, true).find((r) => r.role === "author")).toMatchObject({ time: "13:00 Doha time", date: "Wed 14 Oct" });
  });

  it("a reader's headline never claims their own hours", () => {
    expect(headline([landingRows(thursday.expressions[0], DEMO_CITIES, thursday.author, delhi, true)])).toEqual(["Late in the day for 2 cities: Muscat, Doha"]);
    expect(headline([landingRows(e, DEMO_CITIES, prague, doha, true)])).toEqual(["Working hours for every other city"]);
  });
});
