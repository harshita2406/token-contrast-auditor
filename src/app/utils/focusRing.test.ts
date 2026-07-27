import { describe, expect, it } from 'vitest';
import { contrastRatio } from './contrast';

// AC4: "Focus indicator meets 3:1 against adjacent colours and is never
// suppressed." This enumerates every surface colour the interface's focus
// ring can actually render against (cross-referenced against theme.css and
// every focus-visible:outline-[...] usage in src/app/components), including
// Tailwind opacity blends resolved to their effective hex.
const RING = '#1D4ED8'; // --ring / --accent, used by nearly every focus-visible outline

const SURFACES: Record<string, string> = {
  'page background (--background)': '#F6F5F2',
  'card (--card)': '#FFFFFF',
  'muted, solid (--muted)': '#EEECEA',
  'muted/40 over card — context & level pill buttons': '#F8F7F7',
  'muted/30 over page background — contrast table row hover': '#F4F2F0',
  'muted/60 over card — token queue row hover': '#F5F4F2',
  'selected token queue item / roles info banner (#EFF6FF)': '#EFF6FF',
  'expanded correction row (#F8F7FF)': '#F8F7FF',
};

describe('AC4: focus ring meets 3:1 against every background it appears over', () => {
  for (const [label, bgHex] of Object.entries(SURFACES)) {
    it(`${label} — ${RING} on ${bgHex}`, () => {
      expect(contrastRatio(RING, bgHex)).toBeGreaterThanOrEqual(3);
    });
  }
});

describe('AC4: secondary focus ring (Undo button) meets 3:1', () => {
  it('#047857 on notification banner #F0FDF4', () => {
    expect(contrastRatio('#047857', '#F0FDF4')).toBeGreaterThanOrEqual(3);
  });
});
