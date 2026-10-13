import { Link } from "react-router-dom";
import { DateTime } from "luxon";
import { Button } from "@/components/ui/button";
import { DEMO_CITIES, DEMO_NOW, EXAMPLES, UNCLEAR_EXAMPLE } from "@/lib/demoPresets";
import { teamZonesFor } from "@/lib/timeDetect";
import { MessageText } from "./TimesPopover";

const H2 = "text-2xl font-semibold tracking-tight sm:text-3xl";
const BUBBLE = "max-w-[90%] rounded-lg border bg-background px-3 py-2 text-sm leading-7";

export function Hero() {
  return (
    <section id="top" className="scroll-mt-20 space-y-5 pt-4">
      <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">You write your time. Everyone reads theirs.</h1>
      <p className="max-w-2xl text-lg sm:text-xl">
        When someone proposes a time, or I propose one, I open a world clock and do the maths. So does everyone else in the chat. Timezone
        Companion does it for all of us, in Teams and Outlook.
      </p>
      <p className="max-w-2xl text-muted-foreground">
        Ooredoo works across 9 markets, from UTC+1 to UTC+7, with Sunday–Thursday and Monday–Friday weeks.
      </p>
      <div className="max-w-2xl rounded-lg border border-primary/40 bg-primary/10 p-4">
        <p className="text-lg">
          Imagine you are writing an email, or chatting in Teams, with colleagues in{" "}
          <b>{new Intl.ListFormat("en", { type: "conjunction" }).format(DEMO_CITIES.map((z) => z.city))}</b>.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">Every example on this page uses these five cities.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button asChild size="lg">
          <a href="#write">See how it works</a>
        </Button>
        <Button asChild size="lg" variant="outline">
          <a href="#try">Try your own message</a>
        </Button>
      </div>
    </section>
  );
}

const TODAY: [string, string][] = [
  ["Prague", "Can we meet Thursday at 3pm?"],
  ["Doha", "Your time or mine?"],
  ["New Delhi", "That's 18:30 for me. Can we do earlier?"],
];

export function Today() {
  return (
    <section id="today" className="scroll-mt-20 space-y-4">
      <h2 className={H2}>Today</h2>
      <div className="max-w-xl space-y-3 rounded-lg border bg-card p-3 shadow-sm">
        {TODAY.map(([city, text]) => (
          <div key={city} className="flex flex-col items-start">
            <span className="text-xs text-muted-foreground">{city}</span>
            <p className={BUBBLE}>{text}</p>
          </div>
        ))}
      </div>
      <p className="max-w-xl text-lg">Three extra messages to agree on one time. Every week, in every cross-country team.</p>
    </section>
  );
}

const PRAGUE = DEMO_CITIES.find((z) => z.tz === "Europe/Prague")!;
const DOHA = DEMO_CITIES.find((z) => z.tz === "Asia/Qatar")!;

const { text: message, author } = EXAMPLES[0];
const REQUEST = JSON.stringify(
  { message, senderZone: author.tz, now: DateTime.fromISO(DEMO_NOW).setZone(author.tz).toISO(), teamZones: teamZonesFor(DEMO_CITIES) },
  null,
  2,
);

export function Trust({ use24Hour }: { use24Hour: boolean }) {
  return (
    <section id="trust" className="scroll-mt-20 space-y-6">
      <h2 className={H2}>Why you can trust it</h2>
      <ul className="max-w-3xl list-disc space-y-4 pl-5">
        <li>The AI only reads the time in the sentence. Calendar maths does the conversion.</li>
        <li className="space-y-2">
          <p>If a time is unclear, like "3pm your time" in a group, it is flagged, not guessed.</p>
          <div className="flex max-w-sm flex-col items-start rounded-lg border bg-card p-3">
            <span className="text-xs text-muted-foreground">{PRAGUE.city}</span>
            <p dir="auto" className={BUBBLE}>
              <MessageText
                text={UNCLEAR_EXAMPLE.text}
                expressions={UNCLEAR_EXAMPLE.expressions}
                cities={DEMO_CITIES}
                author={PRAGUE}
                viewer={DOHA}
                use24Hour={use24Hour}
              />
            </p>
          </div>
        </li>
        <li>
          Tested on 30 English and Arabic messages, 3 runs, 0 unclear times shown as exact. Median answer about 1.5 s. About $0.10–0.34 per 1,000
          messages.
        </li>
      </ul>
      <details className="max-w-3xl rounded-lg border bg-card p-4">
        <summary className="cursor-pointer font-medium">What the AI receives</summary>
        <div className="mt-3 space-y-3 text-sm">
          <p>The message, the sender's zone, the date and the team's cities. The app adds no names and no calendars, and the AI never learns who is reading.</p>
          <pre className="max-w-full overflow-x-auto rounded-md bg-muted p-3 text-xs">{REQUEST}</pre>
        </div>
      </details>
    </section>
  );
}

const BUILD = [
  "Teams: a compose button checks the time and posts a card that shows each reader their own time.",
  "Outlook: a check on Send, and a side pane that shows the times in an email you read.",
  "Who is where: time zones and working hours come from each person's Outlook settings, not from reading calendars or messages.",
  "Data: in production the AI runs on Ooredoo's own Azure OpenAI, so no message leaves the company.",
  "What we need: a Teams app registration, an Outlook add-in deployed by IT, and a security review of one small data flow.",
  "Effort: a pilot in about 4–6 weeks for one or two developers (our estimate).",
  "Limit: third-party apps cannot rewrite every typed message. The check runs on the sender's action or on Send.",
];

export function Build() {
  return (
    <section id="build" className="scroll-mt-20 space-y-6">
      <h2 className={H2}>Can Ooredoo build it?</h2>
      <ul className="grid gap-x-10 gap-y-4 lg:grid-cols-2">
        {BUILD.map((item) => {
          const i = item.indexOf(":");
          return (
            <li key={item}>
              <span className="font-semibold">{item.slice(0, i + 1)}</span>
              {item.slice(i + 1)}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function Ask() {
  return (
    <section id="ask" className="scroll-mt-20 space-y-4 rounded-xl border bg-primary/10 p-6 sm:p-10">
      <h2 className="sr-only">The ask</h2>
      <p className="max-w-3xl text-2xl font-semibold tracking-tight sm:text-3xl">
        A 90-day pilot with one cross-country team. We count late and weekend times caught before sending.
      </p>
      <Link to="/" className="inline-block font-medium text-primary underline-offset-4 hover:underline">
        The world clock tool works today <span aria-hidden>→</span>
      </Link>
    </section>
  );
}
