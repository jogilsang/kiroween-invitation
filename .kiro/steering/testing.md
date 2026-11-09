---
inclusion: fileMatch
fileMatchPattern: "tests/**/*.js"
---
# Steering: Testing

> Why: "every requirement names its test" only holds if tests are named and shaped the same way.
> Effect: when test files are in context, the agent writes tests that match the repo-wide rule and trace to a requirement.
> Moved here on 2026-11-09 from `principles.md`; nothing new was added except the naming line, which restates how the spec already names tests.

- Per feature: 2 happy paths, 2 edge or negative paths, 1 error path.
- Behaviour tests, not implementation tests. Each test independent of execution order.
- Write the failing test first, make it pass, then stop (one task at a time).
- Name the test as the requirement names it (`test_...` in requirements.md) and mention the R number in a comment, so the trace can be checked by a script.
- Property-based tests use `fast-check` (dev dependency only); say the R numbers they validate.
- A browser-only defect (R45, R46) cannot be proven in Node; say so in the requirement ("test or browser check") instead of inventing a Node test.
