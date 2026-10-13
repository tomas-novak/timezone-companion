import { useRef, useState } from "react";
import { DateTime } from "luxon";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Zone } from "@/lib/storage";
import { YOUR_TIME, readerZone } from "@/lib/extraction";
import { TIME_HINT } from "@/lib/timeHint";
import { NOT_CONVERTED, headline, landingRows, sentAs } from "@/lib/landing";
import { tzCity } from "@/lib/timezones";
import { callParseTime, firstReaderWithChip, teamZonesFor, toExpressions, type TimeExpression } from "@/lib/timeDetect";
import { ChatFrame } from "./ChatFrame";
import { Headline, MessageText } from "./TimesPopover";

type Outcome = { text: string } & ({ kind: "none" } | { kind: "error" } | { kind: "done"; expressions: TimeExpression[]; ms: number });

const NO_TIME = 'No time found. Try a time like "3pm", "15:00" or "half past three".';

async function readTimes(message: string, you: Zone, cities: Zone[]): Promise<Outcome> {
  const now = DateTime.now().setZone(you.tz).toISO()!;
  const t0 = performance.now();
  const exprs = await callParseTime({ message, senderZone: you.tz, now, teamZones: teamZonesFor(cities) });
  return { text: message, kind: "done", expressions: toExpressions(exprs, message, now), ms: performance.now() - t0 };
}

function Result({ outcome, you, cities, use24Hour }: { outcome: Extract<Outcome, { kind: "done" }>; you: Zone; cities: Zone[]; use24Hour: boolean }) {
  const { text, expressions, ms } = outcome;
  if (!expressions.length) return <p className="text-sm">{NO_TIME}</p>;
  const converted = expressions.filter((e) => e.utcInstant);
  const secs = `${(ms / 1000).toFixed(1)} s`;
  const first = converted[0];
  const day = first && DateTime.fromISO(first.utcInstant!, { zone: "utc" }).setZone(first.sourceZone!).toFormat("ccc d LLL", { locale: "en" });
  const rows = converted.map((e) => landingRows(e, cities, you, null, use24Hour));
  const lines = converted.length ? headline(rows) : [...new Set(expressions.map((e) => `Not converted: ${NOT_CONVERTED[e.flag ?? "not_specific"]}`))];
  const warn = rows.flat().some((r) => r.status === "After hours" || r.status === "Weekend");
  return (
    <div className="space-y-3 rounded-lg border bg-card p-3">
      <h3 className="font-semibold">Before you send</h3>
      <p dir="auto" className="text-sm leading-7">
        <MessageText text={text} expressions={expressions} cities={cities} author={you} viewer={null} use24Hour={use24Hour} />
      </p>
      {warn && (
        <div className="space-y-1 rounded-md border border-amber-400 bg-amber-400/10 p-3">
          <Headline lines={lines} />
          <p className="text-xs text-muted-foreground">Only you see this check. Your colleagues just see the time in their own zone.</p>
        </div>
      )}
      {!converted.length && <Headline lines={lines} />}
      <p className="text-xs text-muted-foreground">
        {day
          ? `AI read it as ${day}, ${sentAs(first, use24Hour)} ${cities.find((z) => z.tz === first.sourceZone)?.city ?? tzCity(first.sourceZone!)} time (${secs})`
          : `AI read it (${secs}): no exact time.`}
      </p>
    </div>
  );
}

export function TryIt({ you, cities, use24Hour }: { you: Zone; cities: Zone[]; use24Hour: boolean }) {
  const [text, setText] = useState("");
  const [outcomes, setOutcomes] = useState<Record<string, Outcome>>({});
  const [checking, setChecking] = useState(false);
  const running = useRef(false);
  // The chat keeps the last message that converted, so it stays while the visitor edits the next one
  const [read, setRead] = useState<{ author: Zone; text: string; expressions: TimeExpression[] } | null>(null);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const viewer = cities.find((z) => z.id === viewerId) ?? cities.find((z) => z.id !== you.id)!;
  const key = text.trim();
  // Keyed by sender zone and text, so an edit or a new home city hides the result and a late answer never shows as current
  const cacheKey = (msg: string) => `${you.tz}|${msg}`;
  const current = outcomes[cacheKey(key)] ?? null;
  const yourTimeNote = YOUR_TIME.test(text) && readerZone(teamZonesFor(cities), you.tz) === null;

  const check = async () => {
    if (running.current || !key || current?.kind === "done") return;
    let r: Outcome = { text: key, kind: "none" };
    if (TIME_HINT.test(key)) {
      running.current = true;
      setChecking(true);
      r = await readTimes(key, you, cities).catch((): Outcome => ({ text: key, kind: "error" }));
      running.current = false;
      setChecking(false);
    }
    setOutcomes((o) => ({ ...o, [cacheKey(r.text)]: r }));
    if (r.kind === "done" && r.expressions.length) {
      setRead({ author: you, text: r.text, expressions: r.expressions });
      setViewerId(firstReaderWithChip(r.expressions, you, cities, use24Hour).id);
    }
  };

  return (
    <section id="try" className="scroll-mt-20 grid gap-6 py-10 lg:grid-cols-2 lg:gap-10">
      <div className="min-w-0 space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Try your own message</h2>
        <label htmlFor="try-message" className="block text-sm text-muted-foreground">
          Sending from {you.city}. Write a message with a time, in English or Arabic.
        </label>
        <Textarea id="try-message" dir="auto" maxLength={500} rows={3} value={text} onChange={(e) => setText(e.target.value)} />
        {yourTimeNote && (
          <p className="rounded-lg border border-amber-400 bg-amber-400/10 p-3 text-sm">
            "Your time" is a different time for each reader, so it won't be converted. Name a city instead, like "3pm Doha time".
          </p>
        )}
        <Button type="button" onClick={check} aria-disabled={checking || !key} className="aria-disabled:opacity-50">
          {checking ? "Checking…" : "Check how it lands"}
        </Button>
        <p className="text-xs text-muted-foreground">Demo: don't paste real company messages. Typed text goes to OpenAI to read the time. The app keeps no copy; OpenAI may keep it for up to 30 days for abuse monitoring.</p>
        <div role="status" className="space-y-2 text-sm">
          {checking && <p className="text-muted-foreground">Checking…</p>}
          {current?.kind === "none" && <p>{NO_TIME}</p>}
          {current?.kind === "error" && (
            <>
              <p>The AI didn't answer.</p>
              <Button type="button" size="sm" variant="outline" onClick={check}>
                Try again
              </Button>
              <p className="text-muted-foreground">The examples above keep working without it.</p>
            </>
          )}
          {current?.kind === "done" && <Result outcome={current} you={you} cities={cities} use24Hour={use24Hour} />}
        </div>
      </div>

      <div className="min-w-0 space-y-3 lg:max-h-[560px] lg:overflow-y-auto">
        <h3 className="font-semibold">What your colleagues read</h3>
        {read ? (
          <ChatFrame
            messages={[{ id: "read", ...read }]}
            cities={cities}
            viewer={viewer}
            onViewerChange={setViewerId}
            use24Hour={use24Hour}
          />
        ) : (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Check a message to read it as another city.</p>
        )}
      </div>
    </section>
  );
}
