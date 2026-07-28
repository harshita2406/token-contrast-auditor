import { useState, useRef } from 'react';
import { FileCode2, Hash, Variable, Loader2, AlertCircle, Shield } from 'lucide-react';
import type { ParseError } from '../types';
import { getSampleForFormat } from '../utils/sampleData';
import { AppHeader } from './AppHeader';
import { AppFooter } from './AppFooter';

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
    <div className="tca-page">
      <AppHeader step="input" />

      <div className="tca-page__head tca-container">
        <h1 className="tca-h1">Paste your colour tokens</h1>
        <p className="tca-lede">
          Find unsafe foreground/background pairs before they reach production. Supports JSON, CSS custom properties, and hex lists.
        </p>
      </div>

      {/* Main */}
      <main className="flex-1 tca-container" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
        <div className="tca-paste-grid">
          {/* Input column: format tabs + paste area, one bordered card */}
          <div className="tca-panel">
            <div role="tablist" aria-label="Token input format" className="tca-tabs">
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
                    className="tca-tab"
                  >
                    <tab.Icon size={14} aria-hidden="true" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div id="paste-panel" role="tabpanel" aria-labelledby={`tab-${format}`}>
              <div className="p-4">
                <label htmlFor="token-input" className="tca-section-label mb-2">
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
                  className={['tca-textarea mt-2', hasError ? 'tca-textarea--error' : ''].join(' ')}
                  style={{ fontSize: '0.8125rem', lineHeight: 1.6, minHeight: '240px' }}
                />
                <p id="paste-hint" className="mt-1.5" style={{ fontSize: '0.75rem', color: 'var(--tca-muted)' }}>
                  Flat or nested JSON, CSS custom properties, or hex values with names.
                </p>
              </div>

              {/* Error state */}
              {hasError && (
                <div id="parse-error" role="alert" className="tca-error mx-4 mb-4">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--tca-fail)' }} aria-hidden="true" />
                  <div>
                    <p className="tca-error__text">
                      {parseError.line ? `Line ${parseError.line}: ` : ''}{parseError.error}
                    </p>
                    {parseError.hint && <p className="tca-error__hint">{parseError.hint}</p>}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3" style={{ borderTop: 'var(--tca-hair) solid var(--tca-rule)', padding: '16px' }}>
                <button
                  onClick={onParse}
                  disabled={isParsing || !value.trim()}
                  aria-busy={isParsing}
                  className="tca-btn tca-btn--primary"
                >
                  {isParsing && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
                  {isParsing ? 'Parsing…' : 'Parse tokens'}
                </button>

                <button
                  onClick={onLoadSample}
                  disabled={isParsing}
                  className="tca-btn tca-btn--secondary"
                >
                  Load sample token set
                </button>

                <div className="ml-auto flex items-center gap-1.5" style={{ fontSize: '0.75rem', color: 'var(--tca-muted)' }}>
                  <Shield size={12} aria-hidden="true" />
                  <span>Processed in your browser. Nothing is saved.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Format guide: always visible, not a disclosure */}
          <div className="tca-panel p-4">
            <h2 className="tca-section-label mb-3">Format guide</h2>
            <div className="space-y-3" style={{ fontSize: '0.8125rem' }}>
              <div>
                <p style={{ fontWeight: 500 }}>JSON</p>
                <p className="mt-0.5" style={{ color: 'var(--tca-muted)' }}>Flat or nested objects. Values must be hex strings or <code>rgb(r, g, b)</code>. Nested keys are joined with hyphens.</p>
              </div>
              <div>
                <p style={{ fontWeight: 500 }}>CSS variables</p>
                <p className="mt-0.5" style={{ color: 'var(--tca-muted)' }}>Custom properties in the form <code>--name: value;</code>. The leading dashes are stripped from the token name.</p>
              </div>
              <div>
                <p style={{ fontWeight: 500 }}>Hex list</p>
                <p className="mt-0.5" style={{ color: 'var(--tca-muted)' }}>One entry per line. Optionally prefix a name: <code>text-primary #1F2937</code>. Bare hex values get auto-named.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
