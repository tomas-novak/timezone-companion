// English and Arabic only. Permissive on purpose: deciding what is really a time is the AI's job.
// غد must not follow an Arabic letter, so Baghdad (بغداد) stays out; Arabic weekdays need ال so September (سبتمبر) does not match.
// No lookbehind: Safari before 16.4 rejects it while parsing, which would break the whole page.
const WORD_HOUR = "one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve";
const D = String.raw`[0-9٠-٩۰-۹]`;

export const TIME_HINT = new RegExp([
  String.raw`${D}{1,2}\s?[:.]\s?${D}{2}`,
  String.raw`${D}{1,2}\s?[ap]\.?m\b`,
  String.raw`\b(?:at|by|around|from|until|till|before|after)\s+(?:${D}{1,2}(?!${D})|(?:${WORD_HOUR})\b)`,
  String.raw`\b(?:half past|quarter (?:past|to)|noon|midnight|midday|lunchtime|o['’]?clock|today|tonight|tomorrow|tmrw?|morning|afternoon|evening)\b`,
  String.raw`\b(?:mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)(?:day|nesday|sday|rsday|urday)?\b`,
  String.raw`ساع|صباح|مساء|ظهر|الليلة|اليوم|(?:^|[^؀-ۿ])غد|الغد|بكر[ةه]`,
  String.raw`الأحد|الاحد|الاثنين|الإثنين|الثلاثاء|الأربعاء|الاربعاء|الخميس|الجمعة|السبت`,
].join("|"), "i");

// A sentence ends at . ! ? ؟ (and closing quotes) before whitespace, or at a line break, and takes the whitespace after it,
// so "10.30" stays whole and a newline is never a sentence of its own. a.m./p.m. is one token unless a capital follows,
// so "10 a.m. tomorrow" stays one sentence but "10 a.m. Salary is private." is two.
// No i flag: with it \p{Lu} would match lowercase too
const SENTENCE = /(?:\b[aApP]\.[mM]\.(?!\s+\p{Lu})|[^])*?(?:[.!?؟]["'”’»)]*(?:\s+|$)|\n\s*|$)/gu;

// Only sentences with a hint and one on each side go to the AI, so it never reads the rest of a long message.
// Each run is a verbatim slice, so the texts the model returns are still substrings of the whole message.
export function excerpt(message: string): string {
  const spans = [...message.matchAll(SENTENCE)].map((m) => m[0]).filter((s) => s.trim());
  const hit = spans.map((s) => TIME_HINT.test(s));
  const keep = spans.map((_, i) => hit[i - 1] || hit[i] || hit[i + 1]);
  if (spans.length <= 3 || !hit.some(Boolean)) return message;
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
