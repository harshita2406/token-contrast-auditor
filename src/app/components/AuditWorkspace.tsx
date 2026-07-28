import { useState, useMemo } from 'react';
import {
  Copy, Download, CheckCircle2, RotateCcw, Menu, X
} from 'lucide-react';
import type { AppToken, Context, Level, ContrastPair } from '../types';
import { contrastRatio, getThreshold, getVerdict, findNearestPassing } from '../utils/contrast';
import { TokenQueue } from './TokenQueue';
import { ContrastTable } from './ContrastTable';
import { AppHeader } from './AppHeader';
import { AppFooter } from './AppFooter';

interface AuditWorkspaceProps {
  tokens: AppToken[];
  corrections: Map<string, string>;
  context: Context;
  level: Level;
  selectedTokenId: string | null;
  inputFormat: 'json' | 'css' | 'hex';
  inputValue: string;
  onContextChange: (c: Context) => void;
  onLevelChange: (l: Level) => void;
  onSelectToken: (id: string) => void;
  onApplyCorrection: (tokenId: string, correctedHex: string) => void;
  onUndoCorrection: (tokenId: string) => void;
  onBack: () => void;
}

const CONTEXT_OPTIONS: { value: Context; label: string; description: string }[] = [
  { value: 'body', label: 'Body text', description: 'Normal-sized text (< 24px regular, < 18.7px bold)' },
  { value: 'large', label: 'Large text', description: '≥ 24px regular or ≥ 18.7px bold' },
  { value: 'ui', label: 'UI component', description: 'Icons, borders, graphical objects' },
];

function exportCorrectedTokens(
  format: 'json' | 'css' | 'hex',
  originalInput: string,
  tokens: AppToken[],
  corrections: Map<string, string>
): string {
  let result = originalInput;
  for (const token of tokens) {
    const corrected = corrections.get(token.id);
    if (!corrected) continue;
    const orig = token.hex;
    if (format === 'json') {
      result = result.replace(
        new RegExp(`("${token.name}"\\s*:\\s*)"${orig}"`, 'i'),
        `$1"${corrected}"`
      );
    } else if (format === 'css') {
      result = result.replace(
        new RegExp(`(--${token.name}\\s*:\\s*)${orig}`, 'i'),
        `$1${corrected}`
      );
    } else {
      result = result.replace(
        new RegExp(`(${token.name}\\s+)${orig}`, 'i'),
        `$1${corrected}`
      );
    }
  }
  return result;
}

function exportCSV(
  textTokens: AppToken[],
  bgTokens: AppToken[],
  corrections: Map<string, string>,
  context: Context,
  level: Level
): string {
  const rows: string[][] = [
    ['FG Token', 'FG Hex (effective)', 'BG Token', 'BG Hex', 'Ratio', 'Required', 'Verdict'],
  ];
  for (const fg of textTokens) {
    const fgHex = corrections.get(fg.id) || fg.hex;
    const threshold = getThreshold(context, level);
    for (const bg of bgTokens) {
      if (bg.id === fg.id) continue;
      const ratio = contrastRatio(fgHex, bg.hex);
      const verdict = getVerdict(ratio, context, level);
      const verdictLabel = {
        Pass: 'Pass', LargeTextOnly: 'Large text only', NearMiss: 'Near miss', Fail: 'Fail'
      }[verdict];
      rows.push([fg.name, fgHex, bg.name, bg.hex, ratio.toFixed(1), threshold.toFixed(1), verdictLabel]);
    }
  }
  return rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
}

export function AuditWorkspace({
  tokens, corrections, context, level, selectedTokenId,
  inputFormat, inputValue,
  onContextChange, onLevelChange, onSelectToken, onApplyCorrection, onUndoCorrection, onBack
}: AuditWorkspaceProps) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; tokenId: string } | null>(null);
  const [mobileQueueOpen, setMobileQueueOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const [csvStatus, setCsvStatus] = useState<'idle' | 'done' | 'error'>('idle');

  const selectedToken = tokens.find(t => t.id === selectedTokenId) ?? null;
  const textTokens = useMemo(() => tokens.filter(t => t.role === 'text' || t.role === 'both'), [tokens]);
  const bgTokens = useMemo(() => tokens.filter(t => t.role === 'background' || t.role === 'both'), [tokens]);

  // Compute pairs for selected token
  const pairs: ContrastPair[] = useMemo(() => {
    if (!selectedToken) return [];
    const fgHex = corrections.get(selectedToken.id) || selectedToken.hex;
    const threshold = getThreshold(context, level);

    return bgTokens
      .filter(bg => bg.id !== selectedToken.id)
      .map(bg => {
        const ratio = contrastRatio(fgHex, bg.hex);
        const verdict = getVerdict(ratio, context, level);
        const correction =
          verdict === 'NearMiss' || verdict === 'Fail'
            ? findNearestPassing(fgHex, bg.hex, threshold)
            : null;
        return { bgToken: bg, fgHex, ratio, threshold, verdict, correction };
      })
      .sort((a, b) => a.ratio - b.ratio);
  }, [selectedToken, corrections, context, level, bgTokens]);

  const correctedCount = corrections.size;

  const handleApplyCorrection = (tokenId: string, correctedHex: string) => {
    onApplyCorrection(tokenId, correctedHex);
    setExpandedKey(null);
    const t = tokens.find(x => x.id === tokenId);
    setNotification({ message: `Correction applied to ${t?.name ?? tokenId}.`, tokenId });
    setTimeout(() => setNotification(null), 6000);
  };

  const handleUndo = (tokenId: string) => {
    onUndoCorrection(tokenId);
    setNotification(null);
  };

  const handleCopyTokens = async () => {
    const output = exportCorrectedTokens(inputFormat, inputValue, tokens, corrections);
    try {
      await navigator.clipboard.writeText(output);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch {
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  const handleExportCSV = () => {
    try {
      const csv = exportCSV(textTokens, bgTokens, corrections, context, level);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'token-contrast-audit.csv';
      a.click();
      URL.revokeObjectURL(url);
      setCsvStatus('done');
      setTimeout(() => setCsvStatus('idle'), 2000);
    } catch {
      setCsvStatus('error');
      setTimeout(() => setCsvStatus('idle'), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" style={{ maxHeight: '100dvh', overflow: 'hidden' }}>
      {/* Top bar */}
      <header className="border-b border-border bg-card shrink-0">
        <AppHeader step="results" onBackToInput={onBack} />
        <div className="px-4 pb-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="ml-auto flex items-center gap-2">
              {/* Context selector */}
              <div className="hidden md:flex items-center gap-1 rounded border border-border p-0.5 bg-muted/40">
                {CONTEXT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { onContextChange(opt.value); setExpandedKey(null); }}
                    aria-pressed={context === opt.value}
                    title={opt.description}
                    className={[
                      'rounded px-3 py-1.5 transition-colors',
                      'focus-visible:outline-2 focus-visible:outline-[#1D4ED8] focus-visible:outline-offset-2',
                      context === opt.value
                        ? 'bg-white text-[#1B3A5C] shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    ].join(' ')}
                    style={{ fontSize: '0.8125rem', fontWeight: context === opt.value ? 500 : 400, minHeight: '36px' }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Level selector */}
              <div className="hidden md:flex items-center gap-1 rounded border border-border p-0.5 bg-muted/40">
                {(['AA', 'AAA'] as Level[]).map(l => (
                  <button
                    key={l}
                    onClick={() => { onLevelChange(l); setExpandedKey(null); }}
                    aria-pressed={level === l}
                    className={[
                      'rounded px-3 py-1.5 transition-colors',
                      'focus-visible:outline-2 focus-visible:outline-[#1D4ED8] focus-visible:outline-offset-2',
                      level === l
                        ? 'bg-white text-[#1B3A5C] shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    ].join(' ')}
                    style={{ fontSize: '0.8125rem', fontWeight: level === l ? 500 : 400, minHeight: '36px' }}
                  >
                    {l}
                  </button>
                ))}
              </div>

              {/* Mobile queue toggle */}
              <button
                onClick={() => setMobileQueueOpen(v => !v)}
                className="md:hidden flex items-center gap-1.5 rounded border border-border px-3 py-2 text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-[#1D4ED8] focus-visible:outline-offset-2 transition-colors"
                style={{ fontSize: '0.8125rem', minHeight: '44px' }}
                aria-expanded={mobileQueueOpen}
                aria-controls="mobile-queue"
              >
                {mobileQueueOpen ? <X size={14} aria-hidden="true" /> : <Menu size={14} aria-hidden="true" />}
                Tokens
              </button>
            </div>
          </div>

          {/* Mobile context/level controls */}
          <div className="md:hidden flex items-center gap-2 mt-2 flex-wrap">
            <div className="flex items-center gap-1 rounded border border-border p-0.5 bg-muted/40">
              {CONTEXT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { onContextChange(opt.value); setExpandedKey(null); }}
                  aria-pressed={context === opt.value}
                  className={[
                    'rounded px-2 py-1 transition-colors',
                    'focus-visible:outline-2 focus-visible:outline-[#1D4ED8] focus-visible:outline-offset-2',
                    context === opt.value
                      ? 'bg-white text-[#1B3A5C] shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  ].join(' ')}
                  style={{ fontSize: '0.75rem', fontWeight: context === opt.value ? 500 : 400, minHeight: '32px' }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 rounded border border-border p-0.5 bg-muted/40">
              {(['AA', 'AAA'] as Level[]).map(l => (
                <button
                  key={l}
                  onClick={() => { onLevelChange(l); setExpandedKey(null); }}
                  aria-pressed={level === l}
                  className={[
                    'rounded px-2 py-1 transition-colors',
                    'focus-visible:outline-2 focus-visible:outline-[#1D4ED8] focus-visible:outline-offset-2',
                    level === l
                      ? 'bg-white text-[#1B3A5C] shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  ].join(' ')}
                  style={{ fontSize: '0.75rem', fontWeight: level === l ? 500 : 400, minHeight: '32px' }}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Notification */}
      {notification && (
        <div
          role="status"
          aria-live="polite"
          className="shrink-0 flex items-center justify-between gap-3 border-b border-[#BBF7D0] bg-[#F0FDF4] px-4 py-2.5 sm:px-6"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-[#047857] shrink-0" aria-hidden="true" />
            <span className="text-[#065F46]" style={{ fontSize: '0.875rem' }}>{notification.message}</span>
          </div>
          <button
            onClick={() => handleUndo(notification.tokenId)}
            className="flex items-center gap-1.5 rounded border border-[#BBF7D0] px-3 py-1 text-[#047857] hover:bg-[#DCFCE7] focus-visible:outline-2 focus-visible:outline-[#047857] focus-visible:outline-offset-2 transition-colors"
            style={{ fontSize: '0.8125rem', fontWeight: 500, minHeight: '36px' }}
          >
            <RotateCcw size={12} aria-hidden="true" />
            Undo
          </button>
        </div>
      )}

      {/* Mobile queue drawer */}
      {mobileQueueOpen && (
        <div
          id="mobile-queue"
          className="md:hidden border-b border-border bg-card shrink-0"
          style={{ maxHeight: '40vh', overflow: 'hidden' }}
        >
          <TokenQueue
            tokens={tokens}
            corrections={corrections}
            context={context}
            level={level}
            selectedTokenId={selectedTokenId}
            onSelectToken={(id) => { onSelectToken(id); setMobileQueueOpen(false); setExpandedKey(null); }}
          />
        </div>
      )}

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left queue — desktop only */}
        <aside
          className="hidden md:flex flex-col border-r border-border bg-card shrink-0"
          style={{ width: '272px' }}
          aria-label="Token queue"
        >
          <TokenQueue
            tokens={tokens}
            corrections={corrections}
            context={context}
            level={level}
            selectedTokenId={selectedTokenId}
            onSelectToken={(id) => { onSelectToken(id); setExpandedKey(null); }}
          />
        </aside>

        {/* Right: main workspace */}
        <main className="flex-1 overflow-y-auto" style={{ minWidth: 0 }}>
          {!selectedToken ? (
            <div className="flex items-center justify-center h-full text-muted-foreground p-8">
              <p>Select a token from the queue to begin.</p>
            </div>
          ) : (
            <div className="px-4 py-5 sm:px-6">
              {/* Token header */}
              <div className="flex flex-wrap items-start gap-3 mb-5">
                <div
                  className="shrink-0 rounded border border-border"
                  style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: corrections.get(selectedToken.id) || selectedToken.hex,
                  }}
                  aria-hidden="true"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-foreground" style={{ fontFamily: "'DM Mono', monospace", fontSize: '1rem', fontWeight: 600 }}>
                      {selectedToken.name}
                    </h2>
                    <span
                      className="rounded px-2 py-0.5 text-muted-foreground border border-border"
                      style={{ fontSize: '0.75rem', fontFamily: "'DM Mono', monospace" }}
                    >
                      {corrections.has(selectedToken.id) ? (
                        <>
                          <span className="line-through opacity-50">{selectedToken.hex}</span>
                          {' → '}
                          <span className="text-[#047857]">{corrections.get(selectedToken.id)}</span>
                        </>
                      ) : selectedToken.hex}
                    </span>
                    <span
                      className="rounded px-2 py-0.5 border border-border"
                      style={{
                        fontSize: '0.75rem',
                        color: selectedToken.role === 'text' ? '#1B3A5C' : '#6D28D9',
                        backgroundColor: selectedToken.role === 'text' ? '#EFF6FF' : '#EDE9FE',
                        fontWeight: 500,
                      }}
                    >
                      {selectedToken.role === 'text' ? 'Text' : selectedToken.role === 'background' ? 'Background' : 'Both'}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-1" style={{ fontSize: '0.8125rem' }}>
                    {pairs.length} background{pairs.length !== 1 ? 's' : ''} checked ·{' '}
                    {context === 'body' ? 'Body text' : context === 'large' ? 'Large text' : 'UI component'} · WCAG {level} ·{' '}
                    required {getThreshold(context, level).toFixed(1)}:1
                  </p>
                </div>
              </div>

              {/* Contrast table */}
              {pairs.length === 0 ? (
                <p className="text-muted-foreground" style={{ fontSize: '0.875rem' }}>
                  No background tokens to check. Adjust token roles in the previous step.
                </p>
              ) : (
                <ContrastTable
                  selectedToken={selectedToken}
                  pairs={pairs}
                  expandedKey={expandedKey}
                  onExpandRow={setExpandedKey}
                  onApplyCorrection={handleApplyCorrection}
                />
              )}

              {/* Export section */}
              <div className="mt-8 pt-6 border-t border-border">
                <h3 className="text-foreground mb-1" style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                  Export
                </h3>
                <p className="text-muted-foreground mb-4" style={{ fontSize: '0.8125rem' }}>
                  Corrected tokens preserve the original {inputFormat === 'json' ? 'JSON' : inputFormat === 'css' ? 'CSS' : 'hex list'} format with failing values replaced.
                  {correctedCount === 0 && ' No corrections applied yet.'}
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleCopyTokens}
                    disabled={correctedCount === 0}
                    className={[
                      'flex items-center gap-2 rounded border px-4 py-2.5 transition-colors',
                      'focus-visible:outline-2 focus-visible:outline-[#1D4ED8] focus-visible:outline-offset-2',
                      correctedCount === 0
                        ? 'border-border text-muted-foreground opacity-50 cursor-not-allowed'
                        : 'border-[#1B3A5C] text-[#1B3A5C] hover:bg-[#EFF6FF] cursor-pointer',
                    ].join(' ')}
                    style={{ fontSize: '0.875rem', minHeight: '44px' }}
                    aria-label={correctedCount === 0 ? 'Copy corrected tokens — no corrections applied' : 'Copy corrected tokens to clipboard'}
                  >
                    <Copy size={14} aria-hidden="true" />
                    {copyStatus === 'copied' ? 'Copied!' : copyStatus === 'error' ? 'Failed' : 'Copy corrected tokens'}
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 rounded border border-border px-4 py-2.5 text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-[#1D4ED8] focus-visible:outline-offset-2 transition-colors cursor-pointer"
                    style={{ fontSize: '0.875rem', minHeight: '44px' }}
                  >
                    <Download size={14} aria-hidden="true" />
                    {csvStatus === 'done' ? 'Downloading…' : csvStatus === 'error' ? 'Error' : 'Export full matrix CSV'}
                  </button>
                </div>
                {correctedCount > 0 && (
                  <p className="mt-2 text-muted-foreground" style={{ fontSize: '0.8125rem' }}>
                    {correctedCount} correction{correctedCount !== 1 ? 's' : ''} applied across all tokens.
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="mt-auto">
            <AppFooter />
          </div>
        </main>
      </div>
    </div>
  );
}
