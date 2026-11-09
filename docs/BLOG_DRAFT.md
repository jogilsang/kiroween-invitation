# Blog draft (AWS Builder Center article and the Bonus Blog Prize)

Published 2026-11-08: https://builder.aws.com/content/3LpKUiMT9UXTjR58Q0hYLsvTSv3/green-tests-were-not-enough-what-kiro-crew-found-in-my-kiroween-2026-project (used as the Blog Prize URL in Devpost).

Where it goes: AWS Builder Center (builder.aws.com/create/content) as a community article. For the Bonus Blog Prize the rules ask for a public post "on any third-party blog platform" and do not define the term. Builder Center is run by AWS, the company behind Kiro, so it may not count. If you want the prize to be safe, also publish the same text on dev.to or Medium and use that URL in Devpost. The text must say it was written as part of the Kiroween 2026 hackathon (it does, in the first line).

Title (255 characters max):
Green tests were not enough: what Kiro Crew found in my Kiroween 2026 project

Description (512 characters max):
I built a Halloween invitation generator with Kiro for Kiroween 2026. A second Kiro tool, Kiro Crew, reviewed it in a real browser and found two bugs that 117 passing tests could not see. Notes on specs, hooks, steering, property-based tests, and what I did not verify.

Tags: Kiro, Hackathon, Testing, Serverless, CloudFront

---

*This post was written as part of the Kiroween 2026 hackathon.*

I like writing down what I learn at hackathons, so this is the first of a few experience reports. The project is **Kiroween Invitation**: pick a look, type your name and the party details, and get a glowing SVG invitation of a white Kiro ghost and a pumpkin that you can save as an image, share by link or add to your calendar. No server, no account.

- Live demo: https://kiroween-invitation.chogilsang.net
- Code (MIT): https://github.com/jogilsang/kiroween-invitation
- Demo video (under 3 minutes): https://youtu.be/jlC4mtg_viE

The part worth telling is how Kiro was used, and the one lesson I would keep.

## A spec made a pivot cheap

I started with an ASCII-art renderer. Halfway through it was clear that ASCII could not give the grotesque, glowing look I wanted, so I switched to SVG. In Kiro I had written the requirements in EARS form with the failure cases first ("if the year is not an integer from 2000 to 2100, the system rejects it and changes no state"), and every requirement named its test. When the renderer changed, 18 of the 21 requirements and their tests did not. Only the renderer-specific ones were replaced. I did not have to rediscover my own rules.

## Steering and hooks did small, useful work

Three steering documents shaped more code than any prompt. The most useful line: "every limit, rejection and fallback is a code constant with a test proving it." A pre-commit hook blocks AWS keys, account IDs and agent state files, because the repo is public. It blocked its own first commit, since the patterns it looks for are written in its own source. At first I skipped three files by path; later I removed those skips and let only the AWS documentation placeholder ids through, so a key planted in any file is caught.

One honest result about hooks: my standalone hook files did not fire on the default Kiro CLI engine on my machine. They fired under `kiro-cli --v3`, where I saw tool-use, file-save and stop events logged and a push guard hold a `git push --dry-run`. Two of my hooks (the spec-trace check and the contrast check) I never saw fire by themselves, so I only claim that I ran their scripts by hand.

## A second Kiro tool found what 117 tests missed

I used Kiro Crew as an independent reviewer: a written brief, one rule ("investigate and propose, change nothing"), and its findings written to a file. In the second round it opened the app in a real Chrome and found two bugs that every Node test had passed straight through:

1. The calendar feature counted bytes with `Buffer`, which exists in Node but not in a browser. In the browser the "Add to calendar" button never switched on.
2. The six preview thumbnails were inline SVGs that shared element ids with the main preview, so every colour palette looked like the first one.

I fixed both test-first: one test deletes `Buffer` before calling the function, and the id problem went away by using `<img>` thumbnails and counting duplicate ids in a headless browser.

## Property-based tests: honest result

I wrote 10 property-based tests (about 3,050 generated cases): the same settings give a byte-identical SVG, junk input never throws, a share link round-trips. They did not find a new crash, because the spec had already forced the failure paths. They were a tripwire that stayed green through the pivot and every feature after it. Their limit taught me the most: they proved the engine, not the browser.

## Infrastructure

The site is one CloudFormation template: a private S3 bucket behind CloudFront with origin access control, plus an ACM certificate and Route 53 alias records for the custom domain. cfn-lint passes.

## What I did not verify

Safari, Firefox and mobile rendering; saving a PNG on Safari; importing the calendar file into Google, Apple or Outlook calendars. Contrast is tested against the palette colours, not by sampling rendered pixels. I did not use the Kiro Crew App Kit or Kiro powers; Crew was a reviewer here, not a second implementation.

## The lesson

Write the failure cases into the spec first. Give the reviewer a different tool, not a different prompt. And look at the real browser early, because green tests only prove what you thought to test.
