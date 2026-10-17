# Restyle the site to the walletii UX/UI guide (#16, merged 2026-10-15)

## Goal
- Give the clock tool (`/`) and the jury pitch (`/concept`) one visual system taken from a supplied UX/UI brand guide, ahead of the BuildAI submission (deadline moved to 20 Oct 2026).
- For: the BuildAI jury reading `/concept`, and everyday users of the world clock on `/`.
- Hard constraint from the owner: keep the big overlapping sticky scroll cards on `/concept`.

## What changed
- User-visible:
  - Cyan/navy palette, Outfit headings + Rubik body text, pill-shaped buttons and tabs.
  - `/concept`: navy hero with a "Built for Ooredoo BuildAI" label, navy "Ask" band and footer.
  - The three sticky cards got distinct colours: cyan tint (Write), purple tint (Read), navy (Try it).
  - Light mode stays the default; the dark mode toggle was kept, with a dark variant built from the same tokens.
  - "Skip to main content" link and a visible 3px focus ring.
- Code: 17 files, +136/−118.
  - Most of it is shadcn CSS variables in `src/index.css` plus Tailwind tokens.
  - Components were restyled; logic is unchanged.
  - The sticky-card CSS and `revealCoveredCard` were left untouched.
- Infra, in a separate commit: `orca.yaml` opens a Codex "Review" tab in every Orca worktree.

## Decisions
- **Visual system only, own product name.** No walletii or Ooredoo logos. Rejected: copying the brand identity wholesale.
- **`/` keeps its layout and gets new visuals only.** Rejected: redesigning the tool's structure this close to the deadline.
- **Dark sections reuse the dark tokens** through a scoped `.dark` class on a section. Rejected: hand-picked one-off colours per section.
- **Card colours live on each component.** Rejected: the original positional `nth-child` background rules, which first review flagged as fragile.
- **Google Fonts stay remote.** Rejected: self-hosting the fonts. Codex flagged the privacy/availability trade-off as low severity, and it was consciously accepted.

## What went wrong
- The first `/code-review` found 9 issues, all fixed. The main ones:
  - The active clock card's shadow overrode its focus ring.
  - The Ask button overflowed on mobile.
  - The hover colour was indistinguishable from the default.
  - The Rubik 700 weight was not loaded.
  - The skip link had no scroll margin.
  - The pill radius broke wrapped toggle labels.
  - The footer lost its border in dark mode.
  - Plus positional `nth-child` CSS and leftover dead tokens.
- The first Codex review run never finished. Codex hit its usage limit and its terminal disappeared, so the review was restarted.
- Twice the review task sat unsent in the Codex input box (`outcome_unknown` / `turn_unobserved`), and it had to be submitted by hand.
- One process slip: the follow-up card-colour change initially skipped the agreed Codex review. The owner caught it, the review was run, and it found a real contrast bug. A Stop hook now blocks finishing while uncommitted changes are unreviewed.
- Screenshots from the Orca browser came back blank after programmatic scrolling. Sticky behaviour was verified through DOM measurements instead.

## Hardest part
- Keeping the sticky cards readable while they animate. The scroll animation darkens a card with `brightness()` as the next card covers it.
- Codex calculated that grey body text on the new light-purple card dropped to 4.49:1 at 0.96 brightness, just under WCAG AA (4.5:1).
- Fix: lighten the purple token. Measured in the browser afterwards: 4.95:1 normally and 4.82:1 while dimmed.

## How AI was used
- **Claude Code (Opus):** brainstorming, approved section by section, then the implementation, fixes, commits, the PR and preview checks via the Orca browser.
- **`/code-review` (Claude):** the first review pass, 9 findings fixed.
- **Codex (orchestrated via Orca):** independent reviews that only write `REVIEW.md`. Two runs completed: the full PR and the colour tweak.
- **Codex GitHub connector:** an automatic review of the PR when it was opened. Its summary comment shows the review completed; no inline findings are visible on the PR.
- **Where the human corrected the AI:**
  - Scope: keep the cards; no logo.
  - Asking for more distinct card colours.
  - Catching the skipped review.
  - Catching that replies had drifted into English.

## How we checked it
- 163/163 vitest tests passed after every change. `tsc` and the production build were clean.
- Codex review 1 (full PR): 0 high/medium, 2 low, both accepted. Codex also reported a clean lint and build, and checked `/` and `/concept` in light/dark at narrow and sticky-card widths.
- Codex review 2 (card colours): 1 medium (contrast, fixed) and 1 low (outline contrast of the example buttons, accepted).
- Manual DOM checks in the Orca browser:
  - Card backgrounds and the label are present, with 3 cards in the stack.
  - The first card pins at 96px.
  - Computed contrast ratios for the new tints in both themes.

## Numbers
- Tests: 163 passing. Diff: 17 files, +136/−118.
- Review findings: 9 (code-review, all fixed). Codex round 1: 2 low. Codex round 2: 1 medium, 1 low.
- Contrast of muted text on the purple card: 4.60 before the fix, 4.95 after (4.82 dimmed).
- Codex review wall time: about 14 min for the full PR.
- Cost and latency: unknown.

## Open issues and risks
- Fonts load from Google, which is a third-party request and fails on networks that block it.
- The example-button outlines on the cyan card are below 3:1 (labels remain readable).
- The `/` logo is still a placeholder to be replaced.
- The Orca → Codex prompt hand-off is flaky and sometimes needs a manual Enter.

## Jury questions this helps answer
- **Did you just use AI to restyle a site?** AI did the work, but under two independent reviews (Claude and Codex), with a human approving the design and catching misses such as a skipped review.
- **How do you know it's accessible?** Contrast was computed per colour pair, including while the scroll animation dims a card. One sub-AA case was found and fixed, and a skip link and focus ring were added.
- **What did you drop?** Positional CSS colouring, a full brand copy with logos, and self-hosted fonts. Each was a scope or time trade-off.
- **How does it scale to more pages?** All colours are tokens in one CSS file with light and dark values. New sections inherit them instead of hard-coding colours.
- **Measurable user value?** Unknown for this PR. It is a visual and accessibility change, and no user metrics were collected.
