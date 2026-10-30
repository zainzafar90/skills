# OCD checklist

Every item is a miss a user had to point out by hand. Go through each group for
every screenshot. `audit:` names the `audit.js` check that gives a lead for it;
items without one can only be caught by looking.

## 1. Alignment and rhythm

- **Labels sit the same way in every button.** In a two-button dialog both labels are centred, not one centred and one left. Check every dialog, not one. `audit: offCentreLabel`
- **Sibling controls match.** Same height, font size, weight and radius for buttons that sit together. `audit: siblingMismatch`
- **Nothing overlaps.** Floating pieces (islands, toasts, help buttons, badges) do not cover each other, especially at narrow widths. `audit: overlap`
- **Nothing is cut off.** A popover is not clipped by its parent window; content is not hidden when a side panel is open. `audit: clippedByAncestor, outsideViewport`

## 2. Affordance honesty

- **No hover or pointer on things that do nothing.** A greeting line, a heading, a static row. `audit: fakeAffordance`
- **Things that look actionable act.** A row of app icons, a chip, a card with a chevron: give it the obvious action, or make it look static.
- **Clickable things answer.** Every clickable element has a hover hint and a visible keyboard focus. `audit: noHoverStyle, noFocusStyle`
- **Targets are big enough.** Nothing clickable under 24px; 44px at phone width. `audit: smallTarget`
- **A pill where a button belongs.** An underlined text link is for going somewhere in text, not for an action in a card.

## 3. Density and wasted space

- **A header that fits on one row is on one row.** No vertical stack of title, subtitle and action when there is width for a single line.
- **Empty areas carry an invitation.** A blank part of a card is a lost chance: a hint, the next action, an empty state with one button.
- **Related things share a row.** A secret token and its name, a value and its unit, an item and its delete: split across rows they read as two unrelated things.
- **A fresh item can be removed where it appears.** No hunting for delete elsewhere.

## 4. Text fit

- **One line with an ellipsis in a tight slot.** Text must not wrap onto two or three lines and squash the icon next to it. Icons keep their size (`flex-shrink: 0`). A slow marquee only where the full text really helps. `audit: textOverflow, wrappedLabel, offRatio`
- **Translations fit.** Switch to the longest language the project ships (often German or Russian) and one right-to-left or CJK language. Nothing clipped, nothing overflowing. `audit: textOverflow`
- **The font renders every language well.** No ugly fallback face for a script the main font lacks.

## 5. Motion

- **No movement on hover.** No fan-out, lift, scale or slide when the mouse passes by; it feels jittery. A faint colour or opacity change instead.
- **No bounce.** Short, plain easing.
- **A spinner means loading and nothing else.** A waiting, pending or expired state gets a still mark (dashed circle, hourglass). `audit: endlessAnimation`
- **No jump while loading.** Fonts swap without a jerk, nothing flickers, and content does not push the page down.

## 6. Colour, shadow and theme

- **Shadows and halos are subtle.** No dark patches, no heavy glow. Prefer what looks calm over contrast by numbers.
- **Dark surfaces match the operating system.** A dark window must not read lighter or tinted next to the system's own windows.
- **Primary button is black on light and white on dark.**
- **Both themes checked, always.** Toggle light and dark on every surface. A card never mixes dark and light components.
- **Generated visuals stay quiet.** A default avatar or placeholder: muted tones, a faint pattern, following the theme. Not the ugly default, not a loud one either.

## 7. Consistency of controls

- **Destructive and secondary actions look different from primary ones.** In a list of Connect buttons, Disconnect is quiet or red, not a twin.
- **Same job, same control.** The same action looks and sits the same on every screen.
- **Match the platform.** Consistent radii, real icons, native-feeling windows and menus.

## 8. Naming and icons

- **The name says what the thing is.** "Notes", not "Quick note". Same name everywhere it appears.
- **The icon matches the name.** A pen for notes.
- **Defaults help.** If labels make the UI clearer, they are on by default. Check every default against a first-time user.

## 9. Flows and states

- **Interactions do not get stuck.** Do every toggle twice: double-click to maximise then again to restore, open/close, expand/collapse.
- **Destructive actions ask first.** Sign out, delete, disconnect, reset.
- **A flow waits for what it started.** Onboarding does not advance while the sign-in it opened is still open.
- **Every panel offers the obvious next step.** A signed-out card has a Sign in button. "Sign in again" is a real action, not a dead button next to a message.
- **Every state is visited.** Empty, loading, error, signed out, first run, full list, long names.
- **Errors speak human.** No raw API message, status code, or stack trace on screen.
- **Offline is calm.** An offline app shows what it has saved, not a scary error state.

## 10. Brand presence

- **The product's own logo is where a user first lands.** Onboarding, sign-in, the signed-out profile card, the empty home.
- **One current mark everywhere.** Favicon, app icons, extension icons, and share image all use the latest logo.

## 11. Copy

- **It sounds like a person.** No filler phrases or stacked buzzwords that read as AI.
- **Em dashes in moderation, always spaced.** `word — word`, never `word—word`. More than one in a paragraph is too many.

## 12. Public pages

Landing, marketing, docs, and share links. Pages behind a login skip this group. Leads come from `audit-page.sh`.

- **It opens logged out** and is not marked `noindex`. `audit: blocked, noindex`
- **The share preview is complete.** `og:title`, `og:description`, and `og:image`, with a full public image URL that loads. `audit: missingTag, ogImage`
- **The share image is designed for this page.** Open it and look: on brand, current, not a bare default.
- **Canonical and favicon are set.** `audit: missingTag`

## 13. Speed

With the app running, always measure. Use a production build where you can, and say so when it is a dev server. No running app: "Not run", never a guess.

- **Load times stay in the good range.** LCP 2.5s or less, CLS 0.1 or less, INP 200ms or less, TTFB 800ms or less. Use Lighthouse or the browser tool's trace. `audit: slowTtfb`
- **Images are sized and modern.** AVIF or WebP, and lazy below the fold.
- **No wasteful calls.** The network log shows no repeated request and no oversized response on one load.

## Proof

- **Every finding has a screenshot,** or command output for groups 12 and 13. No claim from reading code alone.
- **Every fix is looked at in a real browser.** The same screenshot, taken again, compared.
