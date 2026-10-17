# Add Vercel Web Analytics and Speed Insights (#14, merged 2026-10-13)

This conversation shipped two PRs. #14 (this branch) is small. Most of the work was #13, "Rebuild the concept page as a short pitch for the BuildAI jury" (merged 2026-10-13, 37 files, +1331 / −1158).

## Goal
- **#13:** the `/concept` page felt like a tool with many buttons, and first-time visitors got lost. It had to become a story a busy, non-technical judge understands in 10 seconds and clicks through in a minute.
- **Real problem shown on the page:** when someone in a cross-country chat proposes a time, every reader opens a world clock and does the maths. Ooredoo works across 9 markets (UTC+1 to UTC+7) with Sunday–Thursday and Monday–Friday weeks.
- **#14:** see whether people actually visit the page and how fast it loads, through Vercel Web Analytics and Speed Insights.

## What changed
- **User-visible (#13):** 8 sections in order:
  1. Hero, with two buttons to sections 3 and 5.
  2. "Today": a static three-message chat that shows the pain.
  3. "When I write": a neutral email draft whose highlighted time opens a popup with every city's date, time and status word. Send shows a check with "Send anyway" and "Edit".
  4. "When I read": a chat with a "Viewing as" switch and "→ 16:00 your time". Arabic reads right to left.
  5. "Try your own message": one button and one AI call. The left side shows what the sender sees, the right side what colleagues read.
  6. "Why you can trust it".
  7. "Can Ooredoo build it?"
  8. "The ask": a 90-day pilot.
- **Removed:** the preset-card wall, the demo-clock switch, "What just happened", the Teams/Outlook frames section and the roadmap.
- **Code (#13):**
  - New `landing.ts` (popup rows and the worst-first headline), `TimesPopover`, `MomentWrite`, `MomentRead`, `ChatFrame`, `TryIt`, `PitchSections`.
  - Fixed demo cities (`DEMO_CITIES`), so the story's numbers never depend on the cities set on the main page.
  - 7 old components and the `useTimeDetection` hook deleted.
- **AI path (#13):**
  - The prompt reads hours written in words.
  - The local pre-filter lets them through and no longer uses a regex lookbehind.
  - `sanitize` decides "your time" in code.
  - The same-zone check compares offsets weekly across a year.
- **#14:** `@vercel/analytics` and `@vercel/speed-insights`, mounted once in `App.tsx` from their `/react` entry points.

## Decisions
- **Fixed five cities on the concept page** instead of the visitor's city list: the numbers in the story must not move. The visitor's "My time zone" only decides who "You" is; a home city outside the five joins section 5 as a sixth city.
- **One button in section 5** instead of "Check" and "Send" side by side. The owner asked why there were two. Two buttons confused the one-action-per-section rule, and one AI answer can fill both moments.
- **Warning box only for after hours or weekend** instead of always showing a box. The owner found a "Working hours for every city" box noisy. Late and early stay in the popup.
- **Prompt rule for hours in words, then a full eval** instead of quietly swapping the hint example to "3:30pm". This was the owner's choice, two days before the deadline; the eval was rerun afterwards.
- **`/react` imports for Vercel packages** instead of the `/next` snippet shown in the Vercel dashboard: the app is a Vite SPA.
- **Eval taken out of `npm test`:** it now runs only through `npm run eval`, because it costs money and needs the key.

## What went wrong
- **"half past three" was the example in our own no-time hint, but the local filter rejected it.** After the filter was widened, the model still read it in only 2 of 4 live calls. This led to the prompt rule and a new eval.
- **The trust claim "Median answer 1.7 s" came from the brief and had no measurement behind it.** The eval showed about 1.5 s, so the sentence was corrected.
- **Review rounds found real bugs:**
  - the send check covered the email on phones;
  - the page had two `h1` elements;
  - the "Sent as" time used the wrong zone;
  - stale cached results showed up after "My time zone" changed;
  - a Send click during a running Check was lost;
  - a tap did not close the popup;
  - London and Algiers were treated as one zone;
  - a regex lookbehind would crash `/concept` on Safari before 16.4.
- **Two privacy lines promised too much** and were reworded:
  - "not stored" (the provider may keep data up to 30 days for abuse monitoring);
  - "No names" (the message itself can contain a name).
- **The Codex review on the PR found a cache bug in section 5:** checking A, then B, then going back to A left B in the chat. It was fixed in a second commit on #13.
- **Tooling:**
  - The browser tab was hidden, so screenshots timed out. Layout was checked by measuring the DOM in an iframe instead.
  - A Windows heredoc mangled a backslash, so edit scripts were moved into files.
  - The worktree had no `.env.local` at first. The owner approved copying it from another worktree.

## Hardest part
- **Turning a feature demo into a one-minute story without losing the honest AI details.** Solved by splitting the page into "write" and "read" moments that reuse one popup and one headline function. The AI details went into a short "Why you can trust it" section with real eval numbers.
- **Making spelled-out times reliable.** Solved with a prompt rule, three new eval rows and three eval runs, plus a filter change and a Safari-safe regex.

## How AI was used
- **Claude Code (main session):**
  - planned with the owner;
  - wrote the shared foundation (fixed cities, examples, headline logic, popup) and the interfaces;
  - managed the work and ran the final checks and browser measurements.
- **Claude subagents:**
  - 3 builders in parallel: sections 3–4, section 5, and static sections plus the PRD update;
  - 3 separate reviewers, one per builder. They found about 30 issues, all fixed.
- **Claude `/code-review high`:** 10 findings, 5 of them real bugs, fixed.
- **Codex:**
  - 2 review files (`REVIEW.md`) with 4 + 2 medium findings, all fixed;
  - 1 automated PR review comment on #13, fixed.
- **App model:** `gpt-6-luna` (effort `none`) only extracts the time; luxon does the conversion.
- **Where a human corrected the AI:**
  - Asked why section 5 had two buttons, which led to the one-button flow.
  - Asked for headings and the "only you see this" note.
  - Removed a hero box Claude had added.
  - Narrowed the warning box to after hours and weekends.
  - Chose the prompt fix over the copy workaround.
  - Approved copying the env file.

## How we checked it
- **Unit and UI tests:** 132 at the start of the rebuild, 160 at the end. New tests cover:
  - the story numbers (Tunis 14:00, Muscat 17:00 late, Doha 16:00, New Delhi 18:30 late; Sunday weekend for Tunis, Prague, New Delhi);
  - popup tap and keyboard behaviour;
  - one AI call per message, the cache, and the zone edge cases.
- **Live eval, 3 runs on each prompt:**
  - old prompt: 25/27, 26/27, 26/27;
  - new prompt: 29/30 three times;
  - 0 critical errors (an unclear time shown as exact) in all six runs.
- **Layout measured in the browser:**
  - at 1366×768, sections 3, 4 and 5 were 397, 336 and up to 438 px, under a 560 px budget;
  - at 375 px, no sideways scroll.
- **Build check:** the system prompt is not in `dist/`.
- **Manual checks on the dev server:** live API calls such as "Thursday at 3pm", "half past three" → 15:30, "Meet at three" → 15:00.

## Numbers
- **Tests:** 160 passing; typecheck clean; lint 0 errors (8 old warnings).
- **Eval:** 29/30 ×3, 0 critical. The one repeated miss is "9pm IST" from a London sender, flagged as an unclear zone; that is a safe miss.
- **Latency:** median per eval run 2.3 s, 1.5 s, 1.5 s (max 3.2 s), with 30 parallel calls.
- **Cost:**
  - the PRD estimates about $0.10–0.34 per 1,000 messages and under $0.03 for three eval runs;
  - actual spend: unknown.
- **Bundle:** #14 adds about 1.5 KB gzip (150.9 → 152.5 KB).

## Open issues and risks
- **Not verified by eye in light and dark mode on real devices:** the browser tab was hidden, so only DOM measurements were taken.
- **Not confirmed here:** whether Vercel Analytics and Speed Insights are enabled in the dashboard and receiving data.
- **"IST" from a London-based team** is always flagged, not converted.
- **"Your time" warning (low finding, not fixed):** it checks the whole message, so "Your time matters. Meet at 3pm." shows a needless note.
- **The 30-row eval set is still small.** Production p50 and p95 from logs: unknown.

## Jury questions this helps answer
- **Does the AI do the time-zone maths?** No. It only reads the time and the zone from the sentence. Plain calendar code (luxon) converts it for each reader, so clock changes never depend on the model.
- **How do you know it does not guess wrong?** A 30-message English and Arabic eval passed 29/30 in three runs, with zero unclear times shown as exact. "3pm your time" in a group is flagged, not converted.
- **What did people correct in the AI's work?** The owner simplified the try-it flow to one button and trimmed or reworded UI copy. Independent AI reviewers (Claude and Codex) found about 45 issues; they were fixed before merge, with a test for each bug.
- **Is it ready for Teams and Outlook?** It is a working web concept, not an integration. The page states the limits: the check runs on the sender's action or on Send, and the pilot estimate (4–6 weeks) is our own.
- **What does it cost?** An estimated $0.10–0.34 per 1,000 messages, with one AI call per message. The examples on the page use no AI at all.
