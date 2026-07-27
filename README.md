# Token Contrast Auditor

A browser-based tool for design system owners and product designers to check
whether their colour tokens actually work together. Paste tokens as JSON,
CSS custom properties, or a bare hex list, and it tells you which
foreground/background pairs meet WCAG contrast requirements, which are
borderline, and which fail — with a one-click suggested fix for the ones
that don't.

Everything runs client-side. Nothing you paste is sent anywhere or saved
between visits.

## What it does

Design tokens are governed individually, but accessibility is a property of
a *pair*: a foreground colour rendered against a background colour. A team
can have a perfectly reasonable "error red" and a perfectly reasonable
"warning surface" token and still ship a combination that fails contrast,
because nobody checked that specific pair.

This tool closes that gap for an existing token set:

1. **Paste tokens.** Flat or nested JSON, `:root { --name: value; }` CSS,
   or a plain list of hex values, one per line, optionally named.
2. **Review inferred roles.** Every token is guessed as `text`,
   `background`, or `both` (see [Role inference](#role-inference-is-a-guess-not-a-lookup)
   below) and shown as an editable chip — flip any assignment before auditing.
3. **Audit.** The worst-offending text token is auto-selected. For each
   token you can see, at a glance, every background it's plausibly rendered
   against, the real computed ratio, the required ratio, and a four-state
   verdict (see below).
4. **Fix.** For failing or near-miss pairs, the tool proposes the nearest
   passing colour by adjusting only lightness in OKLCH, so the corrected
   colour still looks like the one you started with.
5. **Export.** Copy the original token structure back out with failing
   values replaced, or export the full pair matrix as CSV.

## WCAG rules implemented

Contrast is computed with the real WCAG 2.x relative luminance formula —
there is no lookup table and no shortcut:

```
L = 0.2126·R + 0.7152·G + 0.0722·B   (R, G, B are linearised sRGB channels)
ratio = (L_lighter + 0.05) / (L_darker + 0.05)
```

This gives a ratio between 1:1 (identical colours) and 21:1 (pure black on
pure white). Ratios are rounded to one decimal place for display, but the
pass/fail decision is always made against the unrounded value — a ratio of
4.49 displays as "4.5" but is still evaluated (and fails) at 4.49, never at
the rounded figure.

Three contexts, each with its own required ratio:

| Context | AA | AAA |
|---|---|---|
| Body text | 4.5:1 | 7:1 |
| Large text (≥24px regular, ≥18.7px bold) | 3:1 | 4.5:1 |
| UI component / graphical object (icons, borders, focus indicators) | 3:1 | n/a |

Every pair is placed into one of four states, not just pass/fail:

- **Pass** — meets the required ratio for the selected context and level.
- **Large text only** — fails the body-text threshold but clears the
  large-text threshold for the selected level. A real, actionable state:
  usable in headings, not in paragraph copy.
- **Near miss** — fails by less than 0.5. Likely fixable with a small
  lightness nudge without changing the colour's identity.
- **Fail** — fails by 0.5 or more. Needs a different token, not a nudge.

This only covers WCAG 2.x contrast ratios. It does not implement APCA,
WCAG 3 scoring, or any check beyond colour contrast (focus order, alt text,
motion, etc.).

## Role inference is a guess, not a lookup

A colour token's name and hex value don't tell you whether it's meant to be
text or a background. Figma *does* have a "scope" concept for variables
that could carry this information, but it's optional, rarely set
consistently, and routinely doesn't survive export pipelines. In practice,
role is not data the tool can reliably read — so it doesn't pretend to.

Instead, roles are inferred with a deliberately transparent, three-step
guess, in order of precedence:

1. **Name pattern.** Names starting with `text-`, `fg-`, `foreground-`,
   `content-`, `on-`, `label-`, `caption-`, `heading-`, `copy-`, `type-`, or
   `ink-` are assumed to be text. Names starting with `bg-`, `background-`,
   `surface-`, `canvas-`, `fill-`, `page-`, `backdrop-`, `overlay-`,
   `base-`, `layer-`, or `sheet-` are assumed to be backgrounds.
2. **Luminance fallback**, if the name doesn't match either pattern:
   relative luminance above 0.75 → background, below 0.25 → text,
   in between → `both` (genuinely ambiguous).
3. **Your override always wins**, and persists for the session. Every
   inferred role is shown next to the reasoning that produced it, so the
   guess is never silent.

This is a product decision, not a parsing limitation: since the input data
doesn't carry the answer, the tool guesses out loud and gives you one click
to correct it, rather than silently filtering tokens it isn't sure about.

## How the nearest passing colour is computed

When a pair fails or is a near miss, the tool looks for the closest colour
that would pass, without changing what the colour visually *is*:

1. Convert the foreground to OKLCH.
2. Hold hue and chroma constant — only lightness moves. This is what keeps
   the suggested colour recognisably the same colour, just lighter or
   darker.
3. Step lightness in increments of 0.005, in the direction that increases
   contrast (darken on a light background, lighten on a dark one),
   recomputing the WCAG ratio at each step against the real target
   background.
4. Stop as soon as the required threshold is crossed, or as soon as
   lightness hits 0 or 1 with no passing value found.
5. Convert back to hex and report both hexes, both ratios, and the
   lightness delta so you can judge the change before applying it.

If no lightness value in the valid range clears the threshold, the tool
says so explicitly and suggests picking a different token — it will not
quietly change hue or chroma to force a pass, because at that point the
"fix" is no longer the same colour.

## Known limitations

These are intentional v1 scope decisions, not oversights:

- **Paste only.** No Figma plugin, no live API sync. You paste a snapshot;
  the tool does not watch a file for changes.
- **Solid colours only.** No gradients, images, or transparency-aware
  background resolution.
- **WCAG 2.x only.** No APCA, no WCAG 3.
- **Both-role tokens are shown once, not twice.** A token inferred (or
  overridden) as `both` appears in the audit queue under its *text-role*
  failures only. Its performance as a background is still checked when
  it's the background half of a pair, but it does not get its own separate
  "failures as a background" count in the queue. This is a known,
  intentionally scoped limitation, not a bug — see the note on the role
  review screen.
- **"Improbable" pairs aren't excluded, only filtered by role.** The tool
  filters pairs by inferred/overridden role (only `text`/`both` foregrounds
  against `background`/`both` backgrounds), but it has no notion of which
  of those pairs a designer would actually ship. A large token set can
  still produce more rows than are practically useful.
- **No accounts, no history, nothing saved.** Every session starts from
  scratch (or from the preloaded sample set). This is a deliberate
  stateless, privacy-first design, not a missing feature.
- **Single active theme.** The interface itself, and the audit, both
  assume one light colour scheme. There is no dark-mode token set
  evaluated as a separate pass.

## Running it locally

Requires Node.js and npm.

```bash
npm install
npm run dev
```

This starts a Vite dev server (defaults to `http://localhost:5173`, and
will pick the next free port if that one's taken).

```bash
npm run build
```

Builds a static production bundle into `dist/`. This is a fully static
site — no server-side component, no backend, no environment variables to
configure. Deploy the contents of `dist/` anywhere that serves static
files.

```bash
npm run test
```

Runs the test suite (Vitest) covering the contrast maths, the WCAG state
model, and the focus-indicator contrast audit for the interface's own UI.
