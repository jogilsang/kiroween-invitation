# Pre-submission review — ASCII Invite (step 12)

Date: 2026-11-05 (updated after the ASCII → SVG pivot and the second Crew review). Three perspectives + the
mechanical audit (`docs/audit_submission.sh`, 17/17 PASS). Deadline: KST
2026-12-05 07:00.

> Pivot note: the render engine changed from ASCII glyphs to deterministic SVG
> for a grotesque, glowing look. Spec/steering/engine/app/tests/deploy all
> realigned; the project keeps the name `ascii-invite` for continuity. Detail in
> `docs/KIRO_EVIDENCE.md`.

## Mechanical audit: 17/17 PASS

LICENSE at root, `.kiro/` present and not gitignored, `.omc/` excluded and not
tracked, full spec + steering + hooks + agents present, README judge-try,
write-up, video script, red-team doc, 127 tests green, secret scan clean.

## Perspective 1 — Judge (Costume Contest, 4 criteria × 20%)

- Design: dark neon SVG, glowing grotesque ghost + pumpkin, live preview, PNG
  export, share link, noscript, aria. The haunting UI *is* the function. Strong
  (clearly stronger than the ASCII version it replaced).
- Technological Implementation: spec + 3 hooks + 5 agents + PBT + MCP browser
  verification + a documented render-engine pivot absorbed via the spec — all
  with dated evidence. Strong.
- Innovation: improved by the pivot. The differentiator is the combination
  generator (purpose × year × mood × palette × glow × parts) that always renders
  a distinct, deterministic, shareable poster. The video's first 18s sells the
  result.
- Presentation: script ready, follows one person's scene; needs the recording (human).

## Perspective 2 — Real user

- Works end-to-end in a real browser and on the live CloudFront URL (verified via
  headless render). Live update is snappy.
- Korean and other non-Latin handles now work (R25). Not verified: how the glyphs
  look on a device without a CJK font; Safari, Firefox and mobile; PNG save on
  Safari; calendar import into Google/Apple/Outlook.
- Share link carries everything in the URL; no account needed. Good.

## Perspective 3 — Engineer / security

- Engine is pure and deterministic; ~2,000 PBT cases hold. two red-team rounds (42 inputs) all
  safe, including SVG tag injection via nickname. Pre-commit hook blocks
  secrets/.omc and is wired into real git.
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
