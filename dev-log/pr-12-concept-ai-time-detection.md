# Add the Feature concept page with AI time detection for chat messages (#12, merged 2026-10-12)

## Goal
- Problem: in a team spread across time zones, a chat message like "call at 3pm?" means a different time for each reader. Today readers convert it in their head or with a separate tool, and can get it wrong. How often that happens and what it costs is unknown: we did not measure it.
- For whom: distributed teams that chat across cities, for example Prague, Doha, Dubai, London and Kolkata.
- This PR adds a `/concept` page ("Feature concept") that shows the idea. The sender types a message, an AI finds the times in it, and each reader sees them in their own city's time.

## What changed
- User-visible:
  - A new `/concept` page with a chat demo and a "Try it" section in 3 steps.
  - 6 preset messages that work offline, without an API key.
  - Custom messages go to the AI only on Send. The call is skipped unless a cheap text filter (English and Arabic) finds a likely time.
  - Readers see time chips in their own zone, with a status: working hours, outside working hours, or late night/weekend.
  - Unclear times appear as a dashed "time unclear" chip and are never shown as an exact time.
  - The sender gets a preview of how each reader will see the message.
  - While typing "your time" in a team with more than one other zone, an amber note asks the sender to name a city instead.
  - "EOD/EOB/COB" is not treated as a time and gets no chip.
- Code:
  - A Vercel function `api/parse-time.ts`: OpenAI Responses API with a strict JSON schema, `store: false`, a 6 s timeout, no retries, and checks on input size and origin.
  - `sanitize`: a trust boundary that overrides the model on mechanical rules.
  - luxon conversion that handles clock changes.
  - A Vite dev middleware, so `/api` runs locally without the Vercel CLI.
  - A reasoning-effort setting through an environment variable (default `none`).
  - A live eval of 27 messages.
  - Lovable references removed. README and PRD rewritten.
- Size: 5 commits, 45 files, +3300 / −586.

## Decisions
- **Mechanical rules live in code, not in the prompt.** Example: "your time" means the reader's zone only when the team has exactly one other zone. The prompt version failed in 50–85% of repeated calls. Rejected: more prompt tuning.
- **One AI call per Send.** A regex pre-filter runs first. Rejected: calling on every keystroke, which costs more, is slower, and sends drafts.
- **Offline presets with recorded model answers.** The demo works without network or a key, and the UI tests are deterministic. Rejected: a live call for every demo.
- **Show unclear times as unclear.** A missing chip is better than a wrong one. A "critical" eval error means an unclear time shown as exact, and must be 0. Rejected: best-guess conversion.
- **"next Thursday" means the Thursday of next week** (22 Oct when today is Mon 12 Oct). This was the product owner's call. Rejected: the nearest upcoming Thursday.
- **EOD is not converted.** Deadlines like EOD are not hour-precise, so readers see plain "EOD". Rejected: converting it to 17:00 in the sender's zone.
- **The PRD is the single source.** The system prompt is generated from the PRD, so the code and the spec cannot drift apart.
- **Model `gpt-6-luna` with reasoning effort `none`.** Rejected: higher effort. It was not tested, so its gain is unknown.

## What went wrong
- **Prompt whack-a-mole.**
  - Fixing one eval row broke another.
  - The first "keep the message text unbroken" rule made the model give Wednesday the Baghdad zone, which was worse than before. The rule was reworded.
- **We blamed the model for our own code.** The "Wed 11am or Thu?" row failed because the model returned text that was not one unbroken piece of the message, and `sanitize` then dropped the item. We spent several prompt edits before finding this.
- **A green single run hid a flaky rule.** "Your time" passed once by luck. Sending the same message 20× showed it wrong 50–85% of the time, so the rule moved into code.
- **The UX was hard to follow.** The product owner found the "Try it" section hard to understand even though they knew how it should work. It was redesigned into 3 guided steps and limited to English and Arabic, after the code was already written.
- **Review rounds kept finding new edge cases.**
  - Ranges across a clock change.
  - Ranges over midnight.
  - The chip hidden when two zones share an offset today.
  - Items marked "exact" that still carried an "unclear" flag.
- **Tooling problems.**
  - Bash heredocs on Windows turned `\b` in a regex into a backspace byte.
  - Line endings are mixed (CRLF/LF).
  - A test timed out under parallel load. Its timeout was raised from 5 s to 30 s.
  - The eval cannot read `.env.local`, so the key has to be in the shell.

## Hardest part
- Time semantics:
  - Clock-change gaps and overlaps.
  - A range whose end crosses a clock change in only one zone.
  - Rating a range by its worst moment.
  - Deciding when to hide the chip because the reader's zone has the same offset.
- Solution: the status of a range is checked at its start, its end, and every working-hours, reasonable-hours and midnight boundary inside it. The chip hides only when both ends have the same offset in both zones. Each case has a test.
- Who decides what: the model finds where a time is and what hour it says. Code decides zones, flags and conversion. That split came from failures, not from up-front design.

## How AI was used
- **Claude Code** (one long session):
  - Implemented phases 1 and 2 from the PRD.
  - Ran and analyzed the evals and measured latency.
  - Fixed the review findings.
  - Wrote the README.
  - It did well on test-backed fixes and on root-cause probes, such as the repeated-call experiment.
- **Codex:**
  - Reviewed the PR on GitHub and raised 3 P2 findings. Two were fixed (flags vs kind, range-end offsets). One, message authors when the home zone changes, was deferred as low.
  - Wrote `REVIEW.md` reviews locally. All high and medium items were fixed.
- **`/code-review` in Claude Code:** several rounds.
- **OpenAI `gpt-6-luna`:** the runtime model that finds the times.
- **Where the human corrected the AI:**
  - Product rules: "next Thursday", EOD, and the IST row.
  - The UX was not understandable for the jury.
  - The AI's first prompt fix made one case worse.
  - The AI reported "3 runs passed" when that pass was luck.

## How we checked it
- Unit and component tests: 13 test files, 137 passing (plus the eval, skipped by default).
- Live eval: 27 messages. The bar is ≥24/27 correct with 0 critical. About 26 runs in total.
- Repeated-call probe: 20 calls per case for the "your time" behavior.
- Reviews: Codex on GitHub, 3× `REVIEW.md`, several `/code-review` rounds.
- Manual: the dev server in a browser, and the Vercel preview deployment, which the product owner tested and confirmed working.

## Numbers
- Eval:
  - First run: 23/27 with 1 critical.
  - Final runs: 25–26/27, 0 critical.
  - The IST row fails every time (accepted). "next Thursday" sometimes comes back as "day unclear", which is safe.
- Latency over 54 sequential calls: average 1.8 s, min 0.84 s, p50 1.7 s, p95 3.2 s, max 3.4 s. Average 57 output tokens per call.
- Roughly 600 model calls during development. Exact cost: unknown. A dedicated OpenAI project with a spend limit was used.
- Tests: 137 passing.

## Open issues and risks
- **IST is wrong in every eval run.** "IST" can mean India or Israel, and the model picks one.
- **Deferred low findings:**
  - `endLocalTime` on "exact" items.
  - The same-offset check looks only at today and +182 days.
  - Message authors when the home zone changes.
  - 7 older lint warnings.
- **Model behavior can drift.** The eval runs only on demand, not in CI.
- **Abuse and cost.** These depend on a Vercel Firewall rate limit (20/min per IP) and the OpenAI spend limit. Whether the firewall rule is actually set: unknown.
- **Not done from the definition of done:** performance and accessibility audits (Lighthouse, axe, keyboard, screen reader).

## Jury questions this helps answer
- **How do you know the AI is right?** A 27-message eval with a "no unclear time shown as exact" rule, run about 26 times. It ends at 25–26/27 with 0 critical, and code enforces the mechanical rules whatever the model says.
- **What was hardest?** Time edge cases (clock changes inside ranges, midnight, shared offsets) and deciding what the model may decide. We moved every rule that can be an `if` into code.
- **Is it fast and cheap enough?** About 1.8 s average per message. One call happens only on Send, and only when a filter sees a likely time. Exact cost per message: unknown, at about 57 output tokens per call.
- **How would it scale?** The function is stateless with no database, and presets and the filter avoid most calls. Cost grows linearly with messages that contain a time, so it is capped by the spend limit and the rate limit. Real chat integration is not built yet.
- **What did you try and drop?** Fixing "your time" in the prompt (it failed 50–85% of the time, so it moved to code), converting EOD (dropped as not useful), and a denser "Try it" layout (replaced by 3 guided steps).
