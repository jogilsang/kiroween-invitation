How Kiro built Kiroween Invitation (and where it did not)

We treated Kiro like a small studio, not a chatbot. The spec was the script, steering was the house rules, hooks were the night watchman, custom agents were the roles, property-based tests were the stress test, and Kiro Crew was the studio next door that checked our work. The best moment of the build was not a feature. It was the day a second Kiro tool opened our app in a real browser and found two bugs that 117 passing tests could not see.

Everything below can be checked in this repository (the .kiro folder, the tests, the commit log). Where we did not use or did not verify something, we say so.

1. Kiro IDE, CLI, Web, Crew: what we used and how they differed
We used Kiro CLI and Kiro Crew. We did not use Kiro IDE or Kiro Web, so we cannot compare them from experience.
- Kiro CLI with a custom conductor agent was the builder. One session held the plan, wrote the code test-first and deployed it.
- Kiro Crew was the reviewer. It never saw the build: it got a written brief and one rule, "investigate and propose, change nothing", and wrote its answer to a file. It asked permission before every read, so we could approve reads and stop anything that writes.
The difference that mattered: the builder is biased toward what it just wrote; a different tool with no memory of the build is not.

2. Custom agents
Five agent files in .kiro/agents: kiroween (conductor: app, deploy, docs, integration), svg-engine, art-tuner, invite-logic and red-team. Each has a file scope and one hard rule in its prompt, for example "write the failing test first", "look at a real render before reporting done", and "red-team may never edit engine or app code".
Honest note: the conductor did the building in one CLI session. We used the four scoped roles as boundaries and review lenses, not as four parallel sessions, and we rewrote the engine and art agents after the pivot from ASCII to SVG so they match the code. A role played by the same session is not independent, which is exactly why we brought in Crew for real independent verification.

3. Agent hooks
- pre-commit secret scan, run on every commit through a real git hook: blocks AWS keys, 12-digit account ids and any .omc path. A public repo that will be judged cannot take a leak. We tested it with planted inputs. The test caught two bugs in its own first draft (it scanned the whole monorepo, and it captured the git prefix after a cd). It then blocked its own first commit because its patterns appear in its source, so we allowlisted three files by path and wrote the trade-off down instead of weakening the patterns.
- test-on-save and spec-change-reminder: written in Kiro's hook format, plus Kiro CLI format twins added at the end. We have not yet seen them fire by themselves in the CLI session; we ran the same script by hand. We do not claim more than that.

4. Spec-driven development, compared with vibe coding
.kiro/specs/kiroween-invitation holds requirements, design and tasks. There are 51 requirements in EARS form, with the failure paths written first: "IF the year is not an integer from 2000 to 2100, THE SYSTEM SHALL reject it and change no state." Every requirement names its test, and tasks are sized so one task is one verifiable change.
What changed compared with vibe coding:
- The pivot. Halfway through, the ASCII renderer could not give the grotesque, glowing look we wanted, so we switched to SVG. 18 of the 21 requirements and their tests carried over untouched; only the renderer-specific ones were replaced, and the change is in the spec's changelog. We did not have to rediscover our own rules.
- Every later feature (costumes, scenes, export sizes, calendar file, presets) started as a numbered requirement and a failing test, then code, then a look at a real render.
- The spec gave the independent reviewer something to check against.
The cost is real: more writing up front. It paid for itself the day we changed direction.

5. Steering docs
Three documents (product, tech, principles). Each opens with a one-line "why" and the effect it should have on Kiro's answers. The one that changed the most code was principles: "model says, code decides; every limit, rejection and fallback is a code constant with a test proving it." From then on years, name rules, allow-lists and layer order came back as constants with tests, not as prose. tech.md ("no framework, no bundler, no server") stopped Kiro reaching for dependencies; when we wanted shareable links we used the URL itself instead of a backend. product.md named one person and one journey, and we used it to say no to features.

6. MCP
We used the chrome-devtools MCP so Kiro could look at the real thing: render the app in Chrome, read console errors, count duplicate element ids, open the deployed site. Kiro Crew used the same MCP to find the two bugs above, and Kiro used it to fill in this very Devpost form. Without MCP we would have verified by reading code; with it, "open it in a browser and look" became a normal step instead of an afterthought.

7. Property-based testing
We used fast-check: 10 properties, about 3,050 generated cases. The ones that matter most: the same settings always give a byte-identical SVG; arbitrary junk never throws and always becomes a safe in-range configuration; a share link encodes and decodes to the same configuration; the SVG is always well-formed; a remix is always valid; a calendar entry never contains an injected line.
Honest result: PBT did not find a new crash. The engine was already defensive because the spec forced the negative paths first. Its value was as a tripwire: it stayed green through the ASCII to SVG pivot and every feature added after it. And its limit taught us the most: PBT proved the engine, but it could not prove the browser. The Node-only Buffer bug that killed the calendar button in Chrome was invisible to every Node test, property-based or not. Crew found it.

8. Kiro powers
We did not use Kiro powers. The AWS side (private S3, CloudFront with origin access control, an ACM certificate and the DNS records) is one CloudFormation template, checked with cfn-lint.

What we would tell another builder
Write the failure cases into the spec first. Give the reviewer a different tool, not a different prompt. And look at the real browser early, because green tests only prove what you thought to test.
