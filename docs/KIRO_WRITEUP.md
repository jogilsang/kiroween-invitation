# How Kiro built ASCII Invite

Every number here is checkable against this repo: 50 requirements (R1-R50,
EARS style, each naming its test), 127 passing tests (including six
property-based tests, 1,950 generated cases), about 1,400 lines of pure engine,
5 custom agents, 3 hooks, and one mid-project render-engine pivot (ASCII → SVG)
absorbed without losing a single guarantee. Nothing below is claimed that the `.kiro/`
folder, the commit log, or `node --test` does not show.

## The pivot that proves the method (read this first)

Midway, the ASCII renderer could not deliver the grotesque, glowing purple look
the project needed, so the render target was changed to deterministic SVG. This
is the single best piece of evidence for spec-driven development over vibe
coding: the guarantees lived in the spec and the tests, not in the renderer, so
the pivot was surgical. The three ASCII-specific requirements (density, dark
invert, monospace grid) were replaced by SVG equivalents in the requirements
*changelog*; the other eighteen (determinism, validation, composition, share,
safety, accessibility) carried over unchanged, as did every negative-path test.
`ascii.js` became `svg.js`; `invite.js`, `compose.js`, `share.js`, `scan.js`
were reused. The 30 tests of that moment stayed green. A vibe-coded project would have had to
rediscover its own invariants; this one read them off the spec. Full detail with
dates in `docs/KIRO_EVIDENCE.md`.

## Kiro builds, Kiro Crew reviews (twice)

Two Kiro products, two roles. Kiro (CLI + custom agents) built the product from
a spec. Kiro Crew was used as an **independent reviewer**: handed a written
brief, told to investigate and propose and not to change code, with its findings
written to a file.

Round 1 (`docs/CREW_FINDINGS.md`) caught what 30 green tests had missed: the
hat/horns options drew nothing (the tests only checked the exclusion rule), a
nickname limit mismatch (UI 40 vs engine 24), no keyboard navigation on the
purpose selector, and stale task checkboxes. Each was closed test-first
(`tests/crew_findings.test.js`).

Round 2 (`docs/CREW_FINDINGS_R2.md`, after costumes, scenes, export sizes, the
calendar file and presets were added) was the stronger result. With 117 tests
passing, Crew opened the app in a real Chrome and found two defects no Node test
could see: (S1) the calendar feature called `Buffer`, which exists only in Node,
so in a browser the "Add to calendar" button never switched on; (S2) the six
preset thumbnails were inlined SVGs that shared element ids with the main
preview, so every palette looked like the first one. It also found that a
full-width phone number passed the privacy scan, that a place could carry a
clickable link into a calendar entry, that Korean times such as `오후 7시` were
not read, that very long Korean lines could leave the frame, and that the README
run command gave a blank page. Every finding was fixed test-first
(`tests/crew_r2.test.js`) or, for S2, checked in headless Chrome (0 duplicate
ids); the table of what was fixed and what stays open is at the bottom of
`CREW_FINDINGS_R2.md`. Our red-team pass the same day (`RED_TEAM.md`, round 2)
found two other bugs of its own (an object typed into a text field became the
words "object Objec"; a format key like `__proto__` threw), also fixed test-first.

What Crew could not check is listed, not hidden: Safari/Firefox/mobile
rendering, saving a PNG on Safari, importing the calendar file into Google or
Apple Calendar. We did not rebuild the product in Crew, so we claim a
comparison of roles, not of speed. Story and evidence: `docs/KIRO_AND_CREW_STORY.md`.

## Kiro CLI with a custom conductor agent

This project was driven through the Kiro CLI, not a GUI. A custom agent named
`kiroween` acted as router/conductor: it read the official rules, wrote the
spec, and dispatched scoped work. The honest version of events: because the work
ran through one CLI agent, the `.kiro/specs`, `.kiro/steering`, and `.kiro/hooks`
files are authored artifacts that genuinely constrained the build, rather than
output of a point-and-click wizard. They are real and load-bearing — the hooks
run, the spec's EARS requirements each map to a named test — and that is what we
document.

## Custom agents (5), one as conductor

Under `.kiro/agents/`: `kiroween` (conductor, owns app/ and deploy), `ascii-engine`
(owns the deterministic renderer), `invite-logic` (owns validation/share/scan),
`art-tuner` (owns the artwork parts), and `red-team` (independent adversary,
forbidden from editing engine/app code — it only files findings and a GO/NO-GO).
The scope boundaries matter: the red-team agent being unable to touch the code it
judges is the same independent-verification pattern we used before, kept here for the same reason. It is why the red-team pass in `docs/RED_TEAM.md` is credible.

## Spec-driven vs vibe coding

The spec (`.kiro/specs/ascii-invite/`) is EARS-form with negative paths first:
"IF the year is not an integer in 2000..2100, THE SYSTEM SHALL reject generation
with a reason and change no state." Each requirement names its test
(`test_reject_invalid_year`). The payoff over vibe coding showed up immediately:
because the spec forced the negative paths up front, `normalizeConfig` was built
to clamp/sanitize/fall back from the start, so the property-based tests found no
crash on their generated inputs. We didn't retrofit safety; the spec made it the
default. The tasks file is sized so each task is one verifiable unit with a test
named before the code is written.

## Agent hooks (3), and the one that earned its place

`.kiro/hooks/` has three hooks:
- `test-on-save` runs `node --test` when `engine/**` or `tests/**` changes.
- `spec-change-reminder` re-syncs tasks.md + evidence when the spec changes.
- `pre-commit-secret-scan` blocks secrets, AWS account ids, and any `.omc/` path.

The secret scan is the one that proved its worth, twice. First, writing it
surfaced two real bugs its own test caught: it scanned the whole monorepo (false
positives on unrelated files) and captured the git prefix after `cd` (empty
scope). Both are fixed and recorded in `KIRO_EVIDENCE.md`. Second, it blocked its
own first commit — it flagged the pattern strings inside the scanner and a
planted example in the evidence doc. Rather than weaken the patterns, we
allowlisted those two known-safe files by path and wrote down the trade-off. A
guard that blocks you until you're honest about the exception is doing its job.

## Property-based testing

`tests/pbt.test.js` asserts invariants across random inputs: same config →
byte-identical SVG; any junk → a safe config that never throws; encode→decode
is identity; and the rendered SVG is always well-formed. It confirmed the
headline claim ("model says, code decides") holds across ~1,950 generated cases.
Honest note: PBT did not find a new crash, because the spec-first approach
front-loaded the defenses. What it did find, via an adversarial probe, is a
documented limitation: non-Latin nicknames sanitize to empty. We wrote that down
rather than hiding it.

## MCP

The chrome-devtools MCP and headless Chrome were used to look at the real
output: render the engine's SVG to PNG, check that the live preview updates,
count duplicate element ids in the page, and open the deployed CloudFront URL.
Kiro Crew's own Chrome session is what found the `Buffer` and duplicate-id bugs.
Seeing the real browser is something a unit test can't give, and it is why the
build loop includes it.

## Steering

Three steering docs (`product`, `tech`, `principles`), each opening with a
one-line "why". The `principles` doc is the one that shaped the most code: it
states "every limit, rejection, and fallback is a code constant with a test
proving it", which is why years, nickname rules, allow-lists, and layer order are
all constants with tests rather than scattered conditionals.

## What we would not claim

- We did not use Kiro Crew's App Kit; there is no Crew app in this submission.
- Not verified: Safari, Firefox and mobile rendering; PNG save on Safari; the
  calendar file imported into Google/Apple/Outlook. WCAG contrast is tested
  against the palette colors, not by sampling rendered pixels, and the text-fit
  rule estimates width instead of measuring a real font.
- The demo video is recorded by a person; this repo contains the script, not the
  upload.
