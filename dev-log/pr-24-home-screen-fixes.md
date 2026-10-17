# Home screen fixes: work week on cards, mobile schedule, no duplicate cities (#24, merged 2026-10-17)

The same session also shipped #23 (demo waits, rate-limit copy, visible Send button). It is covered briefly where it taught us something.

## Goal
- For distributed teams who use the home screen to check when colleagues can be reached. A card showed hours but not which days count as work (the Gulf works Sun–Thu). On phones the schedule columns drifted under their headers. Add city let you add the same city twice. 12-hour selects cut "AM" to "A".
- Also: make the app lighter and meet WCAG AA contrast (4.5:1) on status badges.

## What changed
- City cards show the working week, e.g. "Sun–Thu · 09:00–17:00", with 12-hour formatting when that setting is on.
- Schedule on phones: header, rows and the now line share one width (`--cols × 8rem`), so columns line up when you scroll sideways. Your own zone's header is tinted and tagged "You".
- Add city: cities you already have show as "Added" and can't be picked. Adding the same zone again does nothing. When the dialog closes, focus returns to the Add city button, including at the 8-city limit.
- The 12-hour hour selects now fit their text.
- Cards use 3 columns from 1280 px (`xl`).
- Saved settings are checked when the app loads. A bad working day or time falls back to the preset.
- Removed unused providers and toasters and uninstalled `@tanstack/react-query`.
- Badge colour tokens darkened or lightened until they pass contrast.
- Size: 16 files, +193 / −89.

## Decisions
- **3 columns from `xl`, not `lg` as first asked.** At 1024–1279 px, 12-hour times overflowed at three columns. Rejected: `lg:grid-cols-3`.
- **One shared width variable (`--cols`) for the schedule header and grid.** Rejected: separate widths, which had drifted apart.
- **`aria-disabled` instead of `disabled` on Add city at the limit.** A disabled button can't take focus back. Rejected: native `disabled`.
- **Dedupe in `addZone` as well as in the UI.** Any future caller is protected too. Rejected: a UI-only check.
- **"You" tag uses the existing `--working-badge` colour.** `text-primary` measured about 2:1. Rejected: `text-primary`.
- **#23, user decision:** sample-message buttons were removed and only a placeholder kept. The user felt they added friction ("we want them to write a message and let the AI check it").

## What went wrong
- **Codex review found real bugs in our first versions**, all fixed:
  - Column widths drifted in the schedule.
  - Card times shifted by an hour on a DST day. Hours were parsed in the local zone; they are now parsed in UTC.
  - Focus was lost at the city limit.
  - In #23, a late AI answer scrolled the page and Send was clipped at large text sizes.
- **Two tests broke under jsdom** with cmdk (the command-palette library): it needs `ResizeObserver`, and "Muscat" appears twice. Fixed with a stub and by taking the first match.
- **Contrast:** the first colour picked for the "You" tag failed contrast, so it was redone.
- **#23 was reworked twice on user feedback:** the sample buttons were removed, and the user said "I didn't get it myself" about the Send button, so it was made a filled, labelled button.
- **Codex ran into its rate limit** before the last round (the "You" highlight and the /code-review fixes). The local Codex review was skipped for that round and the review gate (a hook that blocks finishing without a recorded review) was marked by hand.

## Hardest part
- **Keeping the mobile schedule columns aligned.** The header and grid scroll together but were sized separately, so they drifted on narrow screens. The fix was one CSS variable for the column count, a min width of `cols × 8rem` on both, and equal-basis cells. We checked it in the browser: both 640 px wide at a 333 px viewport, with matching column edges.

## How AI was used
- **Claude Code (Opus)** planned the work, wrote the code and tests, ran the browser checks through the Orca browser, and wrote the commit and PR.
- **Codex** worked as an independent reviewer through Orca. It wrote REVIEW.md and Claude fixed the high and medium findings. It caught the DST, focus and column-drift bugs that Claude's own tests had missed.
- **`/code-review xhigh` (Claude)** reviewed the last round. The user said "fix all" and every finding was fixed.
- **Codex GitHub review** on the PR (commit 75ef20b): no findings.
- **Where a human corrected the AI:**
  - Product taste: rejected the sample buttons and found the Send button hard to spot.
  - Scope: asked for the "You" highlight.
  - The AI chose `xl` over the requested `lg` and said so in the PR.

## How we checked it
- Unit and component tests (vitest): 213 passed. New tests cover:
  - the work-week label
  - settings validation on load
  - duplicate add
  - "Added" items and focus return
  - a card on a DST day
- ESLint: 0 errors (8 old warnings). `tsc`: clean.
- Browser check: the schedule lines up at 333 px, and the work-week lines render.
- Contrast ratios were calculated for each changed colour token.
- Two independent AI reviews (Codex and /code-review), plus the Codex GitHub review.

## Numbers
- Tests: 213 pass.
- Main JS bundle: 475 → 391 kB (−18 %), 126 kB gzipped.
- Contrast:
  - Outside hours, light theme: 4.32 → 4.98
  - Reasonable hours, light theme: 4.49 → 4.92
  - Weekend, dark theme: 4.44 → 5.03
- AI cost and latency for this PR: unknown (no AI endpoint changed).

## Open issues and risks
- Not checked: Safari, a screen reader, or the 3-column layout at 1280 px and wider.
- The last round had only a Claude review; local Codex was rate limited, though the Codex GitHub review found nothing.
- The bundle could shrink further by lazy-loading cmdk. Not done.

## Jury questions this helps answer
- **How did you check the AI's work?** Every change ran through tests, a second AI (Codex) as reviewer and a browser check. Codex caught three real bugs (DST shift, lost focus, misaligned columns) that the first tests missed.
- **Is it accessible?** Status badges now pass WCAG AA (all ≥ 4.9:1), focus returns to Add city after the dialog, and limits use `aria-disabled`. We have not tested with a screen reader yet.
- **What did you drop?** Sample-message buttons in the demo: the user found them confusing. We kept one placeholder so visitors write their own message.
- **Does it work for Gulf work weeks?** Yes. Each city shows its own working days (e.g. Sun–Thu), and the schedule colours follow them.
- **How would it scale?** These are client-side changes: settings stay in the browser and are checked when the app loads, so more users add no server load. Scaling the AI time check is outside this PR.
