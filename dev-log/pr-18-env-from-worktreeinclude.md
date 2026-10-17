# Take .env.local from the main checkout, not .env.example (#18, merged 2026-10-15)

This session also produced PR #17 "Fix AI timeouts in production and stack /concept cards on phones" (merged 2026-10-15). Both are covered here.

## Goal
- Production "Try your own message" on /concept showed the AI failure message although nobody had touched the Vercel credentials. Visitors (and the jury) could not try the AI demo reliably.
- On phones the three demo cards on /concept never stacked as sticky cards; each simply filled the screen.
- Enter in the message box did nothing visible; only the button ran the check.
- New Orca worktrees started with an empty API key, so the AI could not be tested locally without a manual fix.

## What changed
User-visible (PR #17):
- The AI gets more time: server waits 12 s (was 6 s), browser 15 s (was 8 s).
- A timeout now says "Timeout: the AI took too long to answer." Other failures keep "The AI didn't answer."
- Enter runs the check; Shift+Enter adds a new line; Enter during IME composition is ignored.
- On phones the cards stack: a card pins once its bottom edge reaches the screen bottom, so a tall card is read in full before the next covers it. Desktop unchanged.
- Keyboard focus moving back into a covered card keeps the focused control on screen.

Code:
- `api/parse-time.ts`: OpenAI client timeout 12000 ms; `APIConnectionTimeoutError` returns 504 instead of 502; log field `timeout` vs `network`.
- `src/lib/timeDetect.ts`: new `ParseTimeTimeout`; abort or 504 maps to it, including an abort while the body is read.
- `src/pages/Concept.tsx` + `src/index.css`: a `ResizeObserver` writes `--h` per card and `--header-h`; a phone-only media query sets `position: sticky` with `top: min(header + 0.5rem, 100svh - card height - 1rem)`.
- `docs/PRD.md` updated for the new timeouts, the 504 and the client code.
- PR #18: removed the `.env.example` -> `.env.local` copy from the `orca.yaml` setup; `.worktreeinclude` (already on main) copies `.env.local` from the main checkout. README line updated.

## Decisions
- Raise timeouts rather than add a retry: a retry after a timeout would double the wait. Rejected: 1 retry.
- Distinct 504 for timeouts so the client can name the cause. Rejected: keep a single 502.
- Pin cards by their bottom edge on phones. Rejected: shrinking cards to fit the screen (content would not fit on small phones) and keeping stacking off (user asked for it on phones).
- No shrink/dim animation of covered cards on phones; kept desktop-only to keep the change small.
- Enter submits, Shift+Enter newline, like chat apps, since the section imitates a chat.
- API key lives in the main checkout's git-ignored `.env.local`. Rejected for now: a Windows user environment variable (keeps the key out of OneDrive sync, but makes the project less self-contained). The user chose the file.

## What went wrong
- First assumption risk: the user suspected credentials. Production logs showed two calls ending at 6006 ms and 6036 ms with `network_or_timeout`; the key was fine.
- Vercel Hobby keeps runtime logs only ~1 hour; a 3-day query failed, a 50-minute window worked.
- First probe of the production API returned 400 because `teamZones` was sent as an array instead of an object.
- The phone stacking first used the header height (190 px) as the pin offset. The header is not sticky on phones, so cards pinned 190 px too low. Fixed by using the header height only when it is sticky.
- Orca browser device emulation did not change the viewport, then the Orca runtime dropped the connection. Switched to a phone-sized iframe probe, then to headless Chromium via Playwright in a temp folder.
- The first Playwright run hung on `networkidle` (Vite keeps a socket open); a bash heredoc broke Windows backslash paths. Both fixed and rerun.
- The Codex review spec sat unsent in its composer and needed an Enter; a duplicate orchestration run was created by mistake.
- An unused test helper was left in a test and removed before commit.

## Hardest part
- Sticky cards that are taller than a phone screen: CSS alone cannot read an element's own height. Solved with a small `ResizeObserver` feeding heights to CSS variables, then measured scroll positions at 390x844, 375x667 and 1440x900 to confirm no card bottom stays hidden and desktop is unchanged.

## How AI was used
- Claude Code (Opus 5.5) did the investigation, code, tests, PRD updates, commits and PRs.
- Vercel MCP: listed the project and read production runtime logs that pinpointed the 6 s timeouts.
- Codex CLI (GPT-6.1-Sol, effort medium) as an independent reviewer via Orca orchestration, writing findings only.
  - Review 1 found 3 medium + 1 low issues, each reproduced in a browser: focus off screen at 320x568, page crash without `ResizeObserver`, timeout during body read shown as a generic error, stale PRD code. All fixed.
  - Review 2 (Enter key) found 1 low: the test did not guard IME or newline prevention. Test tightened.
- Human decisions: approved each design before coding, chose to keep the timeout longer but name it in the UI, asked for stacking on phones, chose to put the key in the main checkout, and asked for the setup change in #18.
- Where the AI needed correcting: the 190 px header assumption (caught by its own measurement); the user steered the error copy toward naming the timeout.

## How we checked it
- Unit/component tests: 166 -> 167 -> 168 passing (13 files). New tests: server 504, client timeout (abort, 504, abort during body read), timeout copy, Enter / Shift+Enter / IME.
- Lint: 0 errors (8 warnings in untouched files).
- Live checks: production API probe after the logs; local `/api/parse-time` returned 200 after the key was added.
- Headless Chromium scroll measurements at three viewports; Shift+Tab focus visible at 320x568 with reduced motion on and off.
- Not checked: real phones, Safari, a fresh worktree after PR #18.

## Numbers
- Failing production calls: 6006 ms and 6036 ms (old 6 s server timeout). Probe at the same time: 2216 ms, 2847 input / 66 output tokens.
- Earlier eval median latency (from PRD, not rerun here): 1.5-2.3 s, max 3.2 s.
- Card heights at 390x844: 676 / 583 / 524 px; all now pin fully on screen. At 375x667 they pin by the bottom edge.
- Cost: unknown.

## Open issues and risks
- During an OpenAI outage users now wait up to 12-15 s before seeing the error.
- The cause of the slow calls on 15 Oct (OpenAI-side latency or cold start) is unknown.
- Stacking not tested on real devices or Safari.
- The API key now syncs through OneDrive with the main checkout; older worktrees still lack it.

## Jury questions this helps answer
- How do you know the AI is reliable? We check it with tests, a live eval set and production logs; here logs showed timeouts, not wrong answers, so we raised the limit and made the timeout visible to users.
- What happens when the AI fails? The message still sends and the examples keep working; the user sees whether it was a timeout or another failure and can retry.
- How did you check the AI's own coding work? A second model (Codex) reviewed every change independently and found real bugs, which were fixed and covered by tests before merge.
- Does it work on mobile? The demo page was adjusted and measured on phone-sized screens in a headless browser; real-device testing is still open.
- What was hardest? Making tall cards stack on small screens without hiding content, solved with measured card heights and bottom-edge pinning.
