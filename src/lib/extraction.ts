// Shared by api/ and the browser, so relative imports only.
import { z } from "zod";
import { DateTime, IANAZone } from "luxon";

// Sent as-is to the model; no pattern/format/min/max because Azure's structured-output subset rejects them
export const EXTRACTION_JSON_SCHEMA = {
  type: "object",
  properties: {
    expressions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: { type: "string" },
          localDate: { type: ["string", "null"] },
          localTime: { type: ["string", "null"] },
          endLocalTime: { type: ["string", "null"] },
          sourceZone: { type: ["string", "null"] },
          zoneReason: { type: "string", enum: ["explicit", "sender_default", "unknown"] },
          flag: { type: ["string", "null"], enum: ["zone_unclear", "day_unclear", "ampm_unclear", "ampm_assumed", "not_specific", null] },
          kind: { type: "string", enum: ["exact", "range", "vague", "ambiguous"] },
        },
        required: ["text", "localDate", "localTime", "endLocalTime", "sourceZone", "zoneReason", "flag", "kind"],
        additionalProperties: false,
      },
    },
  },
  required: ["expressions"],
  additionalProperties: false,
} as const;

export const Expression = z.object({
  text: z.string(),
  localDate: z.string().nullable(),
  localTime: z.string().nullable(),
  endLocalTime: z.string().nullable(),
  sourceZone: z.string().nullable(),
  zoneReason: z.enum(["explicit", "sender_default", "unknown"]),
  flag: z.enum(["zone_unclear", "day_unclear", "ampm_unclear", "ampm_assumed", "not_specific"]).nullable(),
  kind: z.enum(["exact", "range", "vague", "ambiguous"]),
});
export const Extraction = z.object({ expressions: z.array(Expression) });
export type Expr = z.infer<typeof Expression>;
export type Extraction = z.infer<typeof Extraction>;

const Zone = z.string().max(64).refine((s) => IANAZone.isValidZone(s));
export const ParseTimeRequest = z.object({
  message: z.string().min(1).max(500),
  senderZone: Zone,
  now: z.string().max(40).regex(/(Z|[+-]\d\d:\d\d)$/).refine((s) => DateTime.fromISO(s, { setZone: true }).isValid),
  teamZones: z.record(z.string().min(1).max(40), Zone).refine((o) => Object.keys(o).length <= 30),
}).strict();
export type ParseTimeRequest = z.infer<typeof ParseTimeRequest>;

export const YOUR_TIME = /\byour\s+(?:local\s+)?time(?:\s?zone)?\b|بتوقيتك/i;

// "Your time" is the reader's zone, and only a team with exactly one other zone has a single reader zone
export function readerZone(teamZones: Record<string, string>, senderZone: string): string | null {
  const others = new Set(Object.values(teamZones).filter((z) => z !== senderZone));
  return others.size === 1 ? [...others][0] : null;
}

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const YMD = /^\d{4}-\d{2}-\d{2}$/;

export function sanitize(raw: unknown, message: string, senderZone: string, teamZones?: Record<string, string>): Expr[] | null {
  const parsed = Extraction.safeParse(raw);
  if (!parsed.success) return null;
  return parsed.data.expressions.slice(0, 10).flatMap((item) => {
    // The model often reads "your time" as the sender's zone or a random team zone, so code decides it
    const yours = teamZones && YOUR_TIME.test(item.text) ? readerZone(teamZones, senderZone) : undefined;
    const e: Expr =
      yours === undefined
        ? item
        : yours === null
          ? { ...item, sourceZone: null, zoneReason: "unknown" }
          : item.flag === "zone_unclear"
            ? { ...item, sourceZone: yours, zoneReason: "explicit", flag: null, kind: item.endLocalTime ? "range" : "exact" }
            : { ...item, sourceZone: yours, zoneReason: "explicit" };
    if (!e.text || !message.includes(e.text)) return [];
    if ([e.localTime, e.endLocalTime].some((t) => t !== null && !HHMM.test(t))) return [];
    if (e.localDate !== null && !(YMD.test(e.localDate) && DateTime.fromISO(e.localDate).isValid)) return [];
    // sender_default items take the author's zone, so fixtures stored with null work for any author
    const zone = e.zoneReason === "sender_default" ? senderZone : e.sourceZone;
    const sourceZone = zone && IANAZone.isValidZone(zone) ? zone : null;
    // Strict output only checks types, so an "exact" item can still carry an unclear flag; the flag wins
    const flagOk = e.flag === null || e.flag === "ampm_assumed";
    const convertible = flagOk && !!sourceZone && !!e.localTime && (e.kind === "exact" || (e.kind === "range" && !!e.endLocalTime));
    const kind = (e.kind === "exact" || e.kind === "range") && !convertible ? "ambiguous" : e.kind;
    // A downgrade with no flag would fall back to "no exact time" copy when the zone was the real problem
    const flag = kind !== e.kind && !sourceZone ? "zone_unclear" : e.flag;
    return [{ ...e, sourceZone, kind, flag }];
  });
}

export function locate(message: string, exprs: Expr[]) {
  let cursor = 0;
  return exprs.map((e) => {
    let start = message.indexOf(e.text, cursor);
    if (start < 0) start = message.indexOf(e.text);
    cursor = start + e.text.length;
    return { ...e, start, end: start + e.text.length };
  });
}
