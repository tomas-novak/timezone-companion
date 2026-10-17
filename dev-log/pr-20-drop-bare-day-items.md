# Drop bare days and greetings the model returns as times (#20, merged 2026-10-16)

## Goal
- A real production test message ("Good morning, … Let's check it tomorrow. My suggestion is to have it at 11 am or 3 pm.") returned the two correct times plus an extra vague "tomorrow" card marked "time unclear".
- For readers in other offices: a fake "time unclear" item is noise next to real times and makes the tool look unreliable.

## What changed
- User-visible: a bare day ("tomorrow", "on Friday", "غدًا", "يوم الخميس", "بكرة") or a greeting ("Good morning", "Morning team!", "Have a good evening", "صباح الخير") no longer shows as a time. Real parts of day ("tomorrow morning", "Thursday PM", "after dinner", "بكرة الصبح", "tonight") still do.
- Code: `sanitize` in `src/lib/extraction.ts` drops an item whose whole text is a bare day or a greeting, whatever `kind` the model chose. Arabic diacritics are stripped before the check. The 10-item cap now applies after dropping, not before.
- Prompt and PRD: `vague` is now "part of day" instead of "part of day or deadline".
- Eval: a new row with the production message (expects 11:00 and 15:00 the next day).

## Decisions
- Denylist (bare day and greeting) rather than an allowlist of parts of day. The first fix was an allowlist. Review showed it dropped valid items (AM/PM, meals, colloquial Arabic) and let substrings like "fortnight" through. No allowlist is ever complete.
- Rule in code, not just in the prompt: mechanical rules belong in `sanitize`, because the model does not follow them every time.
- Filter regardless of `kind`: the model can also return a bare "tomorrow" as `ambiguous`.
- Also fix the prompt's root cause ("or deadline" let the model read "check it tomorrow" as vague), not just filter the output.

## What went wrong
- First fix (PART_OF_DAY allowlist, never merged): a local `/code-review` at xhigh effort found 9 issues, including the regressions above. We redid the fix as a denylist.
- Local Codex review of the redo: an Arabic comma after a bare day ("غدًا،") slipped through. Fixed.
- GitHub Codex review (P2): greetings the prompt itself names ("Morning team!", "Have a good evening") were not filtered. Fixed in 82a7e27. Its local re-review caught that the first version also dropped the valid "morning all week". Fixed by requiring the greeting to end the text.
- Tooling: the shell layer turned `\u` escapes into raw characters, so writing a regex took several tries. We switched to `\p{Mn}`.
- Git: the new branch first tracked `origin/main`. Nothing was pushed there; we fixed the upstream.

## Hardest part
- Telling "a day only" apart from "a vague time" in two languages without a complete dictionary. Solution: list the small closed set that is never a time (days, greetings) and let everything else through.

## How AI was used
- Claude Code (Opus): analysis of the production log, the fix, tests, eval runs, git/PR.
- Claude `/code-review` (xhigh): found that the first approach was wrong. Claude then proposed the redesign and the human approved it before work started.
- Codex (local reviewer worker via Orca): one medium finding per round, fixed by Claude.
- Codex GitHub review: one valid P2 finding.
- Human: tested in production, chose the redesign, asked for each commit and PR.
- Correction needed: Claude's first fix was too narrow. Review, not Claude, caught it.

## How we checked it
- Unit tests: 182/182 (cases from every review finding added as tests).
- Live eval, 3 runs after the redesign: 48/49, 47/49, 48/49, 0 critical, long messages 16/16, 15/16, 16/16 (bar: 45/49).
- First (dropped) version for comparison: 48/49, 47/49, 47/49.
- Live eval was not rerun after the last greeting change (code only, prompt unchanged).
- Dev server preview: page renders. The change is logic only and not visible there.

## Numbers
- Production call that showed the bug: 3164 ms total, 2259 ms model, 3088 input tokens, 0 cached, cold start.
- Eval median latency over the 3 runs: 3358, 1829, 1677 ms.
- Cost: unknown.

## Open issues and risks
- Other greetings ("Evening all", "Hi, good morning") still pass.
- A date without a time ("on the 16th") still shows.
- One eval row keeps failing ("9pm IST" left zone-unclear). It failed before this change too.
- Not decided: whether "Thursday" said on a Thursday means today or next week.

## Jury questions this helps answer
- How do you stop the AI from inventing times? Code checks every answer after the model: text must be in the message, times and dates must be valid, and bare days and greetings are dropped.
- How do you know a prompt change didn't make things worse? A live eval of 49 messages, run 3 times per change, with a 45/49 bar and zero critical errors allowed.
- Did the AI write it all? Mostly. A human tested in production, approved the redesign, and decided each merge. Two AI reviewers caught bugs the coding agent missed.
- What did you get wrong? The first fix used an allowlist and would have hidden real times. Review caught it before merge, and we redid it.
- Does it work in Arabic? Yes for the cases tested, including diacritics and the Arabic comma. Colloquial forms are covered only as far as our test list goes.
