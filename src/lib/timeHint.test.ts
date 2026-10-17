import { describe, expect, it } from "vitest";
import { TIME_HINT, excerpt } from "./timeHint";
import { EXAMPLES, UNCLEAR_EXAMPLE } from "./demoPresets";

const POSITIVE = [
  "Call at half past three",
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
  "Meet at three",
  "Can you call by eleven?",
  "نلتقي غدًا",
  "Call at 1500 GST",
  "Cutover 0930hrs",
  "Ops review ١٥٠٠ GST",
  "Can you do 4 Doha time?",
  "Ready by 9 New Delhi time",
  "Let's say ten thirty",
  "Sync at eleven-fifteen",
  "Cutover 1500 ET",
  "Cutover 1500Z",
  "Can you do four Doha time?",
  "Can you do 4 Ho Chi Minh City time?",
  "Sync ten ten",
  "Sync ten oh five",
  "Sync two forty-five",
  "نلتقي العصر",
  "نتكلم الصبح",
  "بعد المغرب",
  "على ثلاث ونص",
  "الساعة اربع وربع",
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
  "Do it at once",
  // End-of-day deadlines are left as written
  "send it by EOD",
  // English and Arabic only: French and durations stop at the filter
  "On se voit demain à 10h ?",
  "Réunion jeudi à 15h30 heure de Prague",
  "Dispo entre 14h et 16h heure de Tunis",
  "Build takes about 2h on CI",
  "We sold 1500 units",
  "Invoice 1500 QAR",
  "Ticket 21500 UTC",
  "ten people joined",
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
  "Can we meet at half past three?",
  "Call at quarter to ten tomorrow",
  "Let's sync at three o'clock Doha time",
];

describe("TIME_HINT", () => {
  it.each(POSITIVE)("matches %s", (s) => expect(TIME_HINT.test(s)).toBe(true));
  it.each(NEGATIVE)("does not match %s", (s) => expect(TIME_HINT.test(s)).toBe(false));
  it.each(EVAL_MESSAGES)("matches eval message %s", (s) => expect(TIME_HINT.test(s)).toBe(true));
  it.each([...EXAMPLES, UNCLEAR_EXAMPLE].map((p) => p.text))("matches example %s", (s) => expect(TIME_HINT.test(s)).toBe(true));

  it("uses no lookbehind, which Safari before 16.4 cannot parse", () => {
    expect(TIME_HINT.source).not.toMatch(/\(\?<[=!]/);
  });

  it("leaves small talk alone", () => {
    expect(TIME_HINT.test("thanks, looks good")).toBe(false);
  });
});

describe("excerpt", () => {
  const LONG = "Hi team. The client loved the deck. I'm in Dubai this week. Can we sync Thursday at 3pm? Budget is fine. Legal still has questions. Ping me later.";

  it("keeps the time sentence and one on each side, verbatim", () => {
    expect(excerpt(LONG)).toBe("I'm in Dubai this week. Can we sync Thursday at 3pm? Budget is fine.");
  });

  it("joins runs that are apart with a marker the model cannot copy across", () => {
    const out = excerpt("Call at 9am. A. B. C. D. E. Then lunch at noon.");
    expect(out).toBe("Call at 9am. A.\n…\nE. Then lunch at noon.");
    for (const run of out.split("\n…\n")) expect("Call at 9am. A. B. C. D. E. Then lunch at noon.").toContain(run);
  });

  it("does not split inside 10.30, a.m. or Arabic", () => {
    expect(excerpt("One. Two. Three. Meet at 10.30 a.m. tomorrow. Four. Five.")).toBe("Three. Meet at 10.30 a.m. tomorrow. Four.");
    expect(excerpt("مرحبا. شكرا. تمام. الاجتماع الساعة ٣؟ نعم. لا.")).toBe("تمام. الاجتماع الساعة ٣؟ نعم.");
  });

  it("keeps a sentence whose only time is in words", () => {
    expect(excerpt("One. Two. Sync ten oh five. Three. Four.")).toBe("Two. Sync ten oh five. Three.");
  });

  it("splits on line breaks", () => {
    expect(excerpt("a\nb\nc\nstandup 9:30\nd\ne")).toBe("c\nstandup 9:30\nd");
  });

  it("never counts a line break as the neighbouring sentence", () => {
    expect(excerpt("One. Two. Meet at 10:30.\nDoha time for this call. End.")).toBe("Two. Meet at 10:30.\nDoha time for this call.");
    expect(excerpt("One. Two. Meet at 10:30.\r\n\r\nDoha time for this call.\r\nEnd.")).toBe("Two. Meet at 10:30.\r\n\r\nDoha time for this call.");
  });

  it("does not end a sentence at a.m. or p.m.", () => {
    expect(excerpt("One. Two. Meet at 10 a.m. sharp. Doha time for this call. End.")).toBe("Two. Meet at 10 a.m. sharp. Doha time for this call.");
    expect(excerpt("One. Two. Call at 4 P.M. today. London time. End.")).toBe("Two. Call at 4 P.M. today. London time.");
  });

  it("ends a sentence at a.m. or p.m. when a new sentence starts after it", () => {
    expect(excerpt("Intro. Meet at 10 a.m. Salary is private. Another secret.")).toBe("Intro. Meet at 10 a.m. Salary is private.");
    expect(excerpt("One. Two. Three. Call at 4 p.m. My salary is private. Another secret. End.")).toBe("Three. Call at 4 p.m. My salary is private.");
  });

  it("ends a sentence after a closing quote, so the next one stays out", () => {
    expect(excerpt('One. Two. Meet at 9am. He said "fine." Private salary details. End.')).toBe('Two. Meet at 9am. He said "fine."');
    expect(excerpt("One. Two. Meet at 9am. He said “fine.” Private salary details. End.")).toBe("Two. Meet at 9am. He said “fine.”");
  });

  it("keeps a distant lunchtime the prompt supports", () => {
    expect(excerpt("Meet at 9am. Notes follow. Budget approved. Legal is fine. Let us meet for lunchtime. Bring snacks. Thanks.")).toBe(
      "Meet at 9am. Notes follow.\n…\nLegal is fine. Let us meet for lunchtime. Bring snacks.",
    );
  });

  it("sends short messages and hint-less ones whole", () => {
    expect(excerpt("Hi. Call at 3pm? Thanks.")).toBe("Hi. Call at 3pm? Thanks.");
    expect(excerpt("a. b. c. d. e.")).toBe("a. b. c. d. e.");
  });
});
