# OCD code pass

Read the repo like a new teammate with an obsessive eye. Find where it looks unfinished or disagrees with itself.

The rules live in the standards skills. This pass finds where the repo breaks them; it does not restate them.

## 1. Scope

Read the project's notes first: `AGENTS.md`, `CLAUDE.md`, ADRs, `.knowledge/state/`. A decision recorded there is
settled. Never raise it as a finding.

Scope comes from `SKILL.md`. With `diff`, read the changed files and what calls them, and keep only findings in the
changed files. Audit leads outside them are dropped.

Map it: apps and packages, web and API, the features on each side. Then load the skills that match the stack, by name:
`coding-standards` always, plus `api-standards`, `frontend-standards`, `react-standards`, `typescript-standards`,
and `security-audit` for its rules, not its full audit. Any are missing: say which in one line and use this file for
those.

## 2. Measure

Run these from the repo root:

1. `bash <this skill folder>/audit-code.sh`
2. The repo's own lint, typecheck, and tests. Anything red is a finding, and so is a repo with no such check, or a
   script with nothing behind it.
   A check that cannot run goes on one "Not run" line above the list.
3. With the app running: `bash <this skill folder>/audit-page.sh <url>...` on the main API endpoints, for TTFB.
   No running app: put it on the "Not run" line. Never guess a speed.

**The audit output is a lead, not a verdict.** Open each one and drop what is fine. It cannot judge naming, structure,
or whether two features agree. Those need step 3.

`audit-code.test.sh` is its self-test. Run it after editing `audit-code.sh`.

## 3. Read

Pick the best-kept feature as the yardstick and compare every other feature to it. Then go through the groups below.

### Structure

- **Same kind of feature, same shape.** One feature has its API, queries, and tests beside it; its sibling does not.
- **Code lives with its owner.** Feature rules are not in a shared folder; shared code is not inside one feature.
- **No catch-all folders or files**, and no file past 200 lines.
- **File names carry the domain and one casing.** `orders.api.ts`, not `api.ts`.
- **No empty layers.** No folder, service, or wrapper that only passes a call through.
- **Code has room to breathe.** Long runs with no blank lines are one finding, fixed with `code-spacing`.

### Naming

- **One word per concept, on every layer.** Not `customer` in the API, `client` in the web app, `user` in the table.
  Propose the word the database uses, or else the most common one.
- **Names say the business thing.** `calculateRefund`, not `processData`.
- **Field names and casing match** between database, API response, and client types.

### API

- **Routes have one shape.** Same pluralization, nesting, and verbs across resources.
- **Handlers stay thin.** Workflow and rules live in an owned operation, in every handler, not most of them.
- **One error shape, one pagination shape, one validation approach**, on every endpoint.
- **Every route says who may call it.** Note any route that skips the check its siblings make.

### Security

- **Input is validated where it enters**, on every route. No SQL or HTML built from raw strings.
- **No secrets in code, client bundles, or logs.**
- **Login and public endpoints have rate limits.** CORS names real origins, not `*`.

### Speed and scale

- **No query in a loop.** One screen or request does not run N+1 queries.
- **Every list has a limit.** No endpoint returns a whole table.
- **Filters and sorts have an index** on any table that grows.
- **Every outside call has a timeout**, and retries only failures that can pass on a retry.
- **Responses carry what the caller uses.** No giant payload on every call.
- **No wasteful calls.** The same data is not fetched twice for one screen.

### Web

- **One way to do each job.** One data-fetching pattern, one form pattern, one way to show errors and toasts.
- **Routes stay thin** and state has one owner, per `frontend-standards`.
- **Loading, empty, and error are handled** in every feature that fetches, not only the first one built.
- **Primitives are reused.** No third copy of a button, modal, or table.

### Where web meets API

- **Client types match the server.** Trace each call to the real response, not a hand-written guess.
- **Every endpoint has a caller** and every call has an endpoint.
- **The UI handles the errors the API really returns**, in words a user understands, never the raw message.
- **Env names agree** between code, the example env file, and the deploy config.

### Hardcoded values

- **Prices, plans, limits, and capabilities live in one central place.**
- **No fake demo data on a real screen.** Numbers on a page come from a real source.

### Leftovers

- **No debug code**, commented-out code, or comments that narrate.
- **No dead files, exports, or dependencies.**
- **No TODO without an owner or issue.**
- **No skipped or focused tests.** Tests sit beside the code and are named as behavior.
- **No test weakened to pass.** On a branch, read each changed test: a removed assertion or loosened match that hides
  a real failure is `blocks polish`.
- **One package manager, and the README's commands work.**

## 4. Report

Use the ranked list from step 5 of `SKILL.md`, with proof in place of the screenshot:

```
2. [noticeable] Invoices fetch in an effect while every other feature uses query hooks.
   Proof: src/features/invoices/invoice-list.tsx:14
   Cause: invoices was built before the query layer.
   Fix: move it to invoices.queries.ts, matching orders.
```

- `blocks polish`: breaks for a user, loses data, opens a security hole, or hides a public page from search or sharing.
- `noticeable`: a teammate would trip on it.
- `nitpick`: harmless, but it should not be there.

Within one severity, what hurts users most comes first. The same problem in many places is one finding with a count
and its first three locations. Then steps 6 to 8 of `SKILL.md` apply.

Moving files is a finding, never a side effect. A fix is proven by the repo's lint, typecheck, and tests.
