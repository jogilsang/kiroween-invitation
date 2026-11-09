# Social Blitz notes (write this one yourself)

Rule (from the Rules tab, re-read 2026-11-08): the post goes on a social platform "such as X, LinkedIn, IG, or TikTok" (a community site like AWS Builder Center is not named), the hashtag must come first, and the Kiro team judges "original thoughts vs AI writing", the insight about Kiro, and the post's images or video.
Earlier summary of the same rule: post on any social platform during the Submission Period, **start the post with
`#KiroweenHackathon26`**, share your favourite thing about Kiro and how it changed the way you approach
development, and add the post URL to the Devpost form. It is judged on the quality of the post and its insights
about Kiro. The rules text we read says the post should be your own writing, so these are **facts and angles to
pick from, not a finished post**. Write it in your own voice, in your own words.

## True facts you can use (all checkable in the repo)
- Spec first: failure paths written before code, each requirement names a test. A render-engine pivot (ASCII to
  SVG) kept 18 of 21 requirements and their tests.
- Kiro Crew as an independent reviewer found two bugs in a real Chrome that 117 passing Node tests missed
  (`Buffer` in the browser, duplicate SVG ids).
- A pre-commit hook blocked its own first commit; the honest fix was an allowlist plus a written reason.
- Property-based tests: 10 properties, about 3,050 generated cases for "same settings, same SVG".

## One angle to choose (pick one, do not list everything)
- "Green tests felt safe. A second Kiro tool opened a browser and proved me wrong."
- "I wrote the failure cases first, and my renderer pivot cost almost nothing."

## Format tips
- First characters must be `#KiroweenHackathon26`.
- One screenshot with a one-line meaning (for example the Crew finding next to the fixed button).
- Link the live demo https://kiroween-invitation.chogilsang.net.
- Post it between now and 2026-12-04 PT, then paste the post URL into Devpost.
