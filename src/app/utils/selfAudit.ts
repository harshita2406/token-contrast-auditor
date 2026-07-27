import type { Context, Verdict } from '../types';
import { contrastRatio, getThreshold, getVerdict } from './contrast';

export interface SelfAuditResult {
  label: string;
  fgVar: string;
  bgVar: string;
  fgHex: string;
  bgHex: string;
  context: Context;
  ratio: number;
  threshold: number;
  verdict: Verdict;
  pass: boolean;
}

// Pairs this interface actually renders, and the surface each one actually
// appears on. Body/secondary text are evaluated as text (4.5:1 at AA); the
// focus ring is a non-text UI indicator, evaluated at the 3:1 UI-component
// rule per PRD §6.2 / AC4 — not the text threshold.
const CHECKS: { label: string; fgVar: string; bgVar: string; context: Context }[] = [
  { label: 'Body text', fgVar: '--foreground', bgVar: '--background', context: 'body' },
  { label: 'Secondary text', fgVar: '--muted-foreground', bgVar: '--background', context: 'body' },
  { label: 'Focus ring', fgVar: '--ring', bgVar: '--background', context: 'ui' },
];

const HEX_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

function readCssVar(name: string): string | null {
  if (typeof document === 'undefined' || typeof getComputedStyle === 'undefined') return null;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return HEX_PATTERN.test(value) ? value : null;
}

/**
 * Reads this interface's own colour tokens straight out of the live DOM
 * (the CSS custom properties defined in theme.css, as actually applied to
 * document.documentElement) and runs them through the same contrastRatio()
 * used to audit pasted tokens. Nothing here is a separate hardcoded copy of
 * the theme colours — if theme.css changes, this recomputes from the new
 * values automatically.
 */
export function runSelfAudit(): SelfAuditResult[] {
  return CHECKS.map(({ label, fgVar, bgVar, context }) => {
    const fgHex = readCssVar(fgVar) ?? '#000000';
    const bgHex = readCssVar(bgVar) ?? '#ffffff';
    const ratio = contrastRatio(fgHex, bgHex);
    const threshold = getThreshold(context, 'AA');
    const verdict = getVerdict(ratio, context, 'AA');
    return { label, fgVar, bgVar, fgHex, bgHex, context, ratio, threshold, verdict, pass: verdict === 'Pass' };
  });
}
