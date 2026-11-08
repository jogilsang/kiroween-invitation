# Steering: Engineering principles

> Why: the project's whole credibility rests on "model says, code decides"; this doc makes that enforceable.
> Effect: the agent writes limits and refusals as code constants with tests, not as prose or model behavior.

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

## Coding conventions

- Small pure functions in `engine/`. One responsibility each.
- Validation returns a result (`{ ok, value, reason }` style), never throws for
  expected bad input. Throwing is for programmer error only.
- Tests cover: 2 happy paths, 2 edge/negative paths, 1 error path per feature
  (repo-wide testing rule).
- Behaviour tests, not implementation tests. Independent of execution order.

## Security

- No secret, account id, key, or token in code, config, assets, or exported output.
- Treat nickname and any free text as untrusted: sanitize before it enters the
  invitation or a share link; never echo raw into HTML.
- The pre-share scan runs before any share/export output is produced.
