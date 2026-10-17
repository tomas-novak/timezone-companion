# Home timezone from the browser instead of hardcoded Prague (#10, merged 2026-10-09)

## Goal
- Before: the schedule was always laid out in Prague time, hardcoded. That only works for people sitting in Prague.
- Who it is for: anyone using the app outside Prague (Doha, Tunis, Delhi…), and Prague users who travel.
- Success criteria:
  - The app detects your zone from the browser.
  - The schedule rows follow your hours.
  - Every city card shows its difference from you, e.g. "+2 h".
  - You can override the zone manually.

## What changed
- User-visible:
  - New "My timezone" picker in the header, next to 12h/24h. Options are Auto (browser zone), the 7 app cities, and the detected zone if it is not one of them.
  - An ⓘ button next to the picker opens a popover explaining what it does. It works on click and on tap.
  - Every clock card shows the offset from you (`+2 h`, `−1 h`, `+3:30 h`). Your own city is marked "You".
  - The Schedule View is laid out in your hours. The current-time bar lands on the right row, including DST days.
  - The schedule now scrolls to the current time when it opens and when you change zone. Before, it never did.
  - The footer lists all 7 cities. Before, it listed 5 hardcoded ones and missed Baghdad and New Delhi.
- Code:
  - New `homeTz: string | null` setting, where `null` means Auto. It is merged into the existing localStorage settings, so old saved settings keep working.
  - New helpers in `src/lib/timezones.ts`: `resolveHomeTz`, `formatOffsetDiff`, `getHomeDayHours`.
  - `ScheduleView` builds its rows from the real hours of the home day: 23, 24 or 25 of them.
  - The header controls wrap on narrow screens. Cards got `min-w-0` so they can shrink.
  - Size: 5 commits, 9 files, +233/−69.

## Decisions
- **Auto stored as `null` instead of saving the detected zone.** Auto keeps following the browser when you travel. Rejected: saving the detected zone once, which would leave you stuck on Prague after flying to Doha.
- **Picker offers the 7 app cities plus the detected zone.** This was the user's choice. Rejected: a list of all ~400 IANA zones with no search, and a picker with only Auto.
- **Schedule rows are real hours, and the current row is computed from elapsed time.** Rejected: indexing rows by the wall-clock hour, which puts the bar one row off on DST days.
- **Aliases mapped with a small explicit table** (`Asia/Calcutta` → `Asia/Kolkata`, plus three aliases of `Europe/London`). Rejected: relying on `Intl` canonicalization, which differs between browser engines.
  - Links to other places stay separate on purpose: Bratislava is not "Prague", Bahrain is not "Doha".
- **Picker placed in the header.**
  - First version: in Settings. The user found it out of place there, because Settings is all about individual cities.
  - Rejected: the footer, which the user suggested. Controls at the bottom of the page are hard to find.
  - Accepted: the header, where the other app-wide controls (12h/24h, dark mode) already are. The user had been considering the header as well.
- **Explanation in a popover with an ⓘ button.** Rejected: a native `title` tooltip, which never shows on touch devices.

## What went wrong
- **First schedule fix was incomplete (DST at midnight).** Codex review on GitHub found it: where DST starts at midnight (e.g. `Africa/Cairo` on 2026-04-24), the schedule had 24 rows for a 23-hour day. Fixed by snapping the end to the next day's own start of day.
- **Alias handling built twice.** The first version used `Intl` canonicalization. A review pointed out it is engine-dependent, and the tests depended on the machine's timezone. It was replaced by the explicit table, and the tests now mock the browser zone.
- **Hidden old bug.** Re-centering the schedule on the current time never worked, even before this PR. It measured the bar's `offsetTop` relative to its row, not to the scroll container. A review item about "recenter on zone change" exposed it.
- **Mobile overflow introduced twice.** First by the new header picker, then by the new offset label on the cards at 320 px. Both were found by measuring widths in the browser, not by eye.
- **UI wording redone twice.**
  - The help text went from text under the select, to a `title` tooltip, to an ⓘ popover.
  - The label went from "Home timezone" to "Home" to "My timezone". The user read "Home" as a home-page button.
- **Tooling hiccups:**
  - Stopping the dev server killed only the `npx` wrapper, which left an orphan Vite process on the port.
  - The Chrome renderer froze on one oversized batch of measurements and was retried in smaller steps.
  - Python-based edits turned CRLF line endings into LF; Git normalizes them on commit.

## Hardest part
- Getting the schedule right on DST days, in any zone, including zones where the clock jumps at midnight.
- Solved by:
  - generating the rows as real instants from the start of the home day to the next day's own start;
  - computing the current row from elapsed hours;
  - pinning the behaviour with unit tests: a normal day (24 rows), Prague spring and autumn (23 and 25 rows, with the skipped or repeated 02:00), and Cairo's midnight jump.

## How AI was used
- **Claude Code** (Claude Opus 5.5) did the design and implementation:
  - The superpowers "brainstorming" skill was used for a short in-chat design, which the user approved before any code was written.
  - The "ponytail" skill pushed for minimal diffs: native `<select>`, Luxon, which the project already used, and no new dependencies.
  - Tests were written first for the new helpers.
- **Claude in Chrome** (browser automation) was used for the manual checks: switching zones, reading card labels and schedule rows, and measuring widths with iframes.
- **Codex review on GitHub** (chatgpt-codex-connector) left 1 P2 finding, the DST-at-midnight bug. It was valid and fixed.
- **Local reviews written to `REVIEW.md`:** 2 rounds, 3 findings each, all fixed. Which tool wrote them is unknown from this conversation; it was likely a Codex worker started through Orca.
- **Where the human corrected the AI:**
  - which zones the picker offers;
  - moving the picker out of Settings;
  - the "Home" label being confusing;
  - the missing explanation once it was only a tooltip.
- **Where reviews corrected the AI:**
  - the midnight-DST case;
  - the engine-dependent alias handling;
  - the machine-dependent test;
  - the mobile overflow.

## How we checked it
- **Unit tests** (vitest): 14 passing at the end, up from 6 before the PR. The 8 new tests are in `src/lib/homeTz.test.ts`.
  - Each new test was written to fail first and then pass after the fix. This includes the Cairo case and the alias cases with a mocked browser zone.
- **Typecheck, lint and build** after every step:
  - `tsc --noEmit`, `npm run build`.
  - eslint on the touched files is clean. 2 errors remain in untouched shadcn `components/ui` files.
- **Manual checks in Chrome:**
  - Prague, Doha and New York as home: card offsets and schedule rows correct.
  - The bar stays centered after switching to Delhi, London and Auto.
  - No horizontal overflow at 320, 360, 390, 430 and 1280 px, including a long zone name.
- **Reviews:** 3 rounds (2 local, 1 on GitHub), 7 findings in total, all fixed. Nothing on GitHub was answered, per the user's instruction.
- **Not checked:** a DST transition day in a real browser; it is covered by unit tests only.

## Numbers
- Tests: 6 → 14.
- Review findings: 7, all fixed.
- Size: 5 commits, 9 files, +233/−69 lines.
- New dependencies: 0.
- Latency, cost and eval scores: not measured in this change (unknown).

## Open issues and risks
- **DST day not seen in a browser.** The day of a DST change was never checked in a real browser.
- **Manual alias table.** A new city added to `TIMEZONE_CONFIGS` that has a renamed IANA alias needs a manual entry in the table.
- **Unknown zones are basic.** A detected zone outside the app's cities gets no card and no "You" label, only offsets.
- **Taller mobile header.** On phones the header is now 3 rows (about 141 px), up from 2, because the clearer label and the ⓘ button take more room.
- **Unchecked platforms.** The behaviour on Safari or iOS was not checked (unknown).

## Jury questions this helps answer
- **How do you know the times are right around daylight saving changes?**
  - Schedule rows are real hours of your day, so a DST day has 23 or 25 rows.
  - Unit tests pin Prague spring and autumn and Cairo's midnight jump; the midnight case was caught by an AI code review.
- **How did you check the AI's work?**
  - Tests were written first for each piece of logic, and there were 3 independent review rounds (7 findings, all fixed).
  - Each change was clicked through in a real browser, with widths measured at 5 viewport sizes.
- **What did you try and drop?**
  - Settings and then the footer as homes for the picker, a hover-only tooltip, and alias handling that depended on the browser engine.
  - The user's feedback ("what does the Home button do?") drove the final label and the ⓘ popover.
- **Is it easy to use?**
  - It works with zero setup: the zone comes from the browser, and every card simply says "+2 h" or "You".
  - One picker in the header lets you pin a zone; the ⓘ explains it in one sentence.
- **How would it scale?**
  - It runs fully in the browser and stores settings in localStorage, so there is no server cost per user.
  - Adding a city is one config entry (plus an alias entry if one exists). Measured value for real users is unknown.
