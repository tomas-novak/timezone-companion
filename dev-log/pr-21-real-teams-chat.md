# Show the real Teams chat in Today and style every chat like Teams (#21, merged 2026-10-17)

## Goal
- On the /concept pitch page, the "Today" section used three made-up chat bubbles to show the problem. It now shows a real Teams chat that colleagues staged on purpose, so the jury and pilot teams see what actually happens today.
- Every other chat window on the page should look like Teams too, so the demo feels like the product it describes.

## What changed
- **Today:** the made-up bubbles are replaced by a screenshot of a real Teams chat. In it, seven messages were needed to agree on one meeting time, and the time they agreed on was still a non-working day for the colleague in Doha. New caption: "Seven messages to agree on one time, and it still landed on a non-working day in Doha."
- **Lightbox:** tapping the screenshot opens it full screen. On phones it is shown 900 px wide and pans sideways; a tap, Close or Esc closes it.
- **Teams look everywhere:** the Write, Read, Try and Trust windows now share a Teams-style window (grey title bar with window icons) and Teams-style messages (avatar with the city's initials on the left, lavender bubble for your own messages).
  - In Write, the email form (To / Subject / Send) became a Teams compose box with an icon Send button.
- **Code:**
  - New `TeamsWindow` and `TeamsMessage` components in `ChatFrame.tsx`.
  - A `.light` class (the CSS selector became `:root, .light`) keeps the mock-ups light inside dark sections.
  - The screenshot is in `src/assets`, with alt text that gives the whole conversation.
  - One impeccable design-hook rule (`border-accent-on-rounded`) is ignored for `MomentWrite.tsx`, because the Teams compose box has a rounded edge with an accent underline on purpose.

## Decisions
- **Write window:** asked the human whether it should stay an Outlook email or become Teams. Answer: "everything like Teams". The line under the window that mentions Outlook was kept.
- **One shared component** for all chat windows instead of styling each one separately, so they cannot drift apart.
- **Mock-ups stay light** in dark mode and inside dark sections, to match the screenshot. Rejected: a dark Teams theme, which would need a second set of colours.
- **Labels kept the same:** "Send", "Viewing as" and the log role did not change, so the existing tests kept working unchanged.
- **Left out:** message timestamps, real names and photos in the interactive demos (cities only), and the Teams logo.

## What went wrong
- **The phone fix was redone.** The PR review said the screenshot was unreadable on phones. The first fix added a link, "Open the chat at full size", which opened a new tab. The human rejected it: no extra button, no new tab, no download, it should behave like a photo. It was replaced with the full-screen lightbox.
- **Lightbox, first try:** the image was too big on phones. Fixed by setting an explicit 900 px width that only applies on small screens.
- **Lightbox, accessibility:** in the first version the image was a close button. Screen readers read the whole chat transcript and never said the button closes the view. Changed it to a plain scroll area and kept the named Close button.
- **The Orca review worker did not start:** Codex was blocked by its own update prompt. Fell back to `codex exec` in read-only mode.
- **The review gate marked changes no reviewer had read:** once after a fix, and once after the impeccable config change. A human question ("Did Codex do a review?") exposed it, and the review was run again.

## Hardest part
- Making a wide desktop screenshot readable on a phone without adding UI the human did not want. Solved with a full-screen view that keeps the text readable and lets you pan sideways, and closes on a tap like a photo viewer.

## How AI was used
- **Claude Code (Opus 5.5)**
  - Went through the /concept page and listed every chat window.
  - Proposed the design, implemented it and wrote the commits and the PR.
  - Checked the result in the Orca browser.
- **Codex review**
  - Ran four times locally with `codex exec` in read-only mode (reviewer writes REVIEW.md, Claude fixes), plus once as the GitHub PR reviewer.
  - Findings and fixes:
    - The Try "Before you send" preview was not restyled: fixed.
    - Long words without spaces could be cut off in bubbles: fixed.
    - The new-tab link did not say it opens a new tab: fixed.
    - The lightbox close button had no clear name for screen readers: fixed.
    - GitHub PR review: the screenshot was too small on phones (P2): fixed.
- **Human corrections:**
  - Chose the Teams look for everything.
  - Rejected the new-tab link.
  - Asked whether the review had really happened, which exposed that the gate had marked changes no reviewer had read.

## How we checked it
- `vitest`: 180 out of 180 tests passed after every change. `tsc` typecheck passed.
- Orca browser snapshot: the image, its alt text, the new caption and the Send button were all present.
- At 375 px width: the lightbox image is 900 px wide, its scroll width is 900 against 375 visible, and a Close button exists.
- Not checked: how it looks to the eye (the Orca screenshot came out as repeated tiles), dark mode, and touch panning on a real phone.

## Numbers
- 3 commits; 7 files touched in the first commit, plus a PNG of 1458×887 px, about 106 KB.
- 5 review findings in total (1 medium and 1 low from the first two Codex runs, 1 low and 1 medium from the lightbox runs, 1 P2 on GitHub). All 5 were fixed.
- Latency and cost: not applicable, because this change makes no AI calls.

## Open issues and risks
- **Real names:** the screenshot shows the real names and an avatar photo of colleagues. Their consent to a public repo is assumed, not verified here.
- **Unverified:** touch panning on a real phone, and dark mode.
- **Phones:** the full-screen view still makes you pan sideways. A crop made for phones might read better (not tried).

## Jury questions this helps answer
- **Is the problem real?**
  Yes. The Today section shows a real Teams chat: seven messages to agree on one time, and the result was still a non-working day in Doha.
- **How did you check the AI's work?**
  Every change was tested (180 tests) and reviewed read-only by Codex, and a human rejected one fix that worked technically but was the wrong experience.
- **What did you drop or redo?**
  We dropped the "open full size" link that opened a new tab and replaced it with a tap-to-zoom view, at the human's request.
- **Is it easy to use?**
  The demo now looks like the Teams that users already know. Unknown: we did no user testing for this change.
