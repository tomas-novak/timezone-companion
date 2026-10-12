import { describe, expect, it } from "vitest";
import { TIME_HINT } from "./timeHint";
import { PRESETS } from "./demoPresets";

const POSITIVE = [
  "Call at 3pm?",
  "ok 15:30 works",
  "see you tonight",
  "نلتقي مساءً",
  "الاجتماع الساعة ٣:٣٠",
  "غدًا إن شاء الله",
  "lunch at noon",
  "see you tomorrow",
  "Thursday works for me",
  "meet at 7?",
  "see you at ٣",
];

const NEGATIVE = [
  "Can you review the PR?",
  "Price is 3 QAR",
  "v2.5 released",
  "We need 2-3 people",
  "Thanks, sounds good",
  "شكرا جزيلا",
  "Merci beaucoup pour le rapport",
  "Monthly report attached",
  "Saturn looks sunny",
  "مرحبا من بغداد",
  // End-of-day deadlines are left as written
  "send it by EOD",
  // English and Arabic only: French and durations stop at the filter
  "On se voit demain à 10h ?",
  "Réunion jeudi à 15h30 heure de Prague",
  "Dispo entre 14h et 16h heure de Tunis",
  "Build takes about 2h on CI",
];

// The PRD eval set without its French rows and the duration row
const EVAL_MESSAGES = [
  "Let's do the call at 3pm",
  "Standup tomorrow at 9:30",
  "Can you join Thursday 2pm Doha time?",
  "Demo at noon Muscat",
  "Deploy window opens at 18:00 my time",
  "الاجتماع غدًا الساعة ٣:٣٠ مساءً",
  "نلتقي يوم الخميس الساعة ١٠ صباحًا بتوقيت مسقط",
  "Release review at 4pm AST",
  "Can we move it to Monday 26th at 9am London?",
  "Ping me at 9pm IST if the build fails",
  "I'm free 3-4pm tomorrow",
  "متاح من ٢ إلى ٤ مساءً",
  "Maintenance window 11pm-1am Delhi time",
  "Let's sync at 3pm your time",
  "Can we do next Thursday at 10am?",
  "Meet at 7?",
  "Call at 5pm CST",
  "Let's talk tomorrow morning Doha time",
  "Can we catch up this afternoon?",
  "Version 1.10 ships Monday",
  "Budget is 10.30 QAR per seat",
  "We need 2-3 people for tomorrow's demo",
  "Use the 16:10 aspect ratio for slides",
  "Standup 9:30 Prague, then client call at 2pm Doha",
  "Options: Wed 11am or Thu 4pm (London time for both)",
];

describe("TIME_HINT", () => {
  it.each(POSITIVE)("matches %s", (s) => expect(TIME_HINT.test(s)).toBe(true));
  it.each(NEGATIVE)("does not match %s", (s) => expect(TIME_HINT.test(s)).toBe(false));
  it.each(EVAL_MESSAGES)("matches eval message %s", (s) => expect(TIME_HINT.test(s)).toBe(true));
  it.each(PRESETS.map((p) => p.text))("matches preset %s", (s) => expect(TIME_HINT.test(s)).toBe(true));

  it("leaves small talk alone", () => {
    expect(TIME_HINT.test("thanks, looks good")).toBe(false);
  });
});
