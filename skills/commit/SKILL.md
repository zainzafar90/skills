---
name: commit
description: Makes one-line commits on a human-named branch with no Co-Authored-By or AI attribution, and strips attribution from commits not yet pushed. Use when asked to commit, push, name a branch, or clean up commit messages. Commits and pushes only when asked.
metadata:
  version: "1.0.0"
---

# Commit

## Rules

- Commit only when the user asked in this conversation. Push only when they asked to push. One is not the other.
- One line per commit: imperative, under 72 characters, no trailing period, no body.
- Follow the repo's prefix style if `git log --oneline -20` shows one (`feat:`, `ABC-123`). Otherwise none.
- No `Co-Authored-By`, no "Generated with", no robot emoji, no AI attribution of any kind. The same goes for PR
  bodies.
- Never `--no-verify`. Never rewrite pushed commits or force-push without an explicit yes.

## Branch

On `main`, `master`, `develop`, or a generated name (`claude/…`, `worktree-…`, random words), name the branch for
the change: lowercase kebab-case, 2 to 5 words, like `checkout-webhook-retry`. Use the repo's prefix if its branches
have one. Not pushed yet: `git branch -m <name>`. Otherwise `git switch -c <name>`.

## Steps

1. Read `git status`, `git diff --staged`, and `git diff`.
2. Stage only files that belong to this change, by name. Never `git add -A` blind. A secret (`.env`, keys) in the
   change: stop and say so.
3. Unrelated changes go in separate commits.
4. `git commit -m "<line>"` with a single `-m` and nothing appended.
5. Check `git log -1 --format=%b` prints nothing.

## Strip attribution from unpushed commits

1. Find the start: `@{u}`, or with no upstream `git merge-base HEAD origin/HEAD` (or `main`).
2. List them: `git log <start>..HEAD --format='%h %s%n%b'`.
3. Any commit with a body: with a clean tree (stash first), run
   `git rebase --exec 'git commit --amend -q -m "$(git log -1 --format=%s)"' <start>`.
   This drops the whole body, attribution included, which matches the one-line rule.
4. Run step 2 again. Every commit shows a subject only.

Commits already pushed: say which, and rewrite them only after the user says yes to a force push.

Claude Code adds attribution from its own settings. If it keeps coming back, say once that the `attribution`
setting in `~/.claude/settings.json` turns it off. Never change settings without a yes.
