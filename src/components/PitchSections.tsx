import { Link } from "react-router-dom";
import { useState } from "react";
import { DateTime } from "luxon";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DEMO_CITIES, DEMO_NOW, EXAMPLES, UNCLEAR_EXAMPLE } from "@/lib/demoPresets";
import { teamZonesFor } from "@/lib/timeDetect";
import teamsToday from "@/assets/teams-today.png";
import { MessageText } from "./TimesPopover";
import { TeamsMessage } from "./ChatFrame";

export const H2 = "text-3xl font-bold tracking-tight sm:text-4xl";

export function Hero() {
  return (
    <section id="top" className="dark scroll-mt-20 space-y-6 rounded-3xl border bg-background p-6 text-foreground sm:p-12 lg:p-16">
      <p className="inline-block rounded-full border border-primary/60 px-3 py-1 text-sm font-medium text-primary">Built for Ooredoo BuildAI</p>
      <h1 className="max-w-4xl text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
        You write your time. Everyone reads <span className="text-primary">theirs.</span>
      </h1>
      <p className="max-w-2xl text-lg sm:text-xl">
        When someone proposes a time, I open a world clock and do the maths. So does everyone else in the chat. Timezone Companion uses AI
        to find the time in a message, shows every reader their own time, and warns the sender before it lands on someone's evening or
        weekend.
      </p>
      <p className="max-w-2xl font-medium">Live now: the demo on this page, with a real AI call. Next: a pilot inside Teams and Outlook.</p>
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
        <Button asChild size="lg" className="bg-white text-brand-navy hover:bg-white/90">
          <a href="#try">Try your own message</a>
        </Button>
      </div>
    </section>
  );
}

const TODAY_ALT = [
  "A Teams chat called Rollout plan.",
  "Me: Can we meet Thursday at 3pm?",
  "Jiri Kazda: 3PM your time or my time?",
  "Me: Prague time CET, sorry.",
  "Vaclav Trnka: That's 18:30 for me. Can we do earlier?",
  "Me: Ops sorry, then on Friday at 11am Prague time.",
  "Vaclav Trnka: 14:30 here, works.",
  "Jiri Kazda: Well, that's a non-working day for me in Doha. But OK, I will join.",
].join(" ");

export function Today() {
  const [zoomed, setZoomed] = useState(false);
  return (
    <section id="today" className="scroll-mt-20 space-y-4">
      <h2 className={H2}>Today</h2>
      <Dialog open={zoomed} onOpenChange={setZoomed}>
        <DialogTrigger className="block w-full cursor-zoom-in rounded-lg">
          <img src={teamsToday} alt={TODAY_ALT} width={1458} height={887} loading="lazy" className="h-auto w-full" />
          <span className="sr-only">Show full screen</span>
        </DialogTrigger>
        <DialogContent className="light block h-dvh w-screen max-w-none rounded-none border-0 bg-white p-0 text-foreground sm:rounded-none">
          <DialogTitle className="sr-only">Rollout plan chat</DialogTitle>
          {/* Pans at a readable width on phones; a tap closes it like a photo viewer, keyboard users have Close and Esc */}
          <div onClick={() => setZoomed(false)} className="flex h-full w-full cursor-zoom-out overflow-auto">
            <img src={teamsToday} alt={TODAY_ALT} width={1458} height={887} className="m-auto h-auto w-[900px] max-w-none shrink-0 sm:w-full sm:max-w-[1458px]" />
          </div>
        </DialogContent>
      </Dialog>
      <p className="max-w-xl text-lg">
        Seven messages to agree on one time, and it still landed on a non-working day in Doha. Every week, in every cross-country team.
      </p>
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
        <li>The AI only finds the time in the message. Calendar maths does the conversion.</li>
        <li className="space-y-2">
          <p>If a time is unclear, like "3pm your time" in a group, it is flagged, not guessed.</p>
          <div className="light max-w-sm rounded-lg border bg-background p-3 text-foreground">
            <TeamsMessage author={PRAGUE} mine={false}>
              <p dir="auto">
                <MessageText
                  text={UNCLEAR_EXAMPLE.text}
                  expressions={UNCLEAR_EXAMPLE.expressions}
                  cities={DEMO_CITIES}
                  author={PRAGUE}
                  viewer={DOHA}
                  use24Hour={use24Hour}
                />
              </p>
            </TeamsMessage>
          </div>
        </li>
        <li>Tested on 93 English and Arabic messages in 3 runs: 84 to 89 right each run, and the AI never invented a time. Median answer 1.5 s.</li>
      </ul>
      <p className="max-w-3xl text-sm">
        Full eval report:{" "}
        <a className="underline underline-offset-2" href="/eval/eval-report.pdf" download>
          PDF
        </a>{" "}
        ·{" "}
        <a className="underline underline-offset-2" href="/eval/eval-report.md" download>
          Markdown (for AI tools)
        </a>{" "}
        ·{" "}
        <a className="underline underline-offset-2" href="/eval/eval-results.csv" download>
          All results (CSV)
        </a>
      </p>
      <details className="max-w-3xl rounded-lg border bg-card p-4">
        <summary className="cursor-pointer font-medium">What the AI receives</summary>
        <div className="mt-3 space-y-3 text-sm">
          <p>
            The message, the sender's zone, the date and the team's cities. In a message of four or more sentences, only the sentences that mention
            a time, a place or a date, plus one on each side, leave your browser. The app adds no names and no calendars, and the AI never learns who
            is reading.
          </p>
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
    <section id="ask" className="dark scroll-mt-20 space-y-6 rounded-3xl border bg-background p-6 text-foreground sm:p-12">
      <h2 className="sr-only">The ask</h2>
      <p className="max-w-3xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
        A 90-day pilot with one cross-country team. We count late and weekend times caught before sending.
      </p>
      <Button asChild size="lg" className="h-auto min-h-12 whitespace-normal py-3">
        <Link to="/">
          The world clock tool works today <span aria-hidden>→</span>
        </Link>
      </Button>
    </section>
  );
}
