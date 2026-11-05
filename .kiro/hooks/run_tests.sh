#!/usr/bin/env bash
# On-save hook: run the engine tests when an engine or test file changes.
# Why: the "model says, code decides" guarantees are only real if tests stay green.
# Effect: a broken determinism/validation rule is caught at save time, not at demo time.
set -u
root="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$root" || exit 1
echo "running: node --test"
node --test
