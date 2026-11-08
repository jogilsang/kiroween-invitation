# Built with Kiro, reviewed by Kiro Crew

> Story for the submission write-up, blog post, and video. Every claim below is
> checkable in this repo (files, tests, commits). Where something was NOT
> verified, it says so.

## One-paragraph version

Kiro built Kiroween Invitation from a spec: steering, EARS requirements, hooks, five
custom agents, property-based tests. Then we handed the finished product to a
different tool, Kiro Crew, as an **independent reviewer** that had never seen
the code, with one rule: investigate and propose, change nothing. Crew read the
spec, ran our tests, diffed the deployed build against the source, called the
live site, and came back with a report that caught real defects Kiro's own 30
green tests had not. Kiro then closed them test-first. Builder and reviewer were
different tools with different jobs, and the second pair of eyes mattered.

## Two tools, two roles

| | Kiro (CLI + custom agents) | Kiro Crew |
|---|---|---|
| Role | Builder: spec, code, tests, deploy | Independent reviewer: investigate, propose |
| Input | The idea and the rules | A written brief (`docs/CREW_RESEARCH_BRIEF.md`) + read access |
| Authority | Edits code, commits | **No code changes** (the brief forbids it) |
| Output | Engine, app, 30 tests, live site | `docs/CREW_FINDINGS.md` |
| Strength shown | Spec-driven build; absorbed an ASCII to SVG pivot without losing guarantees | Fresh eyes: cross-checked claims against reality |

The split is deliberate. A builder grades its own work generously; an
independent reviewer with a fixed brief and a ban on editing cannot "fix it and
move on", so every gap has to be written down as evidence.

## What Crew did (all visible in `docs/CREW_FINDINGS.md`)

- Read the specs, steering, engine, app, tests, red-team and deploy docs.
- **Re-ran our tests** to verify the "30 passing" claim (it held).
- **Diffed `dist/` against `app/`** to confirm the deployed build matched the
  source (it did; only the intended import-path rewrite differed).
- **Called the live CloudFront URL** (200s on index, main.js, engine) and noticed
  the SPA fallback returns HTML with status 200 for `/favicon.ico`.
- **Wrote and ran its own probes** against the engine to test a suspicion.
- Separated findings into **[confirmed] / [assumed] / [unverified]**, with the
  file or command behind each one, and refused to over-claim (cross-browser
  rendering and PNG export on Safari were reported as *unverified*, not "fine").

## What Crew caught that Kiro's tests had not

| Crew finding | Why our 30 tests missed it | How it was closed |
|---|---|---|
| **hat/horns checkboxes drew nothing.** Only the fog seed changed (24 to 71). | Tests only asserted the *spec* (mutual exclusion in `resolveParts`), never that anything was *drawn*. The exclusion rule passed while the visible result did not exist. | `svg.js` now draws both; `crew_hat_is_drawn`, `crew_horns_is_drawn`, `crew_hat_horns_exclusive_in_svg`. Verified by rendering to PNG and looking at it. |
| **Toggling any part reshuffled all the fog** (root cause of the seed change). | Determinism tests compared same-config runs, not "change one part, expect the rest stable". | Fog seed no longer depends on decoration parts; `crew_parts_do_not_reshuffle_fog`. |
| **Nickname input allowed 40 chars, engine silently cut at 24.** | The two limits lived in different files (HTML vs engine); no test related them. | `maxlength=24` plus a visible note; `crew_nick_maxlength_matches_engine` pins the HTML to `NICK_MAX`. |
| **Purpose radiogroup had no keyboard navigation.** | Accessibility was asserted by presence of ARIA attributes, not by operating it. | Roving tabindex + arrow keys; `crew_purpose_keyboard_nav`, and a real headless-Chrome run (join, notice, recruit, wrap-around, back). |
| **`tasks.md` checkboxes were all unchecked** despite the work being done. | Documentation drift is invisible to tests. | Reconciled; the spec now matches reality. |

Result: 30 tests became 37, and every new test names the finding it closes
(`tests/crew_findings.test.js`).

## Round 2 (2026-11-05, after costumes, scenes, sizes, calendar and presets)

Crew was briefed again with only the changes (`CREW_RESEARCH_BRIEF_R2.md`) and
wrote `CREW_FINDINGS_R2.md`. Verdict: GO with fixes. This time it opened the app
in a real Chrome, which our Node tests never did, and found:

| Crew finding | Why 117 green tests missed it | How it was closed |
|---|---|---|
| `Buffer is not defined`: the calendar button never switched on in a browser | tests run in Node, where `Buffer` exists | `TextEncoder`; a test deletes `globalThis.Buffer` first |
| Seven inline SVGs shared element ids, so every palette looked like the first | the engine output is correct; the page assembled it wrongly | thumbnails as `<img>`; 0 duplicate ids counted in headless Chrome |
| Full-width digits passed the phone-number scan; a place could carry a link | scan tests used ASCII digits only | `\p{Nd}` digits and link patterns, tested |
| `오후 7시` not read; long Korean lines left the frame | tests used English dates and short text | Korean readers, text fit, tested |
| Live site was still the old build | n/a | redeployed and checked (modules return JavaScript, 6 presets, no duplicate ids) |

The same day our own red-team round found two more bugs the same way (a text
field given an object, a `__proto__` format key). The pattern repeats from round
1: green tests are necessary and not sufficient; a second tool looking at the
real thing is what finds the rest. Open after round 2: Safari, Firefox, mobile,
PNG save on Safari, and calendar import into real calendar apps.

## The honest parts (kept in the story on purpose)

- **Kiro's own gap:** hat/horns existed in the spec and the UI but not in the
  renderer. That was our miss; the independent review is what exposed it.
- **Still open after Crew's review (P16):** Safari / Firefox / mobile rendering
  of the SVG filters and the PNG export. (Contrast is now tested against the
  palette colors, and non-Latin nicknames work since R25.) Crew reported these as unverified and we
  have not verified them either.
- **Crew's tool approvals:** Crew asked for permission on every read. We tried
  switching its `approval_mode` to `auto`; it did not remove the prompts on this
  version (0.11.2), so reads were approved by hand and anything that wrote,
  deleted, ran git or deployed was held for a human. That setting change is left
  as is for now and noted here instead of hidden.
- **Crew is a reviewer here, not a second implementation.** We did not rebuild
  the product in Crew, so there is no "same spec, two tools" speed comparison.
  The comparison is about *roles*, and we make no claim beyond that.

## Why this is a good use of both tools

1. **Independence**: different tool, no shared context, fixed brief, read-only.
2. **Evidence over opinion**: every Crew claim carries a file or command; every
   fix carries a test name.
3. **Closed loop**: finding, failing test, fix, render check, redeploy.
4. **Spec stays the source of truth**: tasks P11 to P16 in
   `.kiro/specs/ascii-invite/tasks.md` record the review and its outcomes.

## Suggested beats for the 3-minute video

- 0:00 The product, one invitation.
- Show the Crew pane reading the brief and asking permission (a human stays in
  the loop), then `CREW_FINDINGS.md` with the table.
- Cut to the red then green test run for the hat/horns finding.
- Show the hat and the horns actually rendered.
- End on: "Kiro built it. Kiro Crew checked it. The gap it found is now closed
  by a test."

## Submission mapping (Kiro usage write-up)

- Custom agents: `.kiro/agents/*` (builder-side) plus Crew as an external
  independent reviewer.
- Spec-driven development: requirements to tests; review outcomes recorded as tasks.
- Hooks: pre-commit secret scan guarded every commit of the fixes.
- Property-based testing: unchanged, still green after the fixes.
- Kiro vs Kiro Crew: the roles table above (builder vs independent reviewer).
