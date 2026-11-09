---
inclusion: fileMatch
fileMatchPattern: "docs/**/*.md"
---
# Steering: Documentation honesty

> Why: the submission is judged on what the repo can show. A claim that cannot be checked costs more than a gap that is admitted.
> Effect: when docs are in context, the agent writes dated, checkable statements and separates "checked" from "not checked".
> Moved here on 2026-11-09 from the stated rules in `docs/KIRO_EVIDENCE.md` ("no claim that cannot be checked against the repo") and `docs/KIRO_WRITEUP.md` ("where we did not use or did not verify something, we say so"). Nothing new was added.

- Every number comes from a command that was run (say which) or from a file that can be opened.
- Evidence entries carry a date. Say what was and was not verified, and name what is still open.
- Do not claim a Kiro feature was used unless an artifact in the repo shows it.
- No secrets, account ids, keys or tokens; no local file paths in external-facing text.
