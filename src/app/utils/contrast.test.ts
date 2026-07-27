import { describe, expect, it } from 'vitest';
import { contrastRatio, getVerdict } from './contrast';

describe('getVerdict', () => {
  it('body text, AA, ratio 3.5 → LargeTextOnly', () => {
    expect(getVerdict(3.5, 'body', 'AA')).toBe('LargeTextOnly');
  });

  it('body text, AAA, ratio 5.0 → LargeTextOnly', () => {
    expect(getVerdict(5.0, 'body', 'AAA')).toBe('LargeTextOnly');
  });

  it('body text, AAA, ratio 2.0 → Fail', () => {
    expect(getVerdict(2.0, 'body', 'AAA')).toBe('Fail');
  });
});

describe('contrastRatio', () => {
  it('black on white → ratio 21', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 10);
  });
});
