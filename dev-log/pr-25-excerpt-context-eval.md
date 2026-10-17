# Keep a nearby zone, date or team city in the excerpt and publish the eval (#25, not merged: still open on 17 Oct 2026)

## Goal: what problem this change solved and for whom
- For long messages, the app sends only the sentences around a time to the AI (privacy). A time zone or date two sentences away ("The board meets on 27 Oct. … We start at 3pm.") was cut, so the AI could convert the time on the wrong day or in the wrong zone.
- The jury and visitors of /concept had no way to see the eval behind the "you can trust it" claims.

## What changed: user-visible changes first, then code
- /concept "Why you can trust it": "Tested on 93 English and Arabic messages in 3 runs: 84 to 89 right each run, and the AI never invented a time. Median answer 1.5 s." plus download links to the full eval report (PDF, Markdown for AI tools, CSV of all results) in `public/eval/`.
- "What the AI receives" and the note under the message box now say that only the sentences around the time leave the browser for a long message.
- `excerpt()` (`src/lib/timeHint.ts`) also keeps a sentence that names a team city, a time zone (GMT, UTC, "Doha time", توقيت), an English or Arabic month, or a date ("27 Oct", "Oct 27", "the 22nd", "22/10", "2026-10-27") if it is up to two sentences from a time. `timeDetect.ts` passes the team's city names.
- Eval test: 93 rows ported from another worktree's uncommitted work, plus 3 new long rows where the zone or date is two sentences from the time (96 rows, pass bar 87); each run writes a raw JSON log (git-ignored).
- README and PRD updated with the same numbers.

## Decisions: each with the reason and the alternative we rejected
- Copy the user's ready eval report files instead of regenerating them; user's call. Rejected: rerun the eval 3× and rebuild with the build script (the user said not to rerun).
- Context sentences only count within two sentences of a time, and only time sentences get neighbours. Reason: privacy, found in review. Rejected: first version, where any context sentence anywhere pulled in itself and both neighbours.
- Case-sensitive context, and a bare month must be a long name that is nothing else (October yes; Jan, May, March, June only next to a day number). Reason: "Jan" is a common Czech name, "May I…", "march on".
- Keep the old eval row text unchanged so it matches the published report, even though one row briefly stopped being cut (fixed later by the tighter rule).

## What went wrong: bugs, dead ends, things reverted or redone, and why
- A Python heredoc mangled regex backslashes (`\b` became a backspace byte); the regex block was rewritten through a file write.
- The first context rule made one existing long eval row go to the AI whole; the "every long row is cut" check was loosened, then restored after the review fix.
- The planned Codex review in the Orca workspace failed: Codex hit its usage limit. A Claude `/code-review high` run found 10 issues instead.
- The prompt for this retrospective says the PR is closed; per GitHub it is still open and not merged.

## Hardest part: and how we solved it
- Keeping more context without sending more private text. Solved by limiting context to two sentences from a time, word boundaries that work for accented names (Malé) and Arabic, and negative tests for look-alikes ("Next time", "Jan has the salary sheet", يمارس, "10/20/30").

## How AI was used: which tools and agents (Claude Code, Codex review, subagents…), what they did well, where a human had to correct them
- Claude Code (Opus 5.5) did the brainstorming, code, tests, copy, commit and PR.
- The human corrected the plan twice: the eval report files already existed (no need to build them), and the eval must not be rerun.
- Claude `/code-review high` (forked agent): 10 findings, 8 fixed (city boundary for accents, far context leaking, "Next time", Jan/May, Arabic boundaries, slash dates, early return, a stale comment).
- Codex on GitHub: 1 P2 finding (ISO dates not kept as context), fixed in b0f5a6e.
- Codex as the Orca reviewer: did not run (usage limit).

## How we checked it: tests, eval runs, reviews, manual checks, with numbers
- `npm test`: 212 tests passed; `npm run lint`: 0 errors (8 old warnings); `tsc --noEmit` clean.
- Offline eval checks: every long row fits 500 chars and is cut by `excerpt()`.
- Manual: /concept on the local dev server showed the new copy and three links; the three files returned HTTP 200 with the right content types.
- The live eval was NOT rerun after the excerpt change.

## Numbers: anything measurable (tests, eval scores, latency, cost)
- Eval of 17 Oct 2026 (before this change): 93 messages (72 short, 21 long; 79 English, 14 Arabic), 3 runs, 89 / 84 / 85 right, 0 critical errors in 279 calls, 9 timeouts at 12 s, median 1.5 s, p95 10.3 s, ~2,970 tokens in (97 % cached), ~58 out.
- Unit tests: 101 → 102 in `timeHint.test.ts`; 212 in total.
- Cost of this change's eval: none (not run).

## Open issues and risks
- The numbers on /concept were measured with the old `excerpt()`; the 3 new rows have never run.
- "24/7" still counts as a date; Arabic spellings of team cities (الدوحة) are not matched.
- The /concept copy says context sentences get "one on each side"; the code adds neighbours only around time sentences (the copy promises more than is sent, so it stays a safe upper bound).

## Jury questions this helps answer: 3 to 5 likely questions, each with a 1–2 sentence honest answer
- **Does the AI see my whole message?** Not for a message of four or more sentences: only sentences with a time, plus one on each side, and a zone, date or team-city sentence up to two sentences away leave the browser.
- **How do you know it works?** 93 English and Arabic messages, 3 runs on 17 Oct: 84 to 89 right per run and no invented times; the full report and every call are downloadable on /concept. That run predates this PR's excerpt change.
- **Did you just trust the AI's code?** No: two AI reviews (Claude and Codex) found 11 issues, 9 were fixed, each with a test; the human stopped an unneeded eval rerun.
- **What is the AI's job vs. the code's?** The AI only finds the time in the message; calendar maths does the conversion.
