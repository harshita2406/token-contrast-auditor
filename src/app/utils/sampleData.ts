export const SAMPLE_JSON = `{
  "text-primary": "#1F2937",
  "text-secondary": "#374151",
  "text-muted": "#757B8A",
  "text-disabled": "#9CA3AF",
  "text-danger": "#E53935",
  "text-warning": "#D97706",
  "text-success": "#047857",
  "text-link": "#2563EB",
  "text-inverse": "#F9FAFB",
  "surface-default": "#FFFFFF",
  "surface-subtle": "#F2F4F7",
  "surface-muted": "#E4E7EC",
  "surface-inverted": "#101828",
  "surface-primary": "#1D4ED8",
  "surface-danger": "#FEF2F2",
  "surface-success": "#ECFDF5"
}`;

export const SAMPLE_CSS = `:root {
  --text-primary: #1F2937;
  --text-secondary: #374151;
  --text-muted: #757B8A;
  --text-disabled: #9CA3AF;
  --text-danger: #E53935;
  --text-warning: #D97706;
  --text-success: #047857;
  --text-link: #2563EB;
  --text-inverse: #F9FAFB;
  --surface-default: #FFFFFF;
  --surface-subtle: #F2F4F7;
  --surface-muted: #E4E7EC;
  --surface-inverted: #101828;
  --surface-primary: #1D4ED8;
  --surface-danger: #FEF2F2;
  --surface-success: #ECFDF5;
}`;

export const SAMPLE_HEX = `text-primary #1F2937
text-secondary #374151
text-muted #757B8A
text-disabled #9CA3AF
text-danger #E53935
text-warning #D97706
text-success #047857
text-link #2563EB
text-inverse #F9FAFB
surface-default #FFFFFF
surface-subtle #F2F4F7
surface-muted #E4E7EC
surface-inverted #101828
surface-primary #1D4ED8
surface-danger #FEF2F2
surface-success #ECFDF5`;

export function getSampleForFormat(format: 'json' | 'css' | 'hex'): string {
  if (format === 'css') return SAMPLE_CSS;
  if (format === 'hex') return SAMPLE_HEX;
  return SAMPLE_JSON;
}
