// @vitest-environment node
// Live eval against the real model, outside npm test. Run: npm run eval (three runs for the pass bar)
import { describe, expect, it } from "vitest";
import type { Expr } from "./extraction";
import { excerpt } from "./timeHint";

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

type Row = [string, string, string, Want[]];

const SHORT_ROWS: Row[] = [
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
  ["Can we meet at half past three?", "Europe/Prague", "2026-10-13T10:00:00+02:00", [w("exact", null, "15:30", "Europe/Prague", "sender_default", "ampm_assumed")]],
  ["Call at quarter to ten tomorrow", "Europe/London", "2026-10-13T09:00:00+01:00", [w("exact", "2026-10-14", "09:45", "Europe/London", "sender_default")]],
  ["Let's sync at three o'clock Doha time", "Europe/Prague", "2026-10-13T10:00:00+02:00", [w("exact", null, "15:00", "Asia/Qatar", "explicit", "ampm_assumed")]],
  // Greetings name a part of day but are not times
  ["Good morning! Can we do the call at 3pm?", "Europe/London", "2026-10-13T09:00:00+01:00", [w("exact", null, "15:00", "Europe/London", "sender_default")]],
  ["صباح الخير، نلتقي الساعة ٤ مساءً", "Asia/Qatar", "2026-10-13T11:00:00+03:00", [w("exact", null, "16:00", "Asia/Qatar", "sender_default")]],
  ["Thanks everyone, have a good evening!", "Europe/Prague", "2026-10-13T17:00:00+02:00", []],
];

// Long messages go through excerpt, so the day or zone sits in a neighbouring sentence and the rest is cut
const LONG_ROWS: Row[] = [
  [
    "Hi all. The client loved the deck. I'm back in Doha this week. Can we review it at 4pm Doha time? Budget is approved. Legal still has a few questions. Thanks!",
    "Europe/Prague",
    "2026-10-13T10:00:00+02:00",
    [w("exact", null, "16:00", "Asia/Qatar", "explicit")],
  ],
  [
    "Quick update on the launch. QA signed off yesterday. Let's do the go/no-go on Thursday. 10am London time works for me. Marketing is ready. Docs are done.",
    "Europe/Prague",
    "2026-10-13T10:00:00+02:00",
    [w("exact", "2026-10-15", "10:00", "Europe/London", "explicit")],
  ],
  [
    "Standup at 9:30 tomorrow. Nothing else from me. The PR is merged. CI is green. Release notes are drafted. Retro at 4pm on Friday.",
    "Europe/London",
    "2026-10-13T09:00:00+01:00",
    [w("exact", "2026-10-14", "09:30", "Europe/London", "sender_default"), w("exact", "2026-10-16", "16:00", "Europe/London", "sender_default")],
  ],
  [
    "Morning team!\nThe client signed off on the scope.\nLet's kick off on Friday.\n2pm Muscat time suits everyone.\nI'll book the room.\nSlides are in the shared drive.",
    "Europe/Prague",
    "2026-10-13T10:00:00+02:00",
    [w("exact", "2026-10-16", "14:00", "Asia/Muscat", "explicit")],
  ],
  [
    "Quick note from me. The vendor replied last night. They can do the walkthrough at 10 a.m. tomorrow. Delhi time, as usual. Please bring the contract. And the invoice.",
    "Europe/London",
    "2026-10-13T09:00:00+01:00",
    [w("exact", "2026-10-14", "10:00", "Asia/Kolkata", "explicit")],
  ],
  [
    "Update on hiring. The panel is booked. Interview at 3:30pm today. She said \"works for me.\" Her current salary is confidential. The offer letter is drafted.",
    "Asia/Qatar",
    "2026-10-13T11:00:00+03:00",
    [w("exact", "2026-10-13", "15:30", "Asia/Qatar", "sender_default")],
  ],
  [
    "Thanks for the notes. I agree with most of them. The pricing section needs work. Can you block 11am-12:30pm on Thursday for a review? I'll prep the numbers. Talk soon.",
    "Europe/London",
    "2026-10-13T09:00:00+01:00",
    [w("range", "2026-10-15", "11:00", "Europe/London", "sender_default", null, "12:30")],
  ],
  [
    "مرحبا بالجميع. العرض جاهز تقريبا. نحتاج مراجعة أخيرة. نلتقي غدًا الساعة ١١ صباحًا. أرسلوا ملاحظاتكم قبل ذلك. شكرا لكم.",
    "Asia/Muscat",
    "2026-10-13T12:00:00+04:00",
    [w("exact", "2026-10-14", "11:00", "Asia/Muscat", "sender_default")],
  ],
  [
    "The build is green again. Thanks for jumping on it. I still want a proper retro. Can we talk tomorrow afternoon? No rush on the write-up. Have a good one.",
    "Asia/Kolkata",
    "2026-10-13T13:30:00+05:30",
    [w("vague", "2026-10-14", null, "Asia/Kolkata", "sender_default", "not_specific")],
  ],
  [
    "Release 2.5 is out. Pricing stays at 10.30 QAR per seat. We need 2-3 more testers. The build takes about 2h. Docs are updated. I'll send the summary by EOD.",
    "Asia/Qatar",
    "2026-10-13T11:00:00+03:00",
    [],
  ],
  [
    "Hi Ahmed. Following up on yesterday. The contract is ready to sign. Let's do a quick call at 4pm your time. I'll share my screen. Thanks again.",
    "Europe/Prague",
    "2026-10-13T10:00:00+02:00",
    [w("ambiguous", null, "16:00", null, "unknown", "zone_unclear")],
  ],
  [
    "Two things. Standup moves to 9:15 today. Also, the client wants a demo. They proposed 5pm on Friday. That is Doha time. Please confirm soon.",
    "Europe/Prague",
    "2026-10-13T10:00:00+02:00",
    [w("exact", "2026-10-13", "09:15", "Europe/Prague", "sender_default"), w("exact", "2026-10-16", "17:00", "Asia/Qatar", "explicit")],
  ],
  // The neighbouring day belongs to another event, so it must not move the call, in either order
  [
    "Hi team. Budget is approved. The launch is on Thursday. Separately, can we talk at 10am? Bring the slides. Thanks.",
    "Europe/Prague",
    "2026-10-13T10:00:00+02:00",
    [w("exact", null, "10:00", "Europe/Prague", "sender_default")],
  ],
  [
    "Hi team. Budget is approved. Separately, can we talk at 10am? The launch is on Thursday. Bring the slides. Thanks.",
    "Europe/Prague",
    "2026-10-13T10:00:00+02:00",
    [w("exact", null, "10:00", "Europe/Prague", "sender_default")],
  ],
  [
    "Hi everyone, a longer update before the weekend. The migration finished without data loss and the dashboards look healthy. Support tickets dropped by a third. Finance approved the budget for next quarter. We still owe legal the vendor list. Let's review all of this on Monday 19th at 1:30pm. I'll circulate the agenda. If anything breaks, page the on-call. Marketing wants a short blurb for the newsletter. Thanks for a great week, all of you.",
    "Europe/London",
    "2026-10-13T09:00:00+01:00",
    [w("exact", "2026-10-19", "13:30", "Europe/London", "sender_default")],
  ],
];

const ROWS = [...SHORT_ROWS, ...LONG_ROWS];

// 90% of the rows, the same share as the original 24 of 27
const BAR = Math.ceil(ROWS.length * 0.9);

const fieldsMatch = (got: Expr, want: Want, message: string) =>
  message.includes(got.text) &&
  (Array.isArray(want.sourceZone) ? want.sourceZone.includes(got.sourceZone ?? "") : got.sourceZone === want.sourceZone) &&
  (["kind", "localDate", "localTime", "endLocalTime", "zoneReason", "flag"] as const).every((k) => got[k] === want[k]);

describe("parse-time eval (live model)", () => {
  // A long row that excerpt leaves whole or the API would reject tests nothing new
  it.each(LONG_ROWS.map((r) => [r[0]]))("long row is cut and fits the 500-char limit: %s", (message) => {
    expect(message.length).toBeLessThanOrEqual(500);
    expect(excerpt(message)).not.toBe(message);
  });

  it(`passes the bar: 0 critical errors, at least ${BAR} of ${ROWS.length} rows right`, async () => {
    const { extract } = await import("../../api/parse-time");
    const results = await Promise.all(
      ROWS.map(async ([message, senderZone, now, want]) => {
        const t0 = performance.now();
        const got = (await extract({ message: excerpt(message), senderZone, now, teamZones: TEAM })).expressions ?? [];
        const ms = performance.now() - t0;
        const ok = got.length === want.length && want.every((x, i) => fieldsMatch(got[i], x, message));
        const critical = want.every((x) => x.kind !== "exact" && x.kind !== "range") && got.some((g) => g.kind === "exact" || g.kind === "range");
        return { message, ok, critical, got, ms };
      }),
    );
    for (const r of results.filter((r) => !r.ok)) console.log(r.critical ? "CRITICAL" : "wrong", r.message, JSON.stringify(r.got));
    const right = results.filter((r) => r.ok).length;
    const ms = results.map((r) => r.ms).sort((a, b) => a - b);
    const longRight = results.slice(SHORT_ROWS.length).filter((r) => r.ok).length;
    // All calls run in parallel, so these are latencies under a burst, not one call at a time
    console.log(`eval: ${right}/${ROWS.length} right (long ${longRight}/${LONG_ROWS.length}), ${results.filter((r) => r.critical).length} critical, median ${Math.round(ms[Math.floor(ms.length / 2)])} ms, max ${Math.round(ms[ms.length - 1])} ms`);
    expect(results.filter((r) => r.critical)).toHaveLength(0);
    expect(right).toBeGreaterThanOrEqual(BAR);
  }, 120_000);
});
