# How Kiro built ASCII Invite

Every number here is checkable against this repo: 7 commits, 21 EARS
requirements, 29 passing tests (24 unit + 5 property-based), ~500 lines of pure
engine, 5 custom agents, 3 hooks. Nothing below is claimed that the `.kiro/`
folder, the commit log, or `node --test` does not show.

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
`art-tuner` (owns the SVG→grid assets), and `red-team` (independent adversary,
forbidden from editing engine/app code — it only files findings and a GO/NO-GO).
The scope boundaries matter: the red-team agent being unable to touch the code it
judges is the same independent-verification pattern that caught regressions in a
prior hackathon. It is why the red-team pass in `docs/RED_TEAM.md` is credible.

## Spec-driven vs vibe coding

The spec (`.kiro/specs/ascii-invite/`) is EARS-form with negative paths first:
"IF the year is not an integer in 2000..2100, THE SYSTEM SHALL reject generation
with a reason and change no state." Each requirement names its test
(`test_reject_invalid_year`). The payoff over vibe coding showed up immediately:
because the spec forced the negative paths up front, `normalizeConfig` was built
to clamp/sanitize/fall back from the start, so the property-based tests found no
crash on 1,800 random inputs. We didn't retrofit safety; the spec made it the
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
byte-identical ASCII; any junk → a safe config that never throws; encode→decode
is identity. It confirmed the headline claim ("model says, code decides") holds
for 1,800 generated cases. Honest note: PBT did not find a new crash here,
because the spec-first approach front-loaded the defenses. What it did find, via
an adversarial probe, is a documented limitation: non-Latin nicknames sanitize to
empty. We wrote that down rather than hiding it.

## MCP

The browser was driven through the chrome-devtools MCP to verify the app in a
real Chrome: it confirmed the invitation renders (1,311 chars of ASCII), the live
preview updates on purpose/nickname/parts changes, and the only console error was
a missing favicon. That verification-in-the-real-browser is something a unit test
can't give, and MCP is what made it part of the build loop.

## Steering

Three steering docs (`product`, `tech`, `principles`), each opening with a
one-line "why". The `principles` doc is the one that shaped the most code: it
states "every limit, rejection, and fallback is a code constant with a test
proving it", which is why years, nickname rules, allow-lists, and layer order are
all constants with tests rather than scattered conditionals.

## What we would not claim

- We did not use Kiro Crew's App Kit; there is no Crew app in this submission.
- The site was not yet deployed at write time (the captain AWS session was
  expired); the IaC and scripts are validated offline and ready.
- The demo video is recorded by a person; this repo contains the script, not the
  upload.
