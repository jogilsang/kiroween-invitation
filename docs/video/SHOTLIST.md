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
| 0:18–0:35 | Click a preset (Pirate Crypt). Type a Korean nickname, fill date `Oct 31`, time `오후 7시`, place. The invitation updates live. | "Start from a look, or build your own. Add your handle, even in Korean, and when and where." |
| 0:35–1:05 | Tick cat, skull, candle, tombstone, crow. Change the skull to blood red and the cat to orange. Tick hat then horns: the hat stays. Pick a costume and a graveyard scene. Then press **Remix the look** three times. | "Eleven Halloween assets, each with its own color. Hat and horns can't both win, the code picks one. And one button reinvents the whole look. Your name and details never change." |
| 1:05–1:30 | Switch export size to story (9:16), Save as image. Click Add to calendar (.ics), then Copy share link. | "Save it for your story or your chat, in three sizes. Add the event to your calendar. Or copy a share link: no server, no account. The whole invitation lives in the URL." |
| 1:30–1:55 | Paste the link in a fresh tab → the exact same invitation appears. | "Open the link and the exact same invitation comes back, byte for byte. Same settings in, same SVG out — always." |
| 1:55–2:10 | Terminal: `node --test` (127 tests) green; flash the RED_TEAM.md tables. | "Property-based tests prove determinism across about two thousand random inputs, and two red-team rounds throw over forty deceptive inputs at it. Every one is rejected or sanitized; two real bugs were found and fixed on the way." |
| 2:10–2:35 | Split: the Kiro Crew pane reading the brief and asking permission, then `CREW_FINDINGS_R2.md` highlighting S1 `Buffer is not defined` and S2 duplicate ids. Cut to the red test, then green, then the calendar button working and the six different palettes. | "Then we gave it to a second tool, Kiro Crew, as an independent reviewer. Investigate, change nothing. With 117 green tests it still found two bugs that only show in a real browser: the calendar button never switched on, and every palette looked the same. Kiro closed both test-first." |
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
