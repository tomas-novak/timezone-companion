# Show the send check at once on card 1 and add a scroll hint (#27, merged 2026-10-18)

## Goal
- The /concept pitch page showed the same "Before you send" check in two very different designs: card 1 (saved examples) hid it behind a Send button with Edit / Send anyway, card 3 (live AI) showed it as an amber box under the message. The owner found this confusing for a juror.
- Card 1's text cannot be edited, so making the juror click Send there was a wasted click.
- The juror must grasp two ideas quickly: the sender is warned when a colleague is off hours, and each reader sees the time in their own city.

## What changed
- Card 1 now shows the same check as the live demo, at once on load. No Send / Edit / Send anyway. Switching the example updates it.
- The check box shows for every converted time: amber for Early, Late, After hours or Weekend, neutral for "Working hours for every city". Before, the live demo hid a Late-only result.
- A fixed round down-arrow on /concept with a ring that fills as you scroll. A click scrolls 80% of the screen below the sticky header. It hides at the end of the page.
- The Thursday 3pm example is now sent from Tunis instead of Prague, so it lands as Prague 16:00, Muscat 18:00 Late, Doha 17:00 Late, New Delhi 19:30 After hours.
- Code: the live demo's result block became a shared `SendCheck` component used by both cards; `ScrollHint` in `src/pages/Concept.tsx`; PRD kept in sync.

## Decisions
- One shared component for both cards, so the designs cannot drift apart again. Rejected: restyling card 1 by hand.
- Variant A ("copy card 3") chosen by the owner from three browser mockups. Rejected: B (sender and reader views side by side) and C (unsent draft in a composer).
- No button to jump to the next section; the overlapping-card scroll is the part the owner likes, so a scroll hint instead.
- Arrow with a progress ring, not a "mouse wheel" icon: a mouse icon means nothing on a phone and does not read as a button.
- Left vs centred text in the cards: discussed, left as it is (owner's call).

## What went wrong
- The status rule was too narrow: a Late-only result showed no warning at all, so card 1's main example would have shown nothing. Found by a failing test, then aligned with the PRD rule.
- Pulling the newly merged main mid-work: main had renamed "Working" to "Working hours" (silently making every check amber) and removed the page footer the arrow keyed on (it would never hide). Neither was a git conflict; both found by reading the merged code.
- The progress ring first rendered as a 16 px circle in a corner (a button style overrode its size). Found by Codex review in a real page.
- First attempt at announcing the new check to screen readers wrapped the whole card in `role="status"`, which would read the entire window. Codex flagged it; replaced with a short hidden headline announced only after a switch.
- New Codex workers twice stalled on a "Hooks need review" prompt before reading the task; fell back to `codex exec` in read-only mode.

## Hardest part
- Making the arrow behave on a page of sticky, overlapping cards: they have no normal scroll position, so "go to the next card" was replaced by a fixed step, and "hide at the end" had to survive fast jumps, subpixel heights, layout changes and keyboard focus.

## How AI was used
- Claude Code (Opus) planned with the owner (brainstorming skill, browser mockups), wrote the code and tests, merged main and resolved conflicts.
- Codex as an independent reviewer after every change (6 review rounds): found the ring sizing bug, reduced-motion scrolling, focus loss, a stale PRD and the oversized live region.
- A Claude Code `/code-review xhigh` pass found 15 items; the owner picked 5 to fix.
- Human corrections: the owner chose the design variant, asked for the arrow to stay until the page end, picked Tunis as sender, and chose which review findings to fix.

## How we checked it
- Unit tests: 220 → 224 passing, including a new `ScrollHint.test.tsx` and a test that card 1 shows the check without a click.
- TypeScript and ESLint on changed files.
- Manual checks in the Orca browser: accessibility snapshot showing the check, the "saved answer" line, the "From … to the … team" line and the arrow; a screenshot of the Compare hours legend.
- Codex reviews and one `/code-review xhigh`.

## Numbers
- 3 commits, 224 tests passing at merge.
- Live AI latency, cost and eval scores: not measured in this change (unknown).

## Open issues and risks
- Arrow behaviour not checked on a real phone; it may cover the bottom of a pinned card there.
- The arrow bounces without a pause (WCAG 2.2.2), noted by review, not fixed.
- Card 1 may be taller than the space under the header at 768–1023 px wide (not measured).
- No test guards the neutral "Working hours for every city" box.
- The re-enacted "problem today" chat still tells a Prague-based story, so its numbers differ from the Tunis example.

## Jury questions this helps answer
- **Does the sender have to do anything to see the warning?** No. On the saved examples it shows at once; in the live demo one button reads the message with AI and shows the same check.
- **How do you know the AI-built code is right?** Every change ran through unit tests and an independent Codex review; reviews caught real bugs (a mis-sized ring, focus loss, a status rename after a merge) that tests alone missed.
- **What did you try and drop?** Two other layouts for the check, a "Send anyway" jump to the next section, and a whole-card screen-reader announcement.
- **Is it accessible?** Partly checked: keyboard focus is handed over when the arrow hides, reduced-motion is respected, and switches are announced; not tested with a real screen reader or phone.
