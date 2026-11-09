# Steering: Engineering principles

> Why: the project's whole credibility rests on "model says, code decides"; this doc makes that enforceable.
> Effect: the agent writes limits and refusals as code constants with tests, not as prose or model behavior.
> Inclusion: always (no front matter). Kept short on purpose.

## Model says, code decides

- A model (or any non-deterministic source) may only *suggest*. It can never
  change state or decide an outcome.
- Every limit, rejection, and fallback is a code constant with a test proving it.
  Examples: allowed year range, nickname length/charset, known purpose keys,
  layer order, mutually-exclusive parts.
- Unknown/invalid input is rejected or safely defaulted — never branched on to
  do something arbitrary.

## Determinism

- Same config in → same SVG out, byte for byte. This is the headline claim and
  a property-based test guards it.

## Where the detailed rules went

> Split on 2026-11-09 so each rule is loaded where it applies: coding conventions are in `engine-purity.md` (engine files), test rules in `testing.md` (test files), the release routine in `release-check.md` (manual).

## Security

- No secret, account id, key, or token in code, config, assets, or exported output.
- Treat nickname and any free text as untrusted: sanitize before it enters the
  invitation or a share link; never echo raw into HTML.
- The pre-share scan runs before any share/export output is produced.
