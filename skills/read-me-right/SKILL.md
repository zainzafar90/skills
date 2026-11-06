---
name: read-me-right
description: Writes or rewrites a repo's README so it looks crafted and reads fast: a centred logo, name and one-line pitch with a hero screenshot, a short path to first use, the main jobs step by step with the app's exact labels, and everything else folded into collapsible sections. Every claim is checked against the code. Use whenever someone asks to write, rewrite, polish, trim or "make beautiful" a README, wants it to look like a well-made open-source project, or says the README is outdated, ugly, too long, too technical, or written for agents. Not for API reference docs, CLAUDE.md, AGENTS.md, or changelogs.
metadata:
  version: "2.0.0"
---

# Read me right

A good README has two readers. The first gives it ten seconds: they should see what the thing is, what it looks
like, and how to start, without scrolling far. The second comes back later with one problem: they should find the
answer without wading through everything else. Write for both: **short on the page, complete underneath.**

The look to aim for is a well-made open-source project: a centred logo, the name, one line that says what it is,
a hero image, then calm, scannable sections. Not a wall of tables. Not a manual.

## 1. Learn the project before writing a word

Every sentence must be traceable to something real.

- The existing README, `CLAUDE.md` / `AGENTS.md`, `docs/`. Decisions recorded there are settled.
- The manifest and scripts (`package.json`, `pyproject.toml`, `Makefile`, `Cargo.toml`): name, version, real
  commands, the package manager actually used.
- Config people feel: permissions, supported platforms, env vars, defaults.
- The UI: exact button labels and messages, grepped from the source, so the README quotes them exactly.
- Brand assets: a logo or icon (`public/`, `assets/`, `icons/`, favicon, app icon). Use the real one; never draw a
  new one.
- Release state: published or not. Say it honestly.

Keep a list of gaps you find (missing release process, a broken script, a risky default) for the hand-over, not
for the README.

## 2. The header is the product's face

```html
<p align="center">
  <img src="path/to/logo.png" width="80" height="80" alt="<Name> logo">
</p>

<h1 align="center"><Name></h1>

<p align="center">One plain sentence: what it is and who it's for.</p>

<p align="center">
  <img src="docs/screenshots/hero.png" width="720" alt="<what the screenshot shows>">
</p>
```

- Logo 64 to 96 px. No logo in the repo: leave it out, don't invent one.
- One sentence of pitch. If you need two, the first one isn't sharp enough yet.
- One hero image, or two side by side when the product has two faces (`width` about 300 each, a `&nbsp;` gap).
  Optionally one small caption line under it in `<sub>`.
- No badges unless the project already publishes something a badge reports (CI, a registry version).

## 3. Show it

- Capture the running app with whatever browser automation the session has: realistic data, default theme, no
  debug overlays, no broken images, at 2× device scale and at the size it's really used.
- Store as `docs/screenshots/<what-it-shows>.png`, relative paths, alt text that says what's in the picture.
- Budget: the hero, plus at most one per main job. More screenshots make a README feel like a manual.
- Open each one and look at it before using it.
- No UI? Show the output: a short terminal session, a sample file, a before/after.
- If the app runs on live data, look but don't touch. Don't click any button that writes (Save, Publish, Delete,
  Remove, Submit), not even to open the dialog behind it: describe that step from the code instead.

## 4. The page, in order

Keep the visible page short: a reader should reach the end of the always-open part in about three minutes.
About 80 to 140 non-blank lines outside collapsed sections is the right size; the checker reports it.

1. **Header** (above).
2. **What it does**: three to six short bullets, each starting with what the user gets. A table only if it is
   genuinely two-dimensional.
3. **Quick start**: the shortest path from nothing to first success, five steps or fewer. Release download or
   store first, from source second.
4. **The main jobs**, two or three at most, each its own section named after the job ("Paste a SIM search", not
   "SIM module"). Numbered steps, exact labels in **bold**, keys as `<kbd>⌘</kbd> <kbd>V</kbd>`. Rarer jobs go in a
   collapsed section or a `docs/` page.
5. **Optional depth, collapsed**: each of these that applies goes in its own `<details>` block, so it costs one
   line on the page until someone needs it.

   ```html
   <details>
   <summary><b>Troubleshooting</b></summary>

   | You see | What to do |
   |---|---|
   | ... | ... |

   </details>
   ```

   Good candidates: troubleshooting (keyed by the exact message the user sees), data format or config reference,
   supported platforms, permissions and privacy, how it works under the hood. Leave a blank line after
   `<summary>` and before `</details>` so the Markdown inside renders.
6. **Development**: prerequisites, three to five commands, and a link to `CONTRIBUTING.md` or a collapsed section
   for the project layout and how to extend it.
7. **Release** (only if there is a real process): a few numbered steps, including every place the version lives.

Skip anything that would be empty. Never pad. If one topic needs more than a screen even collapsed, move it to
`docs/<topic>.md` and link it.

## 5. Voice

- Plain, warm, exact. Short sentences. Second person.
- No hype ("blazing", "seamless", "powerful"), no emoji, no "coming soon".
- Bold for UI labels and for the single thing in a section that must not be missed.
- One callout (`> **Note:**` or a GitHub `> [!WARNING]`) per real hazard, no more.
- Avoid em dashes: use a colon, a comma, or a new sentence.
- Prefer a sentence to a table when there are fewer than three rows.

## 6. Verify

```bash
python3 <this skill folder>/scripts/check_readme.py README.md
```

It reports broken anchors, missing image or file paths, undefined `npm`/`pnpm`/`yarn` scripts and `make`
targets, em dashes, and how long the always-visible part is. Fix every problem it reports, then:

- Re-read every UI label and message against the source.
- Run the cheap install and development commands.
- Read the first screen as a stranger: do you know what this is, what it looks like, and how to start?

## 7. Scope

Change the README and the images it uses. Touch another file only to fix a link your rewrite would break, and say
so in the hand-over. Bugs you notice in the project go in the hand-over, not into the code.

## 8. Hand over

A few lines to the user: what the README covers, what you verified, what you could not, and the gaps you found in
the project. Don't commit or push unless asked.
