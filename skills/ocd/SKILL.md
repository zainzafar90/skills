---
name: ocd
description: >-
  A last-mile perfection pass on a user interface that catches the small things
  that make a product feel unfinished before the user has to point them out.
  Use when the user asks for an ocd, polish, or pixel-perfect pass, or asks
  whether a finished UI feature is really done. Works in any project with a UI
  that runs in a browser.
metadata:
  version: "1.0.0"
---

# OCD pass

Be the designer with an obsessive eye. Look at every screen, find what feels
unfinished, prove it with a screenshot, rank it, and fix it only after the user
approves the list.

Two rules hold the whole pass together:

- **No finding without a screenshot.** Reading code is how you find the cause, not the problem.
- **No fix before the list is approved**, and no fix called done until you have looked at it in a real browser.

## 1. Scope

Read the project's own notes first: `CLAUDE.md`, `DESIGN.md`,
`.knowledge/state/DESIGN.md`, `tasks/lessons.md`, any UAT or backlog doc.
A decision recorded there is settled. Never raise it as a finding.

Then list every surface from the routes, the component tree and the running
app: pages, windows, dialogs, popovers, menus, toasts, empty states, error
states, signed in and signed out, first run. Ask the user only if the project
gives no way to find them or to run the app.

## 2. Capture

Use whatever browser automation the session has (Playwright, a browser pane,
Chrome DevTools). For every surface take:

| Axis | Values |
|---|---|
| Theme | light and dark: the app's own theme switch if it has one, otherwise emulate the OS setting |
| Width | desktop (1440x900) and phone (390x844) |
| State | rest, hover and keyboard focus of each interactive thing, side panels open and closed |

Save outside the repo (scratchpad or temp dir) as
`<surface>--<theme>--<width>[--<state>].png` so a finding can point at its file.
Crop hover and focus shots to the element and its surroundings. If an element
cannot be hovered because something covers it, that is a finding: note it and
move on instead of letting the capture hang.

"Be quick" shortens the report, never the capture.

## 3. Measure

`audit.js` in this folder is plain JavaScript that runs in the page and returns
JSON. Run it on every surface, at both widths.

- **Playwright script:** `await page.evaluate(fs.readFileSync('<this skill folder>/audit.js', 'utf8'))`, using the folder this file was loaded from
- **Evaluate tool or console:** Read the file and pass its text as the expression. If the tool wants a function, wrap it: `() => (<file text>)`.
- **One dialog or window only:** set `window.ocdRoot = '<css selector>'` first.
- The result is also left on `window.__ocdAudit`.

It reports: `textOverflow`, `wrappedLabel`, `offCentreLabel`, `siblingMismatch`,
`fakeAffordance`, `noHoverStyle`, `noFocusStyle`, `outsideViewport`,
`clippedByAncestor`, `smallTarget`, `offRatio`, `overlap`, `endlessAnimation`.

**Its output is a lead, not a verdict.** Open the screenshot for every lead and
drop the ones that look right. It cannot see click handlers added with
`addEventListener`, and it cannot judge shadows, colour, naming, wasted space
or flows. Those need step 4.

`audit-fixture.html` is its self-test: open it in a browser, it prints PASS or
FAIL. Run it after editing `audit.js`.

## 4. Look

Open every screenshot and go through [checklist.md](checklist.md), group by
group: alignment and rhythm; affordance honesty; density and wasted space; text
fit; motion; colour, shadow and theme; consistency of controls; naming and
icons; flows and states; brand presence.

Also use the app: do every toggle twice, run each flow to its end, trigger each
destructive action, switch language if the app is translated.

## 5. Report

One ranked list, worst first. Each finding is exactly this:

```
3. [noticeable] "Sign out" sits left, "Cancel" is centred, in all 6 confirm dialogs.
   Shot: dialog-signout--light--1440.png
   Cause: .alert-btn has no text-align on the second button.
   Fix: centre the label in the shared .alert-btn rule.
```

- First line: what the user sees, in plain words. Cause comes second.
- Severity: `blocks polish`, `noticeable` or `nitpick`.
- Fix: one line.
- The same problem in many places is one finding with a count.
- Within one severity, the most visible surface comes first.
- Show the screenshots, do not describe them: attach or embed them where the session can, give the file paths where it cannot.
- List what is good only if asked. No intro, no summary, no essay.

## 6. Wait

Stop. The user strikes out what they do not want. Fix nothing before that,
unless they already said to fix as you go.

## 7. Fix

- One branch. One small commit per finding.
- The smallest change that works. Reuse existing classes and tokens; put tunable values in CSS variables.
- Follow the project's conventions and run its checks.
- Fix the specific thing that was flagged. Do not revert or remove a whole feature over it, and do not strip anything nobody called wrong.
- After each fix take the same screenshot again and compare. Send before and after for anything visual.
- Anything deferred goes into the project's debt list at that moment.

## 8. Re-run and stop

Capture again what changed, in both themes and both widths, to catch
regressions. Write any new rule the user stated into the project's decision log
or lessons file. Then stop.

## Taste

- Calm and quiet beats loud: subtle over saturated, stillness over motion, no bounce.
- When in doubt, remove rather than add. Never remove what the user did not call wrong.
- Match the platform (macOS feel): consistent radii, real icons, no mixed light and dark on one component.
- Talk to the user short and plain: outcome first, no recap of the journey, a screenshot instead of a paragraph.

## Red flags

| Thought | What to do |
|---|---|
| "The code looks right, so it is fixed" | Take the screenshot and look. |
| "It's obviously wrong, I'll just fix it now" | Put it on the list and wait. |
| "Light mode is fine, dark will be too" | Capture dark. |
| "The audit found nothing, so it's clean" | The audit cannot see taste. Do step 4. |
| "The audit flagged it, so it's a finding" | Look at the screenshot first. |
| "This was decided before but I'd do it differently" | Settled. Leave it out. |
| "While I'm here I'll tidy this too" | One finding, one commit. New things go on the list. |
