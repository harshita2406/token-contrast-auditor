import type { ParsedToken, ParseError } from '../types';

function normalizeHex(hex: string): string {
  const h = hex.replace('#', '');
  const full = h.length === 3
    ? h.split('').map(c => c + c).join('')
    : h.length === 8 ? h.slice(0, 6) : h;
  return '#' + full.toLowerCase();
}

function parseColorValue(value: string): string | null {
  const trimmed = value.trim();
  if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(trimmed)) {
    return normalizeHex(trimmed);
  }
  const rgb = trimmed.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);
  if (rgb) {
    const toHex = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0');
    return `#${toHex(parseInt(rgb[1]))}${toHex(parseInt(rgb[2]))}${toHex(parseInt(rgb[3]))}`;
  }
  return null;
}

function flattenObject(obj: Record<string, unknown>, prefix = ''): ParsedToken[] {
  const tokens: ParsedToken[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const name = prefix ? `${prefix}-${key}` : key;
    if (typeof value === 'string') {
      const hex = parseColorValue(value);
      if (hex) tokens.push({ name, hex });
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      tokens.push(...flattenObject(value as Record<string, unknown>, name));
    }
  }
  return tokens;
}

export function parseJSON(input: string): ParsedToken[] | ParseError {
  try {
    const obj = JSON.parse(input);
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
      return {
        error: 'Expected a JSON object, not an array or primitive value.',
        hint: 'Wrap your tokens in curly braces: { "token-name": "#hex", … }',
      };
    }
    const tokens = flattenObject(obj);
    if (tokens.length === 0) {
      return {
        error: 'No valid colour values found in the JSON.',
        hint: 'Values must be hex (#RRGGBB or #RGB) or rgb(r, g, b).',
      };
    }
    return tokens;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Invalid JSON';
    const lineMatch = msg.match(/line (\d+)/i);
    return {
      error: msg,
      line: lineMatch ? parseInt(lineMatch[1]) : undefined,
      hint: 'Check for missing commas, unclosed brackets, or trailing commas after the last item.',
    };
  }
}

export function parseCSS(input: string): ParsedToken[] | ParseError {
  const tokens: ParsedToken[] = [];
  const lines = input.split('\n');
  let hasProperties = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('/*') || trimmed === ':root {' || trimmed === '}') continue;
    const match = trimmed.match(/^--([^:]+):\s*(.+?);?\s*$/);
    if (match) {
      hasProperties = true;
      const hex = parseColorValue(match[2].trim());
      if (hex) tokens.push({ name: match[1].trim(), hex });
    }
  }

  if (!hasProperties && tokens.length === 0) {
    return {
      error: 'No CSS custom properties found.',
      hint: 'Expected lines like: --token-name: #hex;',
    };
  }
  if (tokens.length === 0) {
    return {
      error: 'CSS properties found but no valid colour values.',
      hint: 'Values must be hex or rgb(r, g, b). Non-colour custom properties are skipped.',
    };
  }
  return tokens;
}

export function parseHexList(input: string): ParsedToken[] | ParseError {
  const tokens: ParsedToken[] = [];
  const lines = input.split('\n');
  let autoIndex = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // "name #hex" or "name hex"
    const nameHex = line.match(/^(.+?)\s+(#?[0-9A-Fa-f]{6}|#?[0-9A-Fa-f]{3})\s*$/);
    if (nameHex) {
      const rawHex = nameHex[2].startsWith('#') ? nameHex[2] : '#' + nameHex[2];
      const hex = parseColorValue(rawHex);
      if (hex) {
        tokens.push({ name: nameHex[1].trim(), hex });
        continue;
      }
    }

    // Just a hex value
    const justHex = line.match(/^#?([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/);
    if (justHex) {
      tokens.push({ name: `color-${autoIndex++}`, hex: normalizeHex('#' + justHex[1]) });
      continue;
    }

    return {
      error: `Line ${i + 1} is not a valid colour value.`,
      line: i + 1,
      hint: `"${line.slice(0, 40)}" — expected a hex value like #1F2937, optionally preceded by a name.`,
    };
  }

  if (tokens.length === 0) {
    return {
      error: 'No colours found.',
      hint: 'Enter one hex value per line, optionally preceded by a name.',
    };
  }
  return tokens;
}
