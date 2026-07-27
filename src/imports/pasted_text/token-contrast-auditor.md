Build a responsive, functional web-app prototype named “Token Contrast Auditor.”

Purpose
This is an accessibility tool for design-system owners and senior product designers. It lets them paste colour tokens, identify which foreground/background pairs do not meet WCAG 2.x contrast requirements, preview a safe correction, and export the corrected tokens.

The product must feel credible, calm, precise, and enterprise-ready—not like a generic SaaS dashboard. Its main job is fast: a user should understand whether a selected text token is safe against likely backgrounds in under 30 seconds.

Before building:
1. Create a short implementation plan listing the screens, components, states, and interactions.
2. Then build the complete interactive prototype using realistic sample data.
3. Use a clean, accessible visual direction: warm off-white background, deep charcoal text, restrained navy or cobalt for interactive focus, and semantic status colours only as secondary reinforcement. No gradients, glassmorphism, neon, or decorative charts.

Core user journey
1. User opens the tool and sees a preloaded sample token set.
2. User can paste JSON, CSS custom properties, or a list of hex values.
3. User parses the tokens and reviews inferred roles: Text, Background, or Both.
4. User enters an audit workspace. The worst offending text token is automatically selected.
5. User checks the selected text token against plausible background tokens.
6. User can preview and apply a nearest passing colour correction.
7. User exports corrected tokens or the full pair matrix as CSV.

Build these screens and states

1. Paste tokens / first visit
- Product heading: “Token Contrast Auditor”
- Supporting copy: “Find unsafe foreground and background token pairs before they reach production.”
- Tabs: JSON, CSS variables, Hex list.
- Large labelled paste field with realistic sample tokens already loaded.
- Primary button: “Parse tokens”
- Secondary action: “Load sample token set”
- Privacy note: “Processed in your browser. Nothing is saved.”
- Empty, parsing, successful, and invalid-input states.
- Invalid-input state identifies the problematic line and explains how to fix it.

2. Review inferred token roles
- Semantic table with columns: token name, hex value, colour sample, inferred role, rationale.
- Editable role controls: Text, Background, Both.
- Explain that roles are inferred from naming and brightness, and can be changed.
- Primary action: “Start audit”
- Back action that preserves the pasted token set.

3. Primary audit workspace
- Desktop layout: persistent left token queue; central selected-token detail workspace.
- Mobile layout: queue becomes a drawer or top-level list; no horizontal page scrolling.
- Left token queue lists text-capable tokens, sorted by highest failure count first.
- Each queue item includes: token name, colour swatch, number of failures, a status icon, and visible text such as “3 failures.”
- Auto-select the worst offender on initial load.
- Main panel shows selected token name, hex value, role chip, and a concise summary.
- Always-visible controls:
  - Context: Body text / Large text / UI component
  - Level: AA / AAA
- Context changes must update all requirements and results immediately.

4. Contrast pair results
- Use a semantic table, not a collection of unrelated cards.
- Each row represents the selected foreground token against one plausible background token.
- Every row includes:
  - a large live sample of the foreground text against the background,
  - background token name and hex,
  - actual contrast ratio,
  - required ratio,
  - verdict icon and text,
  - an explicit recommended action.
- Use exactly these verdicts:
  - Pass
  - Large text only
  - Near miss
  - Fail
- Never communicate verdicts with colour alone.
- Make ratios permanently visible, never hover-only.
- Use realistic examples such as:
  - text-primary #1F2937 on surface-default #FFFFFF — 14.7:1 — Pass
  - text-danger #D92D20 on surface-default #FFFFFF — 4.3:1 — Near miss
  - text-muted #667085 on surface-subtle #F2F4F7 — 4.1:1 — Large text only

5. Nearest passing colour interaction
- A Near miss or Fail row can open a compact details drawer or inline expansion.
- Show original hex, suggested hex, ratio before, ratio after, and a lightness-change value.
- Show a live before/after comparison.
- Actions: Preview suggestion, Apply correction, Cancel.
- After Apply correction, update the relevant result and failure count, and show a non-blocking confirmation with Undo.
- Include a no-suggestion state: “A lightness-only adjustment cannot make this pair pass. Choose a different token.”

6. Export
- Include “Copy corrected tokens” and “Export CSV.”
- Explain that corrected tokens preserve the original input format.
- Include success, loading, disabled, and error states.
- Add an optional secondary “Full matrix” view for complete inherited-system audits.
- Group improbable combinations under a collapsed “Unlikely combinations” section so they do not distort the primary failure count.

Accessibility requirements
- WCAG 2.1 AA-conscious design.
- No information conveyed by colour alone.
- 44 by 44 pixel minimum targets.
- Clearly visible, high-contrast focus indicator on every interactive element.
- Keyboard behavior:
  - Tab moves through controls in logical order.
  - Arrow keys move between token queue items and result rows.
  - Enter opens a row or applies the focused action.
  - Escape closes a drawer or suggestion preview.
- Respect reduced motion; do not use animation to convey essential information.
- Design for 200% zoom and a 320px viewport without horizontal scrolling.
- Add a small footer message: “This interface’s colour tokens are verified at WCAG AA.”

Use accessible, high-quality typography. Use monospace only for hex values and ratios. Make the selected foreground/background preview the visual centre of the interface.