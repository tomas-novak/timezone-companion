// English and Arabic only. Permissive on purpose: deciding what is really a time is the AI's job.
// غد must not follow an Arabic letter, so Baghdad (بغداد) stays out; Arabic weekdays need ال so September (سبتمبر) does not match.
// No lookbehind: Safari before 16.4 rejects it while parsing, which would break the whole page.
const WORD_HOUR = "one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve";
const D = String.raw`[0-9٠-٩۰-۹]`;

export const TIME_HINT = new RegExp([
  String.raw`${D}{1,2}\s?[:.]\s?${D}{2}`,
  String.raw`${D}{1,2}\s?[ap]\.?m\b`,
  String.raw`\b(?:at|by|around|from|until|till|before|after)\s+(?:${D}{1,2}(?!${D})|(?:${WORD_HOUR})\b)`,
  String.raw`\b(?:half past|quarter (?:past|to)|noon|midnight|midday|o['’]?clock|today|tonight|tomorrow|tmrw?|morning|afternoon|evening)\b`,
  String.raw`\b(?:mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)(?:day|nesday|sday|rsday|urday)?\b`,
  String.raw`ساع|صباح|مساء|ظهر|الليلة|اليوم|(?:^|[^؀-ۿ])غد|الغد|بكر[ةه]`,
  String.raw`الأحد|الاحد|الاثنين|الإثنين|الثلاثاء|الأربعاء|الاربعاء|الخميس|الجمعة|السبت`,
].join("|"), "i");
