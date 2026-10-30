---
name: lean
description: Cuts the current change down to the least code that works, strips comments that narrate the code, and applies the fixes. Use when asked to simplify, clean up, de-slop, or ponytail a change, or as the cleanup step before committing. Quality only; it does not hunt for bugs.
metadata:
  version: "1.0.0"
---

# Lean

Make the change smaller, plainer, and quieter. Behavior stays the same.

## 1. Scope

- Default: uncommitted work, `git diff HEAD` plus untracked files from `git status`.
- On a branch with nothing uncommitted: `git diff <base>...HEAD`.
- The user names files or a commit: use those.

Touch only changed code and what it directly calls. Anything else that looks bad gets one line under "Noticed".

## 2. Cut, hunk by hunk

Stop at the first rung that holds:

1. **Does it need to exist?** Unused parameter, dead branch, option nobody passes, code "for later": delete.
2. **Already in the repo?** Search for an existing helper, type, or hook before keeping a new one. Reuse it,
   unless it gives a different result for some input; then keep the code and list it under "Noticed".
3. **Standard library or platform covers it?** Use that. CSS over JS, a native input over a widget.
4. **An installed dependency covers it?** Use it. Never add a new one.
5. **Can it be shorter and still plain?** Inline a one-use wrapper or variable, flatten nesting with an early return, merge duplicate branches.

Also fix obvious waste: work repeated inside a loop, the same request fired twice, a value stored when it can be derived.

## 3. Comments

House rule: a comment stays only if removing it hides a constraint. It is `/* */`, 8 words or fewer, naming the constraint.

- Delete: comments that say what the next line does, repeat a name or type, section banners, "Added X" or "Now we...", commented-out code, docblocks that restate the signature.
- Keep: TODOs with an owner or issue, license headers, lint and compiler directives, `ponytail:` notes, a why that the code cannot say.
- Rewrite kept ones to `/* */`, 8 words or fewer. Languages without block comments use their own syntax with the same limit.

The repo's `AGENTS.md` or `CLAUDE.md` overrides this section when it says otherwise.

## 4. Never cut

Input validation on data from users, the network, storage, or untyped callers; error handling that prevents silent failure or data loss, security checks, accessibility, public behavior, and anything the user asked for.

## 5. Apply and prove

1. List every change first: `file:line · cut or replace · with what`.
2. Apply them all.
3. Run the repo's lint, typecheck, and tests for the touched area. A change that breaks one gets reverted, not argued.
   A check that cannot run is reported as not run, never as passing.
4. Report: line counts before and after (`git add -N` untracked files first so `git diff --stat` sees them), one line
   per change, what was left and why, and "Noticed" items. Nothing is committed; the `commit` skill does that.

Bugs are out of scope. If you see one, put it under "Noticed" and leave it.
