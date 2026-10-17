// English and Arabic only. Permissive on purpose: deciding what is really a time is the AI's job.
// غد must not follow an Arabic letter, so Baghdad (بغداد) stays out; Arabic weekdays need ال so September (سبتمبر) does not match.
// No lookbehind: Safari before 16.4 rejects it while parsing, which would break the whole page.
const WORD_HOUR = "one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve";
const D = String.raw`[0-9٠-٩۰-۹]`;
const NAMED_ZONE = "GST|AST|IST|GMT|UTC|BST|CET|CEST|EET|EEST|MSK|PKT|WIB|EST|EDT|CST|CDT|PST|PDT|ET|PT";
const ZONE = `${NAMED_ZONE}|Z|hrs?`;
const DIGIT_WORD = "one|two|three|four|five|six|seven|eight|nine";

export const TIME_HINT = new RegExp([
  String.raw`${D}{1,2}\s?[:.]\s?${D}{2}`,
  String.raw`${D}{1,2}\s?[ap]\.?m\b`,
  String.raw`(?:^|[^0-9٠-٩۰-۹])${D}{4}\s?(?:${ZONE})\b`,
  String.raw`(?:${D}{1,2}|\b(?:${WORD_HOUR}))\s+(?:[a-z]+\s+){1,4}time\b`,
  String.raw`\b(?:${WORD_HOUR})[\s-](?:ten|fifteen|oh[\s-](?:${DIGIT_WORD})|(?:twenty|thirty|forty|fifty)(?:[\s-](?:${DIGIT_WORD}))?)\b`,
  String.raw`\b(?:at|by|around|from|until|till|before|after)\s+(?:${D}{1,2}(?!${D})|(?:${WORD_HOUR})\b)`,
  String.raw`\b(?:half past|quarter (?:past|to)|noon|midnight|midday|lunchtime|o['’]?clock|today|tonight|tomorrow|tmrw?|morning|afternoon|evening)\b`,
  String.raw`\b(?:mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)(?:day|nesday|sday|rsday|urday)?\b`,
  String.raw`ساع|صباح|الصبح|ظهر|عصر|مساء|المغرب|ونص|وربع|الليلة|اليوم|(?:^|[^؀-ۿ])غد|الغد|بكر[ةه]`,
  String.raw`الأحد|الاحد|الاثنين|الإثنين|الثلاثاء|الأربعاء|الاربعاء|الخميس|الجمعة|السبت`,
].join("|"), "i");

// A sentence ends at . ! ? ؟ (and closing quotes) before whitespace, or at a line break, and takes the whitespace after it,
// so "10.30" stays whole and a newline is never a sentence of its own. a.m./p.m. is one token unless a capital follows,
// so "10 a.m. tomorrow" stays one sentence but "10 a.m. Salary is private." is two.
// No i flag: with it \p{Lu} would match lowercase too
const SENTENCE = /(?:\b[aApP]\.[mM]\.(?!\s+\p{Lu})|[^])*?(?:[.!?؟]["'”’»)]*(?:\s+|$)|\n\s*|$)/gu;

// A zone, a month or a date the time sentence may lean on. Case-sensitive, so "we may" and "march on" stay out;
// Jan, May, March and June are names or words too, so a bare month counts only as a long name that is nothing else.
// آب (August) is left out: two letters are too likely inside other words.
const MONTH = "Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|June?|July?|Aug(?:ust)?|Sept?(?:ember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?";
const AR_MONTH = "يناير|فبراير|مارس|أبريل|ابريل|مايو|يونيو|يوليو|أغسطس|اغسطس|سبتمبر|أكتوبر|اكتوبر|نوفمبر|ديسمبر|كانون|شباط|آذار|نيسان|أيار|حزيران|تموز|أيلول|تشرين";
const CONTEXT = new RegExp([
  String.raw`\b(?:${NAMED_ZONE})\b`,
  String.raw`\b(?!(?:Next|This|That|Every|Each|Last|Any|Some|First|Same|Free|Spare|Lunch|Dinner|Our|Your|My|The|No|Good|Long|Short|Full|Part|Half|Over)\b)\p{Lu}\p{Ll}+ time\b`,
  String.raw`\b(?:January|February|April|July|September|October|November|December)\b`,
  String.raw`${D}{1,2}(?:st|nd|rd|th)?\s(?:${MONTH})\b`,
  String.raw`\b(?:${MONTH})\.?\s${D}{1,2}(?![0-9٠-٩۰-۹])`,
  String.raw`${D}{1,2}(?:st|nd|rd|th)\b`,
  String.raw`(?:^|[^0-9٠-٩۰-۹/])${D}{1,2}/${D}{1,2}(?![0-9٠-٩۰-۹/])`,
  String.raw`${D}{4}-${D}{2}-${D}{2}`,
  "توقيت",
  `(?:^|[^؀-ۿ])[وبل]?(?:${AR_MONTH})(?![؀-ۿ])`,
].join("|"), "u");

// Sentences with a hint and one on each side go to the AI, plus a context sentence (zone, date, team city) up to two
// sentences from a hint, so it never reads the rest of a long message. A message without a hint goes whole.
// Each run is a verbatim slice, so the texts the model returns are still substrings of the whole message.
export function excerpt(message: string, cities: string[] = []): string {
  const spans = [...message.matchAll(SENTENCE)].map((m) => m[0]).filter((s) => s.trim());
  const hit = spans.map((s) => TIME_HINT.test(s));
  if (spans.length <= 3 || !hit.some(Boolean)) return message;
  // \b is ASCII-only, so it would never close a city like Malé
  const city = cities.length ? new RegExp(String.raw`(?:^|[^\p{L}])(?:${cities.map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(?![\p{L}])`, "iu") : null;
  const hitWithin = (i: number, d: number) => hit.slice(Math.max(0, i - d), i + d + 1).some(Boolean);
  const keep = spans.map((s, i) => hitWithin(i, 1) || (hitWithin(i, 2) && (CONTEXT.test(s) || !!city?.test(s))));
  const runs: string[] = [];
  let run = "";
  spans.forEach((s, i) => {
    if (keep[i]) run += s;
    else if (run) {
      runs.push(run.trim());
      run = "";
    }
  });
  if (run) runs.push(run.trim());
  return runs.join("\n…\n");
}
