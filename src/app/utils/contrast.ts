import type { Context, Level, Verdict, CorrectionResult } from '../types';

export function hexToRGB(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
}

function linearize(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function wcagLuminance(hex: string): number {
  const [r, g, b] = hexToRGB(hex);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

export function contrastRatio(hex1: string, hex2: string): number {
  const l1 = wcagLuminance(hex1);
  const l2 = wcagLuminance(hex2);
  const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (lighter + 0.05) / (darker + 0.05);
}

export function getThreshold(context: Context, level: Level): number {
  if (context === 'body') return level === 'AA' ? 4.5 : 7;
  if (context === 'large') return level === 'AA' ? 3 : 4.5;
  return 3; // UI component — AAA not defined, use same as AA
}

export function getVerdict(ratio: number, context: Context, level: Level): Verdict {
  const threshold = getThreshold(context, level);
  if (ratio >= threshold) return 'Pass';
  // Large text only applies in body text context when ratio clears the large-text
  // threshold for the selected level (3:1 at AA, 4.5:1 at AAA per PRD §6.2).
  if (context === 'body') {
    const largeTextThreshold = getThreshold('large', level);
    if (ratio >= largeTextThreshold) return 'LargeTextOnly';
  }
  if (threshold - ratio < 0.5) return 'NearMiss';
  return 'Fail';
}

// OKLCH conversion helpers for nearest-passing-color computation

function linearToSrgb(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function rgbToXYZ(r: number, g: number, b: number): [number, number, number] {
  const rl = srgbToLinear(r), gl = srgbToLinear(g), bl = srgbToLinear(b);
  return [
    0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl,
    0.2126729 * rl + 0.7151522 * gl + 0.0721750 * bl,
    0.0193339 * rl + 0.1191920 * gl + 0.9503041 * bl,
  ];
}

function xyzToOklab(x: number, y: number, z: number): [number, number, number] {
  const l = 0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z;
  const m = 0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z;
  const s = 0.0482003018 * x + 0.2643662691 * y + 0.6338517070 * z;
  const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s);
  return [
    0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
  ];
}

function oklabToXyz(L: number, a: number, b: number): [number, number, number] {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  return [
    4.0767416621 * l_ ** 3 - 3.3077115913 * m_ ** 3 + 0.2309699292 * s_ ** 3,
    -1.2684380046 * l_ ** 3 + 2.6097574011 * m_ ** 3 - 0.3413193965 * s_ ** 3,
    -0.0041960863 * l_ ** 3 - 0.7034186147 * m_ ** 3 + 1.7076147010 * s_ ** 3,
  ];
}

function xyzToRgb(x: number, y: number, z: number): [number, number, number] {
  return [
    Math.max(0, Math.min(1, linearToSrgb(3.2404542 * x - 1.5371385 * y - 0.4985314 * z))),
    Math.max(0, Math.min(1, linearToSrgb(-0.9692660 * x + 1.8760108 * y + 0.0415560 * z))),
    Math.max(0, Math.min(1, linearToSrgb(0.0556434 * x - 0.2040259 * y + 1.0572252 * z))),
  ];
}

function hexToOklch(hex: string): [number, number, number] {
  const [r, g, b] = hexToRGB(hex);
  const [x, y, z] = rgbToXYZ(r, g, b);
  const [L, a, ob] = xyzToOklab(x, y, z);
  return [L, Math.sqrt(a * a + ob * ob), Math.atan2(ob, a)];
}

function oklchToHex(L: number, C: number, h: number): string {
  const [x, y, z] = oklabToXyz(L, C * Math.cos(h), C * Math.sin(h));
  const [r, g, b] = xyzToRgb(x, y, z);
  return '#' + [r, g, b].map(c => Math.round(c * 255).toString(16).padStart(2, '0')).join('');
}

export function findNearestPassing(
  fgHex: string,
  bgHex: string,
  threshold: number
): CorrectionResult | null {
  const [L, C, h] = hexToOklch(fgHex);
  const fgLum = wcagLuminance(fgHex);
  const bgLum = wcagLuminance(bgHex);
  // Darken dark-on-light; lighten light-on-dark
  const direction = fgLum <= bgLum ? -1 : 1;

  for (let i = 1; i <= 200; i++) {
    const newL = Math.max(0, Math.min(1, L + direction * 0.005 * i));
    const hex = oklchToHex(newL, C, h);
    const ratio = contrastRatio(hex, bgHex);
    if (ratio >= threshold) {
      return { hex, ratio, deltaL: newL - L };
    }
    if (newL === 0 || newL === 1) break;
  }
  return null;
}
