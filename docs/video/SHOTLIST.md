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
| 0:18–0:35 | Pick purpose = Recruit, type a nickname, set year 2026. ASCII updates live. | "Pick a purpose — join, announce, or recruit — a year, and your handle. The ghost and pumpkin render as ASCII, live." |
| 0:35–1:05 | Toggle face (spooky), add hat + bats + candle. Show hat+horns → only hat stays. | "Decorate it. And watch this — hat and horns can't both win. The code picks one and records the decision. The model never decides the outcome; the code does." |
| 1:05–1:30 | Click Save as image → PNG opens. Click Copy share link. | "Save it as an image for your chat. Or copy a share link — no server, no account. The whole invitation lives in the URL." |
| 1:30–1:55 | Paste the link in a fresh tab → the exact same invitation appears. | "Open the link and the exact same invitation comes back, byte for byte. Same settings in, same ASCII out — always." |
| 1:55–2:20 | Terminal: `node --test` showing 29 tests + PBT; flash RED_TEAM.md table. | "That guarantee is tested: property-based tests prove determinism across hundreds of random inputs, and a red-team pass throws 20 deceptive inputs at it — injection, forged links, bad years — all rejected or sanitized." |
| 2:20–2:45 | Show `.kiro/` tree: specs, steering, hooks, 5 agents; the pre-commit scan blocking a planted secret. | "Built in Kiro: an EARS spec, steering docs, a pre-commit hook that blocks secrets, and five custom agents with one acting as conductor." |
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
