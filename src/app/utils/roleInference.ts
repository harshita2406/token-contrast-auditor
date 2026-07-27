import type { Role } from '../types';
import { wcagLuminance } from './contrast';

const TEXT_PATTERN = /^(text|fg|foreground|content|on|label|caption|heading|copy|type|ink)[\-_]/i;
const BG_PATTERN = /^(bg|background|surface|canvas|fill|page|backdrop|overlay|base|layer|sheet)[\-_]/i;

export function inferRole(name: string, hex: string): Role {
  if (TEXT_PATTERN.test(name)) return 'text';
  if (BG_PATTERN.test(name)) return 'background';
  const lum = wcagLuminance(hex);
  if (lum > 0.75) return 'background';
  if (lum < 0.25) return 'text';
  return 'both';
}
