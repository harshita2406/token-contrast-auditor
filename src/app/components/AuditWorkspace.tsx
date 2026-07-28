import { useState, useMemo } from 'react';
import {
  Copy, Download, CheckCircle2, RotateCcw, Menu, X, ChevronLeft
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
    <div className="tca-page" style={{ maxHeight: '100dvh', overflow: 'hidden' }}>
      <AppHeader step="results" />

      {/* Toolbar */}
      <div className="tca-toolbar" style={{ borderBottom: 'var(--tca-hair) solid var(--tca-rule)' }}>
        <button onClick={onBack} className="tca-back-link">
          <ChevronLeft size={13} aria-hidden="true" />
          Back to input
        </button>

        <div className="tca-toolbar__controls">
          {/* Context selector */}
          <div className="tca-toggle-group">
            {CONTEXT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => { onContextChange(opt.value); setExpandedKey(null); }}
                aria-pressed={context === opt.value}
                title={opt.description}
                className="tca-toggle"
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Level selector */}
          <div className="tca-toggle-group">
            {(['AA', 'AAA'] as Level[]).map(l => (
              <button
                key={l}
                onClick={() => { onLevelChange(l); setExpandedKey(null); }}
                aria-pressed={level === l}
                className="tca-toggle"
              >
                {l}
              </button>
            ))}
          </div>

          {/* Mobile queue toggle */}
          <button
            onClick={() => setMobileQueueOpen(v => !v)}
            className="md:hidden tca-btn tca-btn--secondary"
            style={{ minHeight: '40px', padding: '0 14px', fontSize: '11px' }}
            aria-expanded={mobileQueueOpen}
            aria-controls="mobile-queue"
          >
            {mobileQueueOpen ? <X size={14} aria-hidden="true" /> : <Menu size={14} aria-hidden="true" />}
            Tokens
          </button>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div role="status" aria-live="polite" className="tca-notice">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="shrink-0" style={{ color: 'var(--tca-pass)' }} aria-hidden="true" />
            <span style={{ fontSize: '0.875rem' }}>{notification.message}</span>
          </div>
          <button
            onClick={() => handleUndo(notification.tokenId)}
            className="tca-btn tca-btn--secondary"
            style={{ minHeight: '36px', padding: '0 14px', fontSize: '11px' }}
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
          className="md:hidden shrink-0"
          style={{ maxHeight: '40vh', overflow: 'hidden', borderBottom: 'var(--tca-hair) solid var(--tca-rule)' }}
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
          className="hidden md:flex flex-col shrink-0"
          style={{ width: '272px', borderRight: 'var(--tca-hair) solid var(--tca-rule)' }}
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
            <div className="flex items-center justify-center h-full p-8" style={{ color: 'var(--tca-muted)' }}>
              <p>Select a token from the queue to begin.</p>
            </div>
          ) : (
            <div className="px-4 py-5 sm:px-6">
              {/* Token header */}
              <div className="flex flex-wrap items-start gap-3 mb-5">
                <div
                  className="tca-swatch shrink-0"
                  style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: corrections.get(selectedToken.id) || selectedToken.hex,
                  }}
                  aria-hidden="true"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 style={{ fontFamily: 'var(--tca-mono)', fontSize: '1rem', fontWeight: 600 }}>
                      {selectedToken.name}
                    </h2>
                    <span
                      className="tca-badge"
                      style={{ fontFamily: 'var(--tca-mono)', textTransform: 'none', letterSpacing: 'normal', fontSize: '0.75rem' }}
                    >
                      {corrections.has(selectedToken.id) ? (
                        <>
                          <span className="line-through opacity-50">{selectedToken.hex}</span>
                          {' → '}
                          <span style={{ color: 'var(--tca-pass)' }}>{corrections.get(selectedToken.id)}</span>
                        </>
                      ) : selectedToken.hex}
                    </span>
                    <span className="tca-badge">
                      {selectedToken.role === 'text' ? 'Text' : selectedToken.role === 'background' ? 'Background' : 'Both'}
                    </span>
                  </div>
                  <p className="mt-1" style={{ fontSize: '0.8125rem', color: 'var(--tca-muted)' }}>
                    {pairs.length} background{pairs.length !== 1 ? 's' : ''} checked ·{' '}
                    {context === 'body' ? 'Body text' : context === 'large' ? 'Large text' : 'UI component'} · WCAG {level} ·{' '}
                    required {getThreshold(context, level).toFixed(1)}:1
                  </p>
                </div>
              </div>

              {/* Contrast table */}
              {pairs.length === 0 ? (
                <p style={{ fontSize: '0.875rem', color: 'var(--tca-muted)' }}>
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
              <div className="mt-8 pt-6" style={{ borderTop: 'var(--tca-hair) solid var(--tca-rule)' }}>
                <h3 className="tca-section-label mb-2">Export</h3>
                <p className="mb-4" style={{ fontSize: '0.8125rem', color: 'var(--tca-muted)' }}>
                  Corrected tokens preserve the original {inputFormat === 'json' ? 'JSON' : inputFormat === 'css' ? 'CSS' : 'hex list'} format with failing values replaced.
                  {correctedCount === 0 && ' No corrections applied yet.'}
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleCopyTokens}
                    disabled={correctedCount === 0}
                    className="tca-btn tca-btn--secondary"
                    aria-label={correctedCount === 0 ? 'Copy corrected tokens — no corrections applied' : 'Copy corrected tokens to clipboard'}
                  >
                    <Copy size={14} aria-hidden="true" />
                    {copyStatus === 'copied' ? 'Copied!' : copyStatus === 'error' ? 'Failed' : 'Copy corrected tokens'}
                  </button>
                  <button onClick={handleExportCSV} className="tca-btn tca-btn--secondary">
                    <Download size={14} aria-hidden="true" />
                    {csvStatus === 'done' ? 'Downloading…' : csvStatus === 'error' ? 'Error' : 'Export full matrix CSV'}
                  </button>
                </div>
                {correctedCount > 0 && (
                  <p className="mt-2" style={{ fontSize: '0.8125rem', color: 'var(--tca-muted)' }}>
                    {correctedCount} correction{correctedCount !== 1 ? 's' : ''} applied across all tokens.
                  </p>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      <AppFooter />
    </div>
  );
}
