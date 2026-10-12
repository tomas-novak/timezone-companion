// @vitest-environment node
// Live eval against the real model. Run: RUN_EVAL=1 npx vitest run src/lib/parseTime.eval.test.ts (three runs for the pass bar)
import { describe, expect, it } from "vitest";
import type { Expr } from "./extraction";

try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local: the key must come from the shell
}

const TEAM = {
  Prague: "Europe/Prague",
  London: "Europe/London",
  Tunis: "Africa/Tunis",
  Doha: "Asia/Qatar",
  Muscat: "Asia/Muscat",
  Baghdad: "Asia/Baghdad",
  "New Delhi": "Asia/Kolkata",
};

type Want = Omit<Expr, "text" | "sourceZone"> & { sourceZone: string | string[] | null };
const w = (kind: Expr["kind"], localDate: string | null, localTime: string | null, sourceZone: Want["sourceZone"], zoneReason: Expr["zoneReason"], flag: Expr["flag"] = null, endLocalTime: string | null = null): Want => ({
  kind,
  localDate,
  localTime,
  endLocalTime,
  sourceZone,
  zoneReason,
  flag,
});

const ROWS: [string, string, string, Want[]][] = [
  ["Let's do the call at 3pm", "Europe/Prague", "2026-10-13T10:00:00+02:00", [w("exact", null, "15:00", "Europe/Prague", "sender_default")]],
  ["Standup tomorrow at 9:30", "Europe/London", "2026-10-13T09:00:00+01:00", [w("exact", "2026-10-14", "09:30", "Europe/London", "sender_default")]],
  ["Can you join Thursday 2pm Doha time?", "Europe/Prague", "2026-10-13T10:00:00+02:00", [w("exact", "2026-10-15", "14:00", "Asia/Qatar", "explicit")]],
  ["Demo at noon Muscat", "Asia/Kolkata", "2026-10-13T13:30:00+05:30", [w("exact", null, "12:00", "Asia/Muscat", "explicit")]],
  ["Deploy window opens at 18:00 my time", "Asia/Baghdad", "2026-10-13T11:00:00+03:00", [w("exact", null, "18:00", "Asia/Baghdad", "explicit")]],
  ["الاجتماع غدًا الساعة ٣:٣٠ مساءً", "Asia/Qatar", "2026-10-13T11:00:00+03:00", [w("exact", "2026-10-14", "15:30", "Asia/Qatar", "sender_default")]],
  ["نلتقي يوم الخميس الساعة ١٠ صباحًا بتوقيت مسقط", "Asia/Baghdad", "2026-10-13T11:00:00+03:00", [w("exact", "2026-10-15", "10:00", "Asia/Muscat", "explicit")]],
  ["Release review at 4pm AST", "Europe/Prague", "2026-10-13T10:00:00+02:00", [w("exact", null, "16:00", ["Asia/Qatar", "Asia/Baghdad"], "explicit")]],
  ["Can we move it to Monday 26th at 9am London?", "Europe/Prague", "2026-10-13T10:00:00+02:00", [w("exact", "2026-10-26", "09:00", "Europe/London", "explicit")]],
  ["Ping me at 9pm IST if the build fails", "Europe/London", "2026-10-13T09:00:00+01:00", [w("exact", null, "21:00", "Asia/Kolkata", "explicit")]],
  ["I'm free 3-4pm tomorrow", "Europe/London", "2026-10-13T09:00:00+01:00", [w("range", "2026-10-14", "15:00", "Europe/London", "sender_default", null, "16:00")]],
  ["متاح من ٢ إلى ٤ مساءً", "Asia/Muscat", "2026-10-13T12:00:00+04:00", [w("range", null, "14:00", "Asia/Muscat", "sender_default", null, "16:00")]],
  ["Maintenance window 11pm-1am Delhi time", "Europe/Prague", "2026-10-13T10:00:00+02:00", [w("range", null, "23:00", "Asia/Kolkata", "explicit", null, "01:00")]],
  ["Let's sync at 3pm your time", "Europe/Prague", "2026-10-13T10:00:00+02:00", [w("ambiguous", null, "15:00", null, "unknown", "zone_unclear")]],
  ["Can we do next Thursday at 10am?", "Europe/Prague", "2026-10-13T10:00:00+02:00", [w("exact", "2026-10-22", "10:00", "Europe/Prague", "sender_default")]],
  ["Meet at 7?", "Asia/Qatar", "2026-10-13T11:00:00+03:00", [w("ambiguous", null, null, "Asia/Qatar", "sender_default", "ampm_unclear")]],
  ["Call at 5pm CST", "Europe/London", "2026-10-13T09:00:00+01:00", [w("ambiguous", null, "17:00", null, "unknown", "zone_unclear")]],
  ["I'll send it by EOD", "Africa/Tunis", "2026-10-13T09:00:00+01:00", []],
  ["Let's talk tomorrow morning Doha time", "Europe/London", "2026-10-13T09:00:00+01:00", [w("vague", "2026-10-14", null, "Asia/Qatar", "explicit", "not_specific")]],
  ["Can we catch up this afternoon?", "Asia/Kolkata", "2026-10-13T13:30:00+05:30", [w("vague", "2026-10-13", null, "Asia/Kolkata", "sender_default", "not_specific")]],
  ["Version 1.10 ships Monday", "Europe/Prague", "2026-10-13T10:00:00+02:00", []],
  ["Budget is 10.30 QAR per seat", "Asia/Qatar", "2026-10-13T11:00:00+03:00", []],
  ["We need 2-3 people for tomorrow's demo", "Europe/London", "2026-10-13T09:00:00+01:00", []],
  ["Use the 16:10 aspect ratio for slides", "Asia/Muscat", "2026-10-13T12:00:00+04:00", []],
  ["Build takes about 2h on CI", "Europe/Prague", "2026-10-13T10:00:00+02:00", []],
  [
    "Standup 9:30 Prague, then client call at 2pm Doha",
    "Europe/Prague",
    "2026-10-13T10:00:00+02:00",
    [w("exact", null, "09:30", "Europe/Prague", "explicit"), w("exact", null, "14:00", "Asia/Qatar", "explicit")],
  ],
  [
    "Options: Wed 11am or Thu 4pm (London time for both)",
    "Asia/Baghdad",
    "2026-10-13T11:00:00+03:00",
    [w("exact", "2026-10-14", "11:00", "Europe/London", "explicit"), w("exact", "2026-10-15", "16:00", "Europe/London", "explicit")],
  ],
];

const fieldsMatch = (got: Expr, want: Want, message: string) =>
  message.includes(got.text) &&
  (Array.isArray(want.sourceZone) ? want.sourceZone.includes(got.sourceZone ?? "") : got.sourceZone === want.sourceZone) &&
  (["kind", "localDate", "localTime", "endLocalTime", "zoneReason", "flag"] as const).every((k) => got[k] === want[k]);

describe.skipIf(!process.env.RUN_EVAL)("parse-time eval (live model)", () => {
  it("passes the bar: 0 critical errors, at least 24 of 27 rows right", async () => {
    const { extract } = await import("../../api/parse-time");
    const results = await Promise.all(
      ROWS.map(async ([message, senderZone, now, want]) => {
        const got = (await extract({ message, senderZone, now, teamZones: TEAM })).expressions ?? [];
        const ok = got.length === want.length && want.every((x, i) => fieldsMatch(got[i], x, message));
        const critical = want.every((x) => x.kind !== "exact" && x.kind !== "range") && got.some((g) => g.kind === "exact" || g.kind === "range");
        return { message, ok, critical, got };
      }),
    );
    for (const r of results.filter((r) => !r.ok)) console.log(r.critical ? "CRITICAL" : "wrong", r.message, JSON.stringify(r.got));
    const right = results.filter((r) => r.ok).length;
    console.log(`eval: ${right}/27 right, ${results.filter((r) => r.critical).length} critical`);
    expect(results.filter((r) => r.critical)).toHaveLength(0);
    expect(right).toBeGreaterThanOrEqual(24);
  }, 120_000);
});
