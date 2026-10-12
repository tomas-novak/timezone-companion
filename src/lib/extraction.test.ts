import { describe, expect, it } from "vitest";
import { EXTRACTION_JSON_SCHEMA, Expression, ParseTimeRequest, locate, sanitize, type Expr } from "./extraction";

const expr = (over: Partial<Expr> = {}): Expr => ({
  text: "3pm",
  localDate: null,
  localTime: "15:00",
  endLocalTime: null,
  sourceZone: null,
  zoneReason: "sender_default",
  flag: null,
  kind: "exact",
  ...over,
});
const run = (items: Expr[], message = "call at 3pm", zone = "Europe/Prague") =>
  sanitize({ expressions: items }, message, zone);

describe("sanitize", () => {
  it("drops items whose text is not in the message", () => {
    expect(run([expr({ text: "4pm" })])).toEqual([]);
  });

  it("drops bad times and dates", () => {
    expect(run([expr({ localTime: "24:00" })])).toEqual([]);
    expect(run([expr({ localDate: "2026-02-30" })])).toEqual([]);
  });

  it("fills the sender zone for sender_default items", () => {
    expect(run([expr({ sourceZone: "Asia/Qatar" })])![0].sourceZone).toBe("Europe/Prague");
  });

  it("nulls a bad explicit zone and downgrades exact to ambiguous", () => {
    const [e] = run([expr({ sourceZone: "Mars/Base", zoneReason: "explicit" })])!;
    expect(e.sourceZone).toBeNull();
    expect(e.kind).toBe("ambiguous");
    expect(e.flag).toBe("zone_unclear");
  });

  it("keeps an exact item with an unclear flag unconverted", () => {
    for (const flag of ["ampm_unclear", "zone_unclear", "day_unclear", "not_specific"] as const)
      expect(run([expr({ flag })])![0]).toMatchObject({ kind: "ambiguous", flag });
    expect(run([expr({ flag: "ampm_assumed" })])![0].kind).toBe("exact");
  });

  it("downgrades a range without an end", () => {
    expect(run([expr({ kind: "range" })])![0].kind).toBe("ambiguous");
  });

  it("caps at 10 items", () => {
    expect(run(Array.from({ length: 12 }, () => expr()))).toHaveLength(10);
  });

  it("returns null for anything that is not an extraction", () => {
    expect(sanitize("nope", "call at 3pm", "Europe/Prague")).toBeNull();
    expect(sanitize({ expressions: [{ text: 1 }] }, "call at 3pm", "Europe/Prague")).toBeNull();
  });

  it("keeps the JSON schema and zod keys in sync", () => {
    const item = EXTRACTION_JSON_SCHEMA.properties.expressions.items;
    expect(Object.keys(item.properties).sort()).toEqual(Object.keys(Expression.shape).sort());
    expect([...item.required].sort()).toEqual(Object.keys(Expression.shape).sort());
  });
});

describe("locate", () => {
  it("finds repeated text in order", () => {
    const [a, b] = locate("3pm or 3pm", [expr(), expr()]);
    expect([a.start, a.end, b.start, b.end]).toEqual([0, 3, 7, 10]);
  });

  it("slices Arabic back to the same text", () => {
    const message = "هل نعقد المراجعة يوم الأحد الساعة ١٠ صباحًا؟";
    const text = "يوم الأحد الساعة ١٠ صباحًا";
    const [e] = locate(message, [expr({ text })]);
    expect(message.slice(e.start, e.end)).toBe(text);
  });
});

describe("ParseTimeRequest", () => {
  const ok = { message: "call at 3pm", senderZone: "Europe/Prague", now: "2026-10-13T10:00:00.000+02:00", teamZones: { Prague: "Europe/Prague" } };

  it("accepts a valid request", () => {
    expect(ParseTimeRequest.safeParse(ok).success).toBe(true);
  });

  it.each([
    ["501 chars", { ...ok, message: "a".repeat(501) }],
    ["31 zones", { ...ok, teamZones: Object.fromEntries(Array.from({ length: 31 }, (_, i) => [`c${i}`, "Europe/Prague"])) }],
    ["a bad zone", { ...ok, senderZone: "Mars/Base" }],
    ["an extra key", { ...ok, extra: 1 }],
  ])("rejects %s", (_, body) => {
    expect(ParseTimeRequest.safeParse(body).success).toBe(false);
  });
});
