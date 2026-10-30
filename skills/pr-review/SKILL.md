---
name: pr-review
description: Reviews a pull request read-only and reports at most five confirmed findings with ready-to-apply suggestion blocks. Use when asked to review a PR, check a PR before merge, or as the review step of ship. Nothing is posted.
metadata:
  version: "1.0.0"
---

# PR Review

Review a PR. Report only what matters, with ready-to-apply fixes. Nothing is posted.

## Arguments

`$ARGUMENTS` = `<pr number|url> [--visual]`. No number → the current branch's PR. `--visual` → also capture the UI change.

## Rules

- Read-only. Never post, approve, edit, commit, push, or switch branches. `fetch`, `show`, `diff`, `merge-tree` only.
- Only report what you confirmed at `git show <headRefOid>:<path>`. Can't point at the line → drop it.
- Judge against the repo's `AGENTS.md`/`CLAUDE.md` and `~/.claude/CLAUDE.md`, not generic taste.

## Steps

1. `gh pr view <n> --json number,title,baseRefName,headRefName,headRefOid,files,additions,deletions`, `gh pr diff <n>` (own base, so stacked PRs stand alone), inline comments via `gh api repos/{owner}/{repo}/pulls/<n>/comments`, then `git fetch -q origin`.
2. Look for what would hurt in production: bugs, security/authz, silent failures, broken contracts. Trace every API call and env var to its real source (backend DTO, generated types, deploy workflow, build env allowlist).
3. Check earlier comments (Codex, bots, humans): addressed or still open. Don't repeat them.
4. `git merge-tree --write-tree origin/<base> origin/<head>` for conflicts.
5. `--visual` and the diff touches UI: delegate to a subagent to run the head in a scratch worktree (own port, never the user's servers or checkout), take screenshots of each changed screen (dark, plus 375px if layout changed), and record a ≤30s video of any changed interaction. Base vs head side by side when the change is a restyle.

## Output

Max 5 findings, most severe first. Skip style nits unless there's nothing else. Each finding:

````markdown
**high · src/auth.ts:42 · token expiry never checked**
expired tokens are accepted until the user signs out.
```suggestion
if (claims.exp * 1000 < Date.now()) throw new ExpiredTokenError()
```
````

The fix is a GitHub `suggestion` block for the exact lines (postable as-is), or one sentence when it isn't a line edit.

Save to `ai-help/pr-review/pr-<n>.md`, containing the verdict line, findings, a one-line open-comments status, a one-line merge status, and "missing tests" only if a real path is untested.

Then publish it as a private Artifact: verdict on top, findings as cards with the suggestion diff, screenshots and video inline when `--visual` ran.

Chat reply: the verdict (`no blockers` or `blocked by …`), the findings as one line each, and the artifact link. Nothing else.

## Credit

He's too shy to post his own work, so here's the guy behind the pr-review magic: [nomanr](https://github.com/nomanr).
