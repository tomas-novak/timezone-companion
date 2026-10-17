# Copy pass for first-time jurors, test results box, bridge section (#26, merged 2026-10-17)

## Goal
- The jury is first-time and non-technical. The pitch page (`/concept`) and the tool (`/`) used insider words ("zone", "Reasonable hours", "Feature concept", "eval") that a juror would not understand.
- The goal was plain English, short sentences and consistent names. A juror should see the problem, the fix and the ask without help.

## What changed
- **Names everywhere:** "/" is "World clock", "/concept" is "AI demo", the badge reads "Ooredoo BuildAI Challenge entry". Status words are Working hours / Early / Late / After hours / Weekend. Copy says "city" instead of "zone".
- **AI demo page:**
  - Hero buttons moved up, under the AI paragraph. New facts line: 9 markets, Algiers to Jakarta, about 2 shared working hours, Monday to Thursday only.
  - "The problem today" has a caption that says the chat was re-enacted in Teams. On phones the chat is shown as text instead of an unreadable screenshot.
  - New bridge section "How we could fix it" between the problem and the demo.
  - New first example, "Friday 11am, from Prague". The send check shows "Weekend for 2 cities: Muscat, Doha".
  - Rewritten "Can Ooredoo build it?", trust and "What we ask for" copy, with a named pilot lead. No footer.
  - Test result downloads (PDF, CSV, Markdown) moved into a highlighted box with plain labels: "Check our test results yourself".
- **World clock:** cards say "2 h ahead of you" instead of GMT offsets. Badges say Early or Late instead of "Reasonable hours". The tab "Compare hours" has a one-line legend. Ramallah was added to the Ooredoo markets.
- **Code:**
  - `worstReader` replaces `firstReaderWithChip`, so "Read as" opens on the city the time hurts most.
  - `TeamsMessage` takes a name instead of a city object.
  - `formatOffsetDiff` returns a sentence.
  - The time chips the reader sees now use one neutral colour.
  - `docs/PRD.md` was kept in sync.

## Decisions
- **Caption "re-enacted", not "real":** the chat in the screenshot followed a prepared script, so calling it real would overstate. Rejected: "A real chat".
- **"Read as" opens on the worst status, not on the visitor's home city:** the demo should open on the problem. Rejected: keeping the home city or Doha as the default.
- **Reader chips in one neutral colour:** readers know their own hours, and colour alone carried a status nobody explained. Rejected: green / amber / grey chips.
- **Kept the user-dictated AI privacy note word for word** when it conflicted with a sentence from PR #25. The longer detail stays in "What the AI receives". Rejected: merging both into the note.
- **Kept the label "My time zone"** because it is a standard term for the picker. Rejected: renaming it to "My city".
- **Ramallah gets a Sunday–Thursday week** so the "9 markets" line holds. Its real work week is unverified.

## What went wrong
- **Branch out of date:** the eval download links from production were missing because PR #25 had merged to `main` after this branch started. We set our changes aside, fast-forwarded the branch to `main`, put the changes back and resolved conflicts in 3 files.
- **Branch renamed:** the Orca workspace renamed the branch automatically after an unrelated first message in the chat. It was renamed back before the commit.
- **Wrong claim drafted:** a first draft of the test box said answers were "checked by hand". The report shows they were compared automatically with the expected answers, so the text was corrected before review.
- **Layout bug:** a long download button label overflowed at 320 px (found by Codex review) and was fixed.
- **Flaky test:** one city-picker test hovered around its 5 s timeout because it renders about 400 time zones in jsdom. It got a 20 s limit.
- **Tooling hiccups:** shell heredocs broke on quotes, so the edit scripts were written to files. One PRD write failed half-way; we checked the file, it was intact, and we finished the edit. Twice the Codex worker's task sat unsent in its input box until it was submitted by hand.

## Hardest part
- Merging PR #25 into a large copy rewrite of the same sections without losing either side. We resolved each conflict by hand and kept the new copy plus PR #25's links, test numbers and privacy sentence. A separate Codex review checked that nothing from PR #25 was lost.

## How AI was used
- **Claude Code (Opus 5.5):** read the code and made all edits, tests and PRD updates. It also ran the merge, opened the PR and checked the result in the Orca browser.
- **Codex (GPT-6.1-Sol), as a read-only reviewer through Orca:** 4 local reviews and 1 GitHub review on the PR. It found stale PRD lines (low) and the button overflow (medium). It confirmed the merge kept PR #25 intact.
- **Human corrections:**
  - Decided "re-enacted" vs "real" and named the pilot lead.
  - Asked for the bridge heading.
  - Spotted that the eval links were missing compared with production.
  - Asked for a clearer test box and dictated its sentence.
- **Where the AI was wrong:** the "checked by hand" draft (caught by Claude before review), and stale PRD text (caught by Codex).

## How we checked it
- Unit and component tests after each round: 217, then 221 passing.
- 4 Codex reviews before the PR (findings: 2 low, then none, then 1 medium, then none), plus the Codex GitHub review on commit `cebe659` with no findings.
- An accessibility snapshot in the Orca browser confirmed the new headings, copy and links render on both pages.
- The Vercel preview deployment was "Ready".
- The page was not checked by eye at phone width.

## Numbers
- Tests: 221 passed in 15 files.
- Live AI test, from PR #25's report, shown on the page: 93 messages × 3 runs; 89, 84 and 85 of 93 right; 0 invented times in 279 calls; median answer 1.5 s; 9 of 279 calls timed out.
- Change size: 1 commit, 27 files.

## Open issues and risks
- Ramallah's Sunday–Thursday work week is unverified.
- Phone-width layout was not checked by eye.
- "Teams can show each reader the card's time in their own city" is still untested in a real tenant, as the page says.
- Cost per message is unknown for this PR. The earlier "$0.10–0.34 per 1,000 messages" line was replaced by PR #25's numbers.

## Jury questions this helps answer
- **Is the chat on the page real?** It was re-enacted in Teams on 16 Oct from a prepared script, and the page says so.
- **How do you know the AI is reliable?** 93 test messages, run 3 times: 84 to 89 right each run and never an invented time. The full report and every result can be downloaded from the page.
- **Does the AI do the time maths?** No. The AI only finds the time in the message; normal code converts it for each city. An unclear time is marked "time unclear" and not guessed.
- **How did you check the AI's code?** A second AI (Codex) reviewed every change read-only, all tests had to pass, and a human made the copy decisions.
- **How would it scale?** As a Teams app and Outlook add-in using Ooredoo's Azure OpenAI, pending IT approval. We estimate about 4–6 weeks for one or two developers to build the pilot.
