export type Role = 'text' | 'background' | 'both';
export type Context = 'body' | 'large' | 'ui';
export type Level = 'AA' | 'AAA';
export type Verdict = 'Pass' | 'LargeTextOnly' | 'NearMiss' | 'Fail';

export interface AppToken {
  id: string;
  name: string;
  hex: string;
  role: Role;
  userOverride: boolean;
  luminance: number;
}

export interface CorrectionResult {
  hex: string;
  ratio: number;
  deltaL: number;
}

export interface ContrastPair {
  bgToken: AppToken;
  fgHex: string;
  ratio: number;
  threshold: number;
  verdict: Verdict;
  correction: CorrectionResult | null;
}

export interface ParsedToken {
  name: string;
  hex: string;
}

export interface ParseError {
  error: string;
  line?: number;
  hint?: string;
}
