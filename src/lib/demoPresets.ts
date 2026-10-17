import fixtures from "./demoFixtures.json";
import { createZone, type Zone } from "./storage";
import { canonicalTz, resolveHomeTz } from "./timezones";
import { sanitize } from "./extraction";
import { teamZonesFor, toExpressions, type TimeExpression } from "./timeDetect";

export const DEMO_NOW = "2026-10-17T08:00:00.000Z";

// The concept page never reads the cities on the main page, so the story's numbers never move
export const DEMO_CITIES: Zone[] = ["Africa/Tunis", "Europe/Prague", "Asia/Muscat", "Asia/Qatar", "Asia/Kolkata"].map((tz) => createZone(tz, tz));

export interface Example {
  id: keyof typeof fixtures;
  label: string;
  subject: string;
  author: Zone;
  text: string;
  expressions: TimeExpression[];
}

const city = (tz: string) => DEMO_CITIES.find((z) => z.tz === tz)!;

function example(id: Example["id"], label: string, subject: string, author: Zone, text: string): Example {
  const exprs = sanitize(fixtures[id], text, author.tz, teamZonesFor(DEMO_CITIES)) ?? [];
  return { id, label, subject, author, text, expressions: toExpressions(exprs, text, DEMO_NOW) };
}

export const EXAMPLES: Example[] = [
  example("exact", "Thursday 3pm, from Prague", "Meeting", city("Europe/Prague"), "Can we meet Thursday at 3pm?"),
  example("arabic", "Sunday 10am, in Arabic, from Doha", "Review", city("Asia/Qatar"), "هل نعقد المراجعة يوم الأحد الساعة ١٠ صباحًا؟"),
];

export const UNCLEAR_EXAMPLE = example("unclear", "Unclear", "Call", city("Europe/Prague"), "3pm your time?");

// "You" is one of the five cities, or a sixth one that only the try-it section adds
export function youFor(homeTz: string | null): { you: Zone; cities: Zone[]; inDemo: boolean } {
  const home = canonicalTz(resolveHomeTz(homeTz));
  const found = DEMO_CITIES.find((z) => canonicalTz(z.tz) === home);
  if (found) return { you: found, cities: DEMO_CITIES, inDemo: true };
  const you = createZone(home, "you");
  return { you, cities: [...DEMO_CITIES, you], inDemo: false };
}
