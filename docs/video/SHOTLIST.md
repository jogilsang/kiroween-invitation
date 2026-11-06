# Demo video script — ASCII Invite (≤ 3:00)

- Target length: under 3 minutes (judges may stop at 3:00). Aim for ~2:40.
- Upload: public/unlisted YouTube; put the link at the TOP of the Devpost body.
- No copyrighted music, no third-party trademarks. Screen recording + optional
  `say` narration via a timed sheet (mic-free), per LESSONS step 8.
- Record in a clean Chrome guest window (no bookmarks/tabs/notifications visible).
- Verify before recording: the app is served and the invitation renders live.

## Scene plan

| Time | On screen | Narration (one person) |
|---|---|---|
| 0:00–0:18 | A single dark editor at night; cut to the app's dark neon title. | "It's 1 a.m., you're coding alone, and you want to tell your friends: I'm doing Kiroween this year — who's in? ASCII Invite turns that into a haunted invitation." |
| 0:18–0:35 | Pick purpose = Recruit, type a nickname, set year 2026, mood/palette/glow. The invitation updates live. | "Pick a purpose — join, announce, or recruit — a year, your handle, and a look: mood, palette, glow. The ghost and pumpkin render live." |
| 0:35–1:05 | Switch mood to hollow, add moon + bats + hat. Tick horns too: the hat stays and the horns do not appear. | "Decorate it. And watch this: hat and horns can't both win. Tick the horns and the hat stays. The code picks one and records the decision. The model never decides the outcome; the code does." |
| 1:05–1:30 | Click Save as image → PNG opens. Click Copy share link. | "Save it as an image for your chat. Or copy a share link — no server, no account. The whole invitation lives in the URL." |
| 1:30–1:55 | Paste the link in a fresh tab → the exact same invitation appears. | "Open the link and the exact same invitation comes back, byte for byte. Same settings in, same SVG out — always." |
| 1:55–2:10 | Terminal: `node --test` (37 tests) green; flash RED_TEAM.md table. | "Property-based tests prove determinism across about two thousand random inputs, and a red-team pass throws 22 deceptive inputs at it. All rejected or sanitized." |
| 2:10–2:35 | Split: the Kiro Crew pane reading the brief and asking permission, then `CREW_FINDINGS.md` highlighting "hat/horns draw nothing". Cut to the red test, then green, then the hat and horns rendered. | "Then we gave it to a second tool, Kiro Crew, as an independent reviewer. Investigate, change nothing. It found what our own tests missed: the hat and horns options drew nothing. Kiro closed it test-first, and now they render." |
| 2:35–2:45 | Show `.kiro/` tree: specs, steering, hooks, 5 agents; the requirements changelog showing the ASCII to SVG pivot. | "Built in Kiro: an EARS spec that absorbed a full render-engine pivot, steering, a pre-commit hook that blocks secrets, and five custom agents." |
| 2:45–2:55 | Back to the finished invitation, dark neon, full frame. | "ASCII Invite. Model says, code decides. Happy Kiroween." |

## Pre-record checklist (from LESSONS)

- [ ] Clean Chrome guest window; notifications off.
- [ ] App served and rendering confirmed (not a stale tab).
- [ ] `node --test` run once live so the green count is real on camera.
- [ ] No account id / secret / customer name visible anywhere on screen.
- [ ] Final cut ≤ 3:00; export; watch it once start to finish.

## Note

Recording and YouTube upload are done by a person (CEO), not the agent. This
file is the script to record from.
