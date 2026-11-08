# Devpost submission text: ASCII Invite (Kiroween 2026)

Every field of the Devpost form, ready to paste. Written in English because the rules require it.
Any square-bracket placeholder (like the repo and video links) is not known yet and must be filled before submitting. Numbers were checked
against this repo on 2026-11-08 (`node --test` = 131 tests, `docs/audit_submission.sh`).

## Fixed choices (decided, do not change without the CEO)
- Category: **Costume Contest**
- Bonus prizes to tick: **Bonus Blog Prize**, **Social Blitz Prize**. Best Demo needs no extra step.
- Not claimed: Best Kiro Crew App (no Crew App Kit repo), Best Ghost of Kiroween Past (not a 2025 registrant),
  Best Startup, Best Student.
- License: MIT. Team: 1 person.

## Project name
ASCII Invite

## Elevator pitch (tagline)
A haunted Halloween invitation generator: pick a look, add your name and the party details, and get a glowing SVG invitation you can save, share by link or add to your calendar. No server, no account.

## Built with (tags)
kiro, kiro-cli, kiro-crew, javascript, svg, fast-check, amazon-cloudfront, amazon-s3, aws-cloudformation, node.js

## Try it out links
- Live app: https://kiroween-invitation.chogilsang.net
- Code: [GITHUB_URL]
- Demo video: [YOUTUBE_URL]

## Project story (paste into "About the project")

It is 1 a.m., Mina has been coding alone for hours, and she wants to tell her friends: *I'm doing Kiroween this year, who is in?* A plain text message felt flat. In about a minute she picks the "Pirate Crypt" look, types her name in Korean, adds "Oct 31, 7 PM, Hapjeong", saves a 9:16 story image and sends a link to the group chat. Everyone who opens the link sees exactly the same invitation, and one tap adds the party to their calendar.

### What it does
ASCII Invite turns a few choices into a polished, glowing Halloween invitation built around a white Kiro ghost and a jack-o'-lantern on a dark purple night.
- Three purposes (join, notice, recruit), any year, any name (Korean and other scripts work), plus optional date, time and place.
- Eleven drawn assets (moon, bats, cobweb, crow, cat, tombstone, skull, candle, pumpkins, hat, horns), each in one of six colors; four costumes (Dracula, mummy, pirate, skeleton); four backdrop scenes.
- Six one-click looks and a **Remix** button that invents a whole new look.
- Three export sizes (square, story 9:16, wide 16:9) saved as PNG, a share link that stores the whole invitation in the URL, and a calendar file (.ics) when the date can be read.
- Keyboard-navigable, with text alternatives, and a `noscript` explanation.

The design target for the **Costume Contest** category is a haunting interface that also does real work: the dark, glowing look is the product, and every control changes what the picture says.

### How we built it with Kiro
We used Kiro CLI with a custom conductor agent and four scoped agents, a requirements-first spec, steering documents, three hooks and property-based tests. The full write-up is in the "How Kiro was used" field below and in `docs/KIRO_WRITEUP.md`.

The core idea is **model says, code decides**. There is no AI and no randomness in the render path: the same settings always produce the same SVG, byte for byte. Validation, layer rules (a hat and horns cannot both win), the privacy scan and the calendar-date reader are plain code with named tests.

### Challenges
- **A mid-project pivot.** The first version drew ASCII art, but it could not give the grotesque, glowing look we wanted. We switched the renderer to SVG. Because the guarantees lived in the spec and the tests, not in the renderer, 18 of the 21 requirements carried over unchanged.
- **Bugs that green tests could not see.** An independent review in Kiro Crew opened the app in a real Chrome and found two: the calendar feature used a Node-only function, so in a browser the button never switched on; and six preview thumbnails shared SVG element ids, so every palette looked like the first. We fixed both test-first.
- **Text that does not fit.** Long Korean lines left the frame. The engine has no font measuring, so it estimates text width and squeezes only lines that are too wide.

### Accomplishments we are proud of
- 131 passing tests, including property-based tests (about 1,950 generated cases) for determinism and share-link round trips.
- Two red-team rounds (42 deceptive inputs). Every one is rejected, sanitized or safely defaulted; the second round found two real bugs, fixed test-first.
- An honest limits list: we say what we did not verify.

### What we learned
Green tests are necessary but not enough: a second tool looking at the real browser found what 117 passing tests missed. Writing the negative paths into the spec first made safe defaults the starting point instead of a retrofit.

### What's next
Verify Safari, Firefox and mobile rendering, and import the calendar file into Google, Apple and Outlook calendars. Both are listed as unverified below.

### Honest limits
- Not verified: Safari, Firefox and mobile; saving a PNG on Safari; calendar import into real calendar apps.
- Contrast is tested against the palette colors (WCAG 4.5:1), not by sampling rendered pixels, and the text-fit rule estimates widths instead of measuring a real font.
- We did not use the Kiro Crew App Kit; Kiro Crew was used as an independent reviewer only.

## How Kiro was used (paste into the write-up field)
Source: `docs/KIRO_WRITEUP.md` (kept in the repo, same text). Paste its sections: pivot, Kiro builds and Crew reviews (twice),
custom conductor agent, custom agents, spec-driven vs vibe coding, hooks, property-based testing, MCP, steering,
what we would not claim.

## Testing instructions for judges (the form's private field, if asked)
No login. Open the live URL. Click a look, type a name, press Save as image. Nothing is stored on a server.
To run locally: serve the repository root (for example `python3 -m http.server 8137`) and open `/app/index.html`.
Tests: `node --test` (Node 22.12 or newer).

## Images to upload (with one-sentence captions)
1. Default invitation (square): "The default invitation: white Kiro ghost, jack-o'-lantern, dark purple night."
2. Look gallery: "Six one-click looks, each with a live thumbnail."
3. Pirate Crypt, story size: "The same settings in the 9:16 story size."
4. Share link round trip: "Open the link and the same invitation comes back."
5. Crew review (docs/CREW_FINDINGS_R2.md): "An independent review found two browser-only bugs."
6. Test run: "131 tests green."
7. `.kiro/` tree: "Specs, steering, hooks and agents."
The link-preview image (`app/og.png`) can serve as the thumbnail.

## Bonus prize fields
- Bonus Blog Prize: [BLOG_URL] (must say it was written as part of the Kiroween 2026 hackathon; see docs/BLOG_DRAFT.md)
- Social Blitz Prize: [SOCIAL_URL] (post must start with #KiroweenHackathon26 and be original; see docs/SOCIAL_BLITZ_NOTES.md)

## Before pressing Submit (checklist)
- [ ] Devpost account logged in and registered for Kiroween 2026 (rules accepted by the CEO).
- [ ] Public GitHub repo created, license shown in About, `.kiro/` at the root and not in .gitignore, `.omc/` absent.
- [ ] Video is under 3 minutes, public on YouTube, link at the top of the story.
- [ ] Live URL opens in a private window and on a phone.
- [ ] Every placeholder above replaced. No account IDs, keys or customer names anywhere.
- [ ] Category = Costume Contest. Bonus boxes ticked only where a URL exists.
