# Stack the three demo sections on /concept as sticky scroll cards (#15, merged 2026-10-14)

## Goal: what problem this change solved and for whom
- For the BuildAI jury and pilot readers of `/concept`. The three demo sections ("Before you send, see how your time lands", "Every reader sees their own time", "Try your own message") read as one long scroll. The goal was to turn them into a guided sequence of cards, modelled on the sticky stacked cards at etihadbureau.ae.
- Constraints: keep the hero and the colours, and don't redesign the rest of the site.
- Measurable user value of this change: unknown. There was no usability test or analytics comparison.

## What changed: user-visible changes first, then code
- On tall-enough screens (≥768px wide, ≥47.5em high), each card pins under the header. The next card slides over it, and the covered card shrinks to 95% and darkens slightly.
- Content inside each card is always stacked vertically: text, then the message window. It sits in a centred 48rem column with centred heading, description and example switch.
- Each card has a slightly different teal tint.
- The "Before you send" heading in TryIt now sits above its box, like the other sections.
- The reader's time chip is coloured by their working status (working / late / after hours / weekend), without naming the status. Before, it was always green, even outside working hours.
- The time popover closes on scroll, so it no longer floats over an incoming card. A popover opened by hover no longer hands focus back to the time when it closes.
- Keyboard focus that lands in a covered card scrolls that card back into view.
- Dev setup: `orca.yaml` (setup runs `npm ci` and creates `.env.local` from `.env.example`), a Dev server tab with a port derived from the worktree name (8100–8899), and `.worktreeinclude` for `.env.local`.
- Code: CSS `position: sticky` plus scroll-driven animations (`view-timeline`, `timeline-scope`, `animation-range`) in `src/index.css`. Small JS in `Concept.tsx` (`revealCoveredCard`) and `TimesPopover.tsx`. The diff is +267 / −43 lines across 14 files in 3 commits.

## Decisions: each with the reason and the alternative we rejected
- **Animation in CSS rather than a JS scroll library.** It runs off the main thread and adds no dependency, and it sits behind `@supports` and `prefers-reduced-motion`. Rejected: a JS scroll listener or library.
- **"Stack + slight shrink"**, chosen by the human from the options offered. Rejected: a plain stack without the shrink.
- **Pin only when the card fits the window.** A pinned card taller than the viewport would hide its bottom forever. Rejected: always pinning.
- **Breakpoint lowered from 1024px to 768px after measuring.** The header wraps to two lines below about 860px, so the pin offset is 8.5rem between 768 and 1023px and 6rem above.
- **Equal card heights** (min-height + `align-content: start`). Otherwise a taller card peeks out under a shorter one. Rejected: `grid-auto-rows: 1fr`, which made content jump.
- **Opaque tint** (a gradient over the card colour). Cards slide over each other, so a transparent tint would show the card underneath.
- **Codex P2 fix:** scroll back to a covered card on keyboard focus. Rejected: our first fix, which raised the focused card with z-index while `:focus-visible` matched. Codex showed that it stays on top after the user switches to wheel scrolling.
- **Port from a hash of the worktree name in a Node script.** On Windows, Orca runs setup through `.cmd` and the tabs run in PowerShell, so Node behaves the same everywhere. Plain `npm run dev` stays on 8080. Rejected: writing PORT into `.env.local`, or changing `vite.config.ts`.

## What went wrong: bugs, dead ends, things reverted or redone, and why
- The first preview looked at port 8080, which was another worktree's dev server, so we were reviewing the wrong code. We moved to 8081.
- The recede animation started too early, and the `animation-range` offsets were redone.
- A shorter card let the card under it peek out, which is why the heights were made equal.
- After a hover, the popover's close returned focus as `:focus-visible`. The card then stayed raised over incoming cards (reported by the human with a screenshot).
- The popover itself overlaid incoming cards (also reported by the human).
- Prettier reformatted all of `TryIt.tsx`. The file was rebuilt from HEAD with targeted edits.
- The first hover test passed even without the fix, because Radix returns focus in a timeout. We added `vi.runAllTimers()` and checked that the test fails without the fix.
- The z-index approach was reverted after the Codex review (see Decisions).
- The `orca-per-workspace-env` skill turned out to cover cloud/VM recipes, not local setup. `orca.yaml` was written from Orca's own `orca-yaml.mdx` docs instead.
- Low-memory kills of the dev server and tests happened during the session. They were reported, not auto-restarted.

## Hardest part: and how we solved it
- Making sticky stacking work with focus and popovers. The Radix popover is portalled above everything, and focus can land in a card that another card covers. We solved it by closing the popover on scroll and not returning focus after hover. We scroll the covered card back into view instead of raising its z-index, and we covered each case with a test that fails without the fix.

## How AI was used: which tools and agents (Claude Code, Codex review, subagents…), what they did well, where a human had to correct them
- **Claude Code** (Opus): design options, CSS/TS implementation, tests, browser checks through Chrome automation, commits and the PR. Superpowers brainstorming and the ponytail (minimal-diff) skill were active.
- **A local code review run, with findings in `REVIEW.md`:** all high, medium and low items were fixed. The exact reviewer and finding counts are unknown.
- **Codex GitHub review bot:** one P2 finding on `src/index.css`, accepted and fixed in `506f531`.
- **Where the human corrected the AI:**
  - layout: always vertical, centred content, a different tint per card
  - popover bugs found by hand while scrolling (two screenshots)
  - the green chip outside working hours
  - inconsistent heading placement
  - asking why pinning only worked from 1024px, which led to the lower breakpoint

## How we checked it: tests, eval runs, reviews, manual checks, with numbers
- vitest: 163/163 passing on the last run. `tsc` passed and lint was clean on the new script.
- New tests:
  - the popup closes on scroll
  - a hover popup does not return focus
  - the reader chip colour without the status word (Doha working, New Delhi 18:30 late)
- Mutation check: both popover tests fail without their fix.
- Manual checks in Chrome at 1440px (light and dark), at 800px, and in a 390px iframe.
- Orca dev script: started on port 8138 in this worktree and returned HTTP 200. The ports computed for the 6 checkout names were all different.
- No LLM eval run in this PR (it changed no parsing logic).

## Numbers: anything measurable (tests, eval scores, latency, cost)
- 3 commits, 14 files, +267 / −43 lines.
- 163 tests passing.
- 1 Codex P2 finding, fixed.
- Breakpoint lowered from 1024px to 768px.
- Latency or cost impact: none measured, unknown.

## Open issues and risks
- Firefox is untested. Scroll-driven animations need `timeline-scope`. Without it, the cards still pin but don't shrink.
- Short or narrow screens get no pinning, by design.
- `.worktreeinclude` copies `.env.local` from the primary checkout, which had no `.env.local` at that time. Until one is created there, new worktrees get the empty template from `.env.example`.
- The Codex review comment was not replied to or resolved on GitHub. Whether that happened later is unknown.

## Jury questions this helps answer: 3 to 5 likely questions, each with a 1–2 sentence honest answer
- **How did you check the AI's work?** With tests that we confirmed fail without each fix, a written review (`REVIEW.md`) plus the Codex PR bot, and manual checks in the browser at three widths. The human found several bugs by hand that the tests didn't cover yet.
- **What did you try and drop?** Raising the focused card's z-index. Codex showed that it covers later cards after the user switches to the scroll wheel, so we replaced it with scrolling the covered card back into view.
- **Is it accessible?** Motion respects `prefers-reduced-motion`, keyboard focus never stays hidden under another card, and the popover still works by tap and keyboard. No screen-reader audit was run.
- **Does it work everywhere?** It works in Chrome, which we tested, at 1440, 800 and 390px. Firefox is untested, and on small screens the cards don't pin.
- **How would it scale?** It is CSS-only for the stacking and has no new dependency, so it costs nothing per user. Adding more cards needs one more `view-timeline` name each.
