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
    expect(excerpt("One. Two. Meet at 10:30.\nBring the notes. End.")).toBe("Two. Meet at 10:30.\nBring the notes.");
    expect(excerpt("One. Two. Meet at 10:30.\r\n\r\nBring the notes.\r\nEnd.")).toBe("Two. Meet at 10:30.\r\n\r\nBring the notes.");
  });

  it("does not end a sentence at a.m. or p.m.", () => {
    expect(excerpt("One. Two. Meet at 10 a.m. sharp. Bring the notes. End.")).toBe("Two. Meet at 10 a.m. sharp. Bring the notes.");
    expect(excerpt("One. Two. Call at 4 P.M. today. Bring snacks. End.")).toBe("Two. Call at 4 P.M. today. Bring snacks.");
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
    expect(excerpt("a. b. Due 27 Oct in UTC. c. d.", ["Doha"])).toBe("a. b. Due 27 Oct in UTC. c. d.");
  });

  it("keeps a zone, a date or a month two sentences from the time, without its far neighbour", () => {
    expect(excerpt("A. All times are Doha time. B. Kickoff at 10am. C. D. E.")).toBe("All times are Doha time. B. Kickoff at 10am. C.");
    expect(excerpt("A. Use GMT here. B. Kickoff at 10am. C. D. E.")).toBe("Use GMT here. B. Kickoff at 10am. C.");
    expect(excerpt("A. The board meets on 27 Oct. B. We start at 3pm. C. D. E.")).toBe("The board meets on 27 Oct. B. We start at 3pm. C.");
    expect(excerpt("A. Board day is Oct 27. B. We start at 3pm. C. D. E.")).toBe("Board day is Oct 27. B. We start at 3pm. C.");
    expect(excerpt("A. The offsite is in October. B. We start at 3pm. C. D. E.")).toBe("The offsite is in October. B. We start at 3pm. C.");
    expect(excerpt("A. We moved it to the 22nd. B. Dinner at 7pm. C. D. E.")).toBe("We moved it to the 22nd. B. Dinner at 7pm. C.");
    expect(excerpt("A. Due 22/10. B. Dinner at 7pm. C. D. E.")).toBe("Due 22/10. B. Dinner at 7pm. C.");
    expect(excerpt("A. The meeting date is 2026-10-27. B. Call at 3pm. C. D. E.")).toBe("The meeting date is 2026-10-27. B. Call at 3pm. C.");
    expect(excerpt("أ. الموعد في أكتوبر. ب. نلتقي الساعة ٣. ج. د. هـ.")).toBe("الموعد في أكتوبر. ب. نلتقي الساعة ٣. ج.");
  });

  it("drops context more than two sentences from any time", () => {
    expect(excerpt("Call at 3pm. B. C. D. E. F. Use GMT here. G. H.")).toBe("Call at 3pm. B.");
  });

  it("keeps a sentence that names a team city, accents included", () => {
    const msg = "A. Ahmed is in Muscat. B. Call at 3pm. C. D. E.";
    expect(excerpt(msg, ["Prague", "Muscat"])).toBe("Ahmed is in Muscat. B. Call at 3pm. C.");
    expect(excerpt(msg)).toBe("B. Call at 3pm. C.");
    expect(excerpt("A. Ahmed is in Malé. B. Call at 3pm. C. D. E.", ["Malé"])).toBe("Ahmed is in Malé. B. Call at 3pm. C.");
    expect(excerpt("A. Muscatel is nice. B. Call at 3pm. C. D. E.", ["Muscat"])).toBe("B. Call at 3pm. C.");
  });

  it("does not take words that only look like a month, zone or date for context", () => {
    for (const s of ["We may march on.", "See you next time.", "Next time, bring notes.", "Jan has the salary sheet.", "May I share the HR case.", "Split it 10/20/30.", "Every time it fails."])
      expect(excerpt(`A. ${s} B. Call at 3pm. C. D. E.`)).toBe("B. Call at 3pm. C.");
    expect(excerpt("أ. هو يمارس الرياضة. ب. نلتقي الساعة ٣. ج. د. هـ.")).toBe("ب. نلتقي الساعة ٣. ج.");
  });
});
