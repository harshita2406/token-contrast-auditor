# Token Contrast Auditor — PRD

**Owner:** Harshita Verma
**Status:** Draft v1, scoped for a one-day build
**Last updated:** 27 July 2026

---

## 1. Problem

Design systems define colour as a set of named tokens. Accessibility, however, is never a property of a single token. It is a property of a **pair**: a foreground colour rendered against a background colour.

This mismatch creates a blind spot. Teams govern tokens individually but ship pairs, and no one holds a view of which combinations in their own system are safe. Contrast gets checked one pair at a time, in a plugin, after the design is already built, usually by whoever remembers to.

The result is that accessibility failures are found late, in QA or in an audit, when the cost of changing a colour is highest.

## 2. Why it matters in Canada

Two regimes, both landing on WCAG AA in practice:

- **AODA** (Accessibility for Ontarians with Disabilities Act) — provincial. The Integrated Accessibility Standards Regulation requires public-facing sites of larger organisations to meet WCAG 2.0 Level AA.
- **Accessible Canada Act** — federal, covering federally regulated sectors including banks and telecoms.

An Ontario health-tech company sits under AODA. A Canadian bank sits under the ACA. Most enterprise design systems in Toronto are governed by one or both, and almost none have a system-level view of their own compliance.

> Verify the current status of the AODA regulation before citing it in an interview. It has been under review.

## 3. Users and jobs to be done

The tool is episodic, not daily. Four distinct moments:

| # | Moment | Frequency | Need |
|---|---|---|---|
| 1 | **Inherited-system audit.** New to a team, or a compliance deadline lands. | Rare | A complete picture and a shareable artifact |
| 2 | **New-token check.** "I'm adding an error red. Is it safe?" | Frequent | One answer in under 30 seconds |
| 3 | **Pre-handoff check.** Screen is done, verify the pairs used. | Weekly | Confidence before dev picks it up |
| 4 | **Compliance conversation.** Legal, procurement, or a client asks. | Rare | A document |

**Primary user:** design system owner or senior product designer at a mid-to-large enterprise, working in Figma, comfortable with tokens, not necessarily fluent in WCAG.

**Design consequence:** moment 2 is the default view. Moment 1 is the secondary view. The interface should not make the frequent case pay for the rare one.

## 4. Non-goals

Explicitly out of scope for v1. Naming these is as important as naming the scope.

- Live Figma plugin or API integration. Paste only.
- Any check beyond colour contrast (focus order, alt text, semantics, motion).
- Accounts, saved audits, team collaboration, history.
- APCA / WCAG 3 scoring. WCAG 2.x ratios only.
- Non-text contrast beyond the 3:1 UI component rule.
- Automatic palette generation or full theme remediation.
- Gradient, image, or transparency-aware backgrounds. Solid colours only.

## 5. MVP scope

### In

1. **Paste input.** Accepts JSON (nested or flat), CSS custom properties, or a bare list of hex values. Forgiving parser. Sample token set pre-loaded on first visit so the tool is never empty.
2. **Role inference.** Each token tagged `text`, `background`, or `both`. Inferred from name pattern first, relative luminance second. Presented as editable chips. User can flip any assignment in one click.
3. **Context switch.** Body text (4.5:1), large text (3:1), UI component (3:1). Always visible. Results re-evaluate live.
4. **Level switch.** AA or AAA.
5. **Token queue.** Left rail listing every text-capable token with its failure count. Sorted worst first. Auto-selects the worst offender on load.
6. **Detail view.** Selected text token shown against every plausible background, each row containing: live rendered sample, background token name, actual ratio, required ratio, state badge, suggested fix.
7. **Four-state model.** Pass / large-text-only / near-miss / fail. Never binary.
8. **Nearest passing hex.** Computed in OKLCH by adjusting lightness only, holding hue and chroma. Previewable in place with undo.
9. **Corrected token export.** Copy the original structure back out with failing values replaced.
10. **CSV export** of the full pair matrix.

### Cut line

Everything below this line ships only if the above is done and stable.

- Full matrix view for moment 1
- PDF compliance summary
- Shareable URL state
- Dark mode theme pairs evaluated as a separate set
- "Unlikely combinations" grouping

### Out entirely for v1

Anything in section 4.

## 6. Core specification

### 6.1 Contrast ratio

```
ratio = (L_lighter + 0.05) / (L_darker + 0.05)
```

where `L` is WCAG relative luminance. Range 1:1 to 21:1. Round displayed values to one decimal. Never round *up* across a threshold: 4.49 displays as 4.5 but must still fail.

### 6.2 Thresholds

| Context | AA | AAA |
|---|---|---|
| Body text | 4.5:1 | 7:1 |
| Large text (≥24px regular, ≥18.7px bold) | 3:1 | 4.5:1 |
| UI component / graphical object | 3:1 | n/a |

### 6.3 State model

| State | Condition | User action |
|---|---|---|
| Pass | ratio ≥ threshold | none |
| Large text only | ratio ≥ 3:1 but < 4.5:1, in body context | usable, constrain to headings |
| Near miss | fails by < 0.5 | nudge lightness, keep the colour |
| Fail | fails by ≥ 0.5 | choose a different token |

### 6.4 Role inference

Order of precedence:

1. **Name match.** `text-*`, `fg-*`, `content-*`, `on-*`, `label-*` → text. `bg-*`, `surface-*`, `canvas-*`, `fill-*`, `page-*` → background.
2. **Luminance fallback.** L > 0.75 → background. L < 0.25 → text. Otherwise → both.
3. **User override** always wins and persists for the session.

Rationale: Figma variable exports carry a name and a value but no reliable role field. Figma *scopes* exist but are optional and rarely configured, and often do not survive an export pipeline. Role inference is therefore a product problem, not a parsing step.

### 6.5 Nearest passing hex

Convert to OKLCH. Hold hue and chroma constant. Step lightness in increments of 0.005 in the direction that increases contrast, until the threshold is crossed. Convert back to hex.

If no lightness value in range satisfies the threshold, return no suggestion and state that the pair needs a different token. Do not return a colour that is no longer recognisably the original.

Display the delta so the user can judge the change: original hex, suggested hex, ratio before, ratio after.

### 6.6 Pair filtering

Only evaluate pairs where the foreground is `text` or `both` and the background is `background` or `both`. Never evaluate a token against itself.

For a 40-token system this typically reduces roughly 1,600 theoretical pairs to 150–250 real ones.

## 7. Accessibility requirements

These are acceptance criteria, not aspirations. An inaccessible accessibility tool fails its own premise.

- **AC1.** No state is communicated by colour alone. Every status carries an icon and a text label.
- **AC2.** The contrast ratio is rendered as visible text at all times. Never hover-only.
- **AC3.** All interactive elements are reachable and operable by keyboard. Arrow keys move between rows; Enter opens detail.
- **AC4.** Focus indicator meets 3:1 against adjacent colours and is never suppressed.
- **AC5.** Results table uses semantic `<table>` with `<th scope>`. Each cell announces token pair, ratio, and verdict as a single coherent phrase.
- **AC6.** Touch targets ≥ 44×44px.
- **AC7.** `prefers-reduced-motion` respected; no essential information conveyed by animation.
- **AC8.** Page is usable at 200% zoom and at 320px width without horizontal scroll.
- **AC9.** The tool's own colour tokens pass its own audit at AA. This result is displayed publicly on the page.

## 8. Success measures

Portfolio context, so these are signal measures rather than product KPIs.

- A designer unfamiliar with the tool reaches a correct verdict on their own token set in under 60 seconds, unaided.
- A non-designer can state what the tool does after 15 seconds on the page.
- The tool passes an automated axe scan with zero violations.
- The tool passes a manual keyboard-only walkthrough end to end.
- The case study answers: what did the AI get wrong, and how did I catch it.

## 9. Open decisions

| Decision | Options | Leaning |
|---|---|---|
| Persistence | Stateless client-side vs. saved audits | Stateless. No privacy story to manage, faster to build, honest about scope. |
| Export format | CSV for designers vs. PDF for compliance | Both, CSV first. |
| Both-role tokens in the queue | Show with text-role failures only vs. selectable in either role | Show with text-role failures only in v1. Note as a known limitation. |
| Improbable pairs | Include in failure count vs. collapse separately | Collapse. An inflated count teaches users to distrust the number. |

## 10. Case study angles

What to write up once it is built. This is where the interview value sits.

1. **The matrix was the wrong default.** Started with a 40×40 grid, realised the frequent job is one-token-to-many, restructured around a queue. Density is an intent problem, not a settings problem.
2. **Binary pass/fail hides the useful answer.** "Large text only" is a real, actionable state that most tools collapse into failure.
3. **Role inference is a design problem.** The data does not carry the answer, so the tool guesses transparently and lets the user correct it rather than silently filtering.
4. **Closing the loop.** The output is not a report, it is a corrected token file. The user leaves with the thing they came to change.
5. **Eating the dog food.** Building an accessibility tool forces every decision the tool is auditing for.