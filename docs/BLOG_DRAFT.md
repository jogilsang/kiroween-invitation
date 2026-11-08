# Blog draft (for the Bonus Blog Prize)

Where to publish: any third-party blog platform (dev.to, Medium, Hashnode, Velog). It must be public, published
during the Submission Period (2026-10-30 to 2026-12-04 PT) and say it was written as part of the Kiroween 2026
hackathon. Add the post URL to the Devpost form. Edit freely: it is a draft in the author's voice.
Suggested tags: `kiro`, `kiroween`, `webdev`, `testing`.

---

**Title:** Green tests were not enough: what Kiro Crew found in my Kiroween project

*This post was written as part of the Kiroween 2026 hackathon.*

I built a Halloween invitation generator for Kiroween 2026: pick a look, type your name and the party details,
and get a glowing SVG invitation of a white Kiro ghost and a pumpkin that you can save, share by link or add to a
calendar. The live demo is at https://kiroween-invitation.chogilsang.net and the code is at [GITHUB_URL]. This post is
about how I used Kiro, and the one lesson I would keep.

## Spec first made a pivot cheap

I started with an ASCII-art renderer. Halfway through it was clear that ASCII could not give the grotesque,
glowing look I wanted, so I switched to SVG. In Kiro I had written the requirements in EARS form, with the
failure cases first ("if the year is not an integer from 2000 to 2100, the system rejects it and changes no
state"), and every requirement named its test. When the renderer changed, 18 of the 21 requirements did not,
and neither did their tests. Only the renderer-specific ones were replaced. I did not have to rediscover my own
rules.

## Hooks and steering did small, boring, useful work

Three hooks ran during the build: tests on save, a reminder to update the task list when the spec changes, and a
pre-commit scan for secrets and AWS account IDs. The scan blocked its own first commit because the patterns it
looks for were written inside the scanner. I allowlisted two known files by path and wrote down why instead of
weakening the patterns. A steering document with one line, "every limit, rejection and fallback is a code
constant with a test", shaped more code than any prompt.

## The part I did not expect: a second tool found what 117 tests missed

I used Kiro Crew as an independent reviewer. I gave it a written brief, told it to investigate and not to change
code, and let it write its findings to a file. In the second round it opened my app in a real Chrome and found
two bugs that all my Node tests passed straight through:

1. The calendar feature counted bytes with `Buffer`, which exists in Node but not in a browser. In the browser the
   "Add to calendar" button never switched on.
2. The six preview thumbnails were inline SVGs that shared element ids with the main preview, so every colour
   palette looked like the first one.

I fixed both test-first: one test deletes `Buffer` before calling the function, and the id problem was fixed by
using `<img>` thumbnails and counting duplicate ids in a headless browser. My own red-team pass the same day
found two more (an object typed into a text field became the words "object Objec", and a prototype key crashed
the export size lookup).

## What I would not claim

I did not verify Safari, Firefox or mobile rendering, saving a PNG on Safari, or importing the calendar file
into real calendar apps. My contrast check tests the palette colours, not rendered pixels. I did not use the Kiro
Crew App Kit; Crew was a reviewer here, not a second implementation.

## The lesson

Writing the failure paths into the spec first made safe behaviour the default. But green tests only prove what I
thought to test. A different tool, looking at the real thing in a real browser, is what found the rest.

[GITHUB_URL] · Live demo: https://kiroween-invitation.chogilsang.net
