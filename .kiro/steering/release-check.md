---
inclusion: manual
---
# Steering: Release check (use by typing #release-check)

> Why: the public repo and the submission cannot be fixed after the fact. This is the routine to run before any publish step.
> Effect: the agent runs the mechanical checks and then stops for the owner's decision.
> Written on 2026-11-09 from `docs/audit_submission.sh`, `.kiro/hooks/secret_scan.sh` and `docs/PRE_SUBMIT.md`; nothing new was added.

1. Run `node --test` and report the test count and failures as printed.
2. Run `bash docs/audit_submission.sh` and report each FAIL (a live-URL check may be skipped without network; say so).
3. Run `bash .kiro/hooks/secret_scan.sh` and confirm no `.omc/` path, key, token or account id is tracked.
4. Confirm `.kiro/` is not ignored and `LICENSE` is at the repo root.
5. Stop. Making the repo public, pushing, deploying, uploading the video or posting is the owner's decision; list what is ready and wait.
