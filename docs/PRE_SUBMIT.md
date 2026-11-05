# Pre-submission review — ASCII Invite (step 12)

Date: 2026-11-05. Three perspectives + the mechanical audit
(`docs/audit_submission.sh`, 17/17 PASS). Deadline: KST 2026-12-05 07:00.

## Mechanical audit: 17/17 PASS

LICENSE at root, `.kiro/` present and not gitignored, `.omc/` excluded and not
tracked, full spec + steering + hooks + agents present, README judge-try,
write-up, video script, red-team doc, 29 tests green, secret scan clean.

## Perspective 1 — Judge (Costume Contest, 4 criteria × 20%)

- Design: dark neon theme, live preview, PNG export, share link, noscript, aria.
  The haunting UI *is* the function (ASCII result is the product). Strong.
- Technological Implementation: spec + 3 hooks + 5 agents + PBT + MCP browser
  verification, all with dated evidence. Strong.
- Innovation: moderate. ASCII conversion is common; the differentiator is the
  trio (determinism + variable year + URL-only share) and its completeness. The
  video's first 18s must sell the result, not the tech.
- Presentation: script is ready and follows a single person's scene; needs the
  actual recording (human).

## Perspective 2 — Real user

- Works end-to-end in a real browser (verified). Live update is snappy.
- Limitation to be honest about in the listing: non-Latin nicknames sanitize to
  empty (documented in RED_TEAM G1). A Korean/Japanese user's handle disappears.
- Share link carries everything in the URL; no account needed. Good.

## Perspective 3 — Engineer / security

- Engine is pure and deterministic; 1,800 PBT cases hold. 20 red-team inputs all
  safe. Pre-commit hook blocks secrets/.omc and is wired into real git.
- No secret, account id, or customer name in tracked files (scan clean).
- Deploy is least-privilege (private bucket, OAC, scoped bucket policy).

## Remaining work — HUMAN ONLY (CEO decides / does)

These are gated by policy to the user; the agent has prepared everything up to them.

1. **Deploy** — DONE (2026-11-05). Live: https://d3hl6g932302kb.cloudfront.net
   Stack `ascii-invite` in captain/us-east-1, private bucket + CloudFront OAC,
   verified in a real browser (200, no console errors, renders). Teardown:
   `AWS_PROFILE=captain bash deploy/teardown.sh`.
2. **Record + upload the 3-min video** to YouTube (public/unlisted); put the link
   at the top of the Devpost body. Script: `docs/video/SHOTLIST.md`.
3. **Create the PUBLIC GitHub repo** and sync `ascii-invite/` (without `.omc/`).
   The monorepo stays private; sync only this folder.
4. **Devpost submission**: pick Costume Contest, paste the live URL, repo URL,
   video URL, the Kiro write-up (`docs/KIRO_WRITEUP.md`), and the text description.
5. Optional bonus: Bonus Blog post (mention "Kiroween 2026 hackathon") and a
   Social Blitz post starting with `#KiroweenHackathon26`.

## Decisions already locked (for the record)

- Category: **Costume Contest**.
- Not pursued: Best Kiro Crew App (no Crew App Kit app), Best Ghost (not a 2025
  registrant), Best Startup/Student (not applicable).
- Kiro credits: not requested.

## One risk to watch

- 2026 project gallery is still unpublished; overlap with this year's entries is
  unmeasured. Re-check `kiroween.devpost.com/project-gallery` around 11/20 and
  12/1. If Costume is saturated, the Resurrection framing is a fallback — but the
  category is already locked per CEO decision.
