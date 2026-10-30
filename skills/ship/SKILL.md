---
name: ship
description: Takes a finished branch through review, UI checks, cleanup, commits, and a PR description in one run. Use when the user says ship it, wrap up the branch, or get this ready for a PR.
disable-model-invocation: true
metadata:
  version: "1.0.0"
---

# Ship

Each step is its own skill. Load it with the Skill tool by name and follow it; do not restate its rules here.

| Step | Skill | Skip when |
|---|---|---|
| 1. Review | `pr-review` | the user skips it |
| 2. Prove the UI | `browser-verify`, then `ocd` | the change touches no UI |
| 3. Clean up | `lean` | the user skips it |
| 4. Commit | `commit` | nothing is uncommitted |
| 5. Describe | `pr-description`, with `--visual` when the UI changed | the user skips it |

The user can skip any step by name ("ship, skip ocd"). A skill that is not installed: say so in one line and go on.

## Rules

- Review comes first so cleanup never polishes code that is about to change. No PR yet: run the review checks on
  `git diff <base>...HEAD` and skip the GitHub-only parts.
- A high-severity finding stops the run. Show it and ask whether to fix it, then continue.
- A failed browser check gets fixed and rerun before cleanup.
- Ask once before pushing or opening or updating the PR, showing the branch and PR title. No yes, no push.

## Report

One line per step: done, skipped (why), or failed (why). Then the PR link, or "not pushed".
