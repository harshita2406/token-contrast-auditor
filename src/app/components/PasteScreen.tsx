import { useState, useRef } from 'react';
import { FileCode2, Hash, Variable, Loader2, AlertCircle, Shield } from 'lucide-react';
import type { ParseError } from '../types';
import { getSampleForFormat } from '../utils/sampleData';

interface PasteScreenProps {
  format: 'json' | 'css' | 'hex';
  value: string;
  parseStatus: 'idle' | 'parsing' | 'error';
  parseError: ParseError | null;
  onFormatChange: (format: 'json' | 'css' | 'hex') => void;
  onValueChange: (value: string) => void;
  onParse: () => void;
  onLoadSample: () => void;
}

const TABS: { id: 'json' | 'css' | 'hex'; label: string; Icon: React.ElementType; placeholder: string }[] = [
  { id: 'json', label: 'JSON', Icon: FileCode2, placeholder: '{\n  "text-primary": "#1F2937",\n  "surface-default": "#FFFFFF"\n}' },
  { id: 'css', label: 'CSS variables', Icon: Variable, placeholder: ':root {\n  --text-primary: #1F2937;\n  --surface-default: #FFFFFF;\n}' },
  { id: 'hex', label: 'Hex list', Icon: Hash, placeholder: 'text-primary #1F2937\nsurface-default #FFFFFF' },
];

export function PasteScreen({ format, value, parseStatus, parseError, onFormatChange, onValueChange, onParse, onLoadSample }: PasteScreenProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [focusedTab, setFocusedTab] = useState<number>(0);

  const isParsing = parseStatus === 'parsing';
  const hasError = parseStatus === 'error' && parseError;

  const handleTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = (index + 1) % TABS.length;
      setFocusedTab(next);
      onFormatChange(TABS[next].id);
      document.getElementById(`tab-${TABS[next].id}`)?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = (index - 1 + TABS.length) % TABS.length;
      setFocusedTab(prev);
      onFormatChange(TABS[prev].id);
      document.getElementById(`tab-${TABS[prev].id}`)?.focus();
    }
  };

  const currentTab = TABS.find(t => t.id === format)!;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-[#1B3A5C]" style={{ fontWeight: 600, fontSize: '1.25rem', lineHeight: 1.4 }}>
            Token Contrast Auditor
          </h1>
          <p className="text-muted-foreground mt-0.5" style={{ fontSize: '0.875rem' }}>
            Find unsafe foreground and background token pairs before they reach production.
          </p>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 px-4 py-10 sm:px-6">
        <div className="max-w-3xl mx-auto">
          {/* Format tabs */}
          <div
            role="tablist"
            aria-label="Token input format"
            className="flex gap-1 border-b border-border mb-0"
          >
            {TABS.map((tab, index) => {
              const isSelected = tab.id === format;
              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  role="tab"
                  aria-selected={isSelected}
                  aria-controls="paste-panel"
                  tabIndex={isSelected ? 0 : -1}
                  onKeyDown={(e) => handleTabKeyDown(e, index)}
                  onClick={() => { setFocusedTab(index); onFormatChange(tab.id); }}
                  className={[
                    'flex items-center gap-1.5 px-4 py-2.5 border-b-2 -mb-px transition-colors',
                    'focus-visible:outline-2 focus-visible:outline-[#1D4ED8] focus-visible:outline-offset-2 rounded-t',
                    isSelected
                      ? 'border-[#1B3A5C] text-[#1B3A5C]'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
                  ].join(' ')}
                  style={{ fontSize: '0.875rem', fontWeight: isSelected ? 500 : 400, minHeight: '44px' }}
                >
                  <tab.Icon size={14} aria-hidden="true" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Paste area */}
          <div
            id="paste-panel"
            role="tabpanel"
            aria-labelledby={`tab-${format}`}
            className="bg-card border border-t-0 border-border rounded-b"
          >
            <div className="p-4">
              <label
                htmlFor="token-input"
                className="block mb-2 text-foreground"
                style={{ fontSize: '0.875rem', fontWeight: 500 }}
              >
                {currentTab.label} token input
              </label>
              <textarea
                ref={textareaRef}
                id="token-input"
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
                placeholder={currentTab.placeholder}
                spellCheck={false}
                aria-describedby={hasError ? 'parse-error' : 'paste-hint'}
                aria-invalid={hasError ? 'true' : 'false'}
                className={[
                  'w-full resize-none rounded border p-3 text-foreground bg-[#F2F1EE]',
                  'focus-visible:outline-2 focus-visible:outline-[#1D4ED8] focus-visible:outline-offset-2',
                  'transition-colors',
                  hasError ? 'border-[#B91C1C]' : 'border-border',
                ].join(' ')}
                style={{
                  fontFamily: "'DM Mono', 'Courier New', monospace",
                  fontSize: '0.8125rem',
                  lineHeight: 1.6,
                  minHeight: '240px',
                }}
              />
              <p id="paste-hint" className="mt-1.5 text-muted-foreground" style={{ fontSize: '0.75rem' }}>
                Flat or nested JSON, CSS custom properties, or hex values with names.
              </p>
            </div>

            {/* Error state */}
            {hasError && (
              <div
                id="parse-error"
                role="alert"
                className="mx-4 mb-4 flex gap-3 rounded border border-[#B91C1C] bg-[#FEF2F2] p-3"
              >
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-[#B91C1C]" aria-hidden="true" />
                <div>
                  <p className="text-[#B91C1C]" style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                    {parseError.line ? `Line ${parseError.line}: ` : ''}{parseError.error}
                  </p>
                  {parseError.hint && (
                    <p className="mt-0.5 text-[#7F1D1D]" style={{ fontSize: '0.8125rem' }}>
                      {parseError.hint}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3 border-t border-border px-4 py-3">
              <button
                onClick={onParse}
                disabled={isParsing || !value.trim()}
                aria-busy={isParsing}
                className={[
                  'flex items-center gap-2 rounded px-5 py-2.5 text-primary-foreground',
                  'focus-visible:outline-2 focus-visible:outline-[#1D4ED8] focus-visible:outline-offset-2',
                  'transition-opacity',
                  isParsing || !value.trim()
                    ? 'opacity-50 cursor-not-allowed bg-[#1B3A5C]'
                    : 'bg-[#1B3A5C] hover:bg-[#142E4A] cursor-pointer',
                ].join(' ')}
                style={{ fontSize: '0.875rem', fontWeight: 500, minHeight: '44px' }}
              >
                {isParsing && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
                {isParsing ? 'Parsing…' : 'Parse tokens'}
              </button>

              <button
                onClick={onLoadSample}
                disabled={isParsing}
                className={[
                  'rounded border border-border px-4 py-2.5 text-foreground',
                  'hover:bg-muted focus-visible:outline-2 focus-visible:outline-[#1D4ED8] focus-visible:outline-offset-2',
                  'transition-colors',
                  isParsing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                ].join(' ')}
                style={{ fontSize: '0.875rem', minHeight: '44px' }}
              >
                Load sample token set
              </button>

              <div className="ml-auto flex items-center gap-1.5 text-muted-foreground" style={{ fontSize: '0.75rem' }}>
                <Shield size={12} aria-hidden="true" />
                <span>Processed in your browser. Nothing is saved.</span>
              </div>
            </div>
          </div>

          {/* Format guide */}
          <details className="mt-6 rounded border border-border bg-card">
            <summary
              className="cursor-pointer select-none px-4 py-3 text-foreground hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-[#1D4ED8] rounded"
              style={{ fontSize: '0.875rem', fontWeight: 500 }}
            >
              Format guide
            </summary>
            <div className="border-t border-border px-4 py-4 space-y-3" style={{ fontSize: '0.8125rem' }}>
              <div>
                <p className="text-foreground" style={{ fontWeight: 500 }}>JSON</p>
                <p className="text-muted-foreground mt-0.5">Flat or nested objects. Values must be hex strings or <code>rgb(r, g, b)</code>. Nested keys are joined with hyphens.</p>
              </div>
              <div>
                <p className="text-foreground" style={{ fontWeight: 500 }}>CSS variables</p>
                <p className="text-muted-foreground mt-0.5">Custom properties in the form <code>--name: value;</code>. The leading dashes are stripped from the token name.</p>
              </div>
              <div>
                <p className="text-foreground" style={{ fontWeight: 500 }}>Hex list</p>
                <p className="text-muted-foreground mt-0.5">One entry per line. Optionally prefix a name: <code>text-primary #1F2937</code>. Bare hex values get auto-named.</p>
              </div>
            </div>
          </details>
        </div>
      </main>

      <footer className="border-t border-border px-6 py-3">
        <p className="max-w-3xl mx-auto text-muted-foreground text-center" style={{ fontSize: '0.75rem' }}>
          This interface's colour tokens are verified at WCAG AA.
        </p>
      </footer>
    </div>
  );
}
