import { useRef, Fragment } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import type { AppToken, ContrastPair, Verdict, CorrectionResult } from '../types';

interface ContrastTableProps {
  selectedToken: AppToken;
  pairs: ContrastPair[];
  expandedKey: string | null;
  onExpandRow: (key: string | null) => void;
  onApplyCorrection: (tokenId: string, correctedHex: string) => void;
}

// Verdict colours are the only colour in the interface — pass/warn/fail from
// brand.css. LargeTextOnly and NearMiss both read as "warn", matching the
// landing page's verdict chips; the icon still tells them apart.
const VERDICT_META: Record<Verdict, {
  label: string;
  Icon: React.ElementType;
  className: string;
  action: string;
}> = {
  Pass: {
    label: 'Pass',
    Icon: CheckCircle2,
    className: 'tca-chip--pass',
    action: 'No action needed.',
  },
  LargeTextOnly: {
    label: 'Large text only',
    Icon: BookOpen,
    className: 'tca-chip--warn',
    action: 'Acceptable for headings and large text (≥24px regular or ≥18.7px bold).',
  },
  NearMiss: {
    label: 'Near miss',
    Icon: AlertTriangle,
    className: 'tca-chip--warn',
    action: 'A small lightness adjustment may fix this pair — see suggestion.',
  },
  Fail: {
    label: 'Fail',
    Icon: XCircle,
    className: 'tca-chip--fail',
    action: 'Choose a different token or apply the suggested correction.',
  },
};

function formatRatio(r: number): string {
  return r.toFixed(1) + ':1';
}

export function ContrastTable({ selectedToken, pairs, expandedKey, onExpandRow, onApplyCorrection }: ContrastTableProps) {
  const tbodyRef = useRef<HTMLTableSectionElement>(null);

  const pairKey = (pair: ContrastPair) => `${selectedToken.id}::${pair.bgToken.id}`;

  const handleRowKeyDown = (e: React.KeyboardEvent<HTMLTableRowElement>, index: number) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const rows = tbodyRef.current?.querySelectorAll('tr[tabindex="0"]');
      if (rows && rows[index + 1]) (rows[index + 1] as HTMLElement).focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const rows = tbodyRef.current?.querySelectorAll('tr[tabindex="0"]');
      if (rows && rows[index - 1]) (rows[index - 1] as HTMLElement).focus();
    } else if (e.key === 'Enter') {
      const key = pairKey(pairs[index]);
      onExpandRow(expandedKey === key ? null : key);
    } else if (e.key === 'Escape') {
      onExpandRow(null);
    }
  };

  const passCount = pairs.filter(p => p.verdict === 'Pass').length;
  const failCount = pairs.filter(p => p.verdict !== 'Pass').length;

  return (
    <div className="mt-4">
      {/* Summary */}
      <p className="mb-3" style={{ fontSize: '0.8125rem', color: 'var(--tca-muted)' }}>
        {pairs.length} background{pairs.length !== 1 ? 's' : ''} checked —{' '}
        <span style={{ color: 'var(--tca-pass)', fontWeight: 500 }}>{passCount} pass</span>,{' '}
        <span style={{ color: failCount > 0 ? 'var(--tca-fail)' : 'var(--tca-muted)', fontWeight: failCount > 0 ? 500 : 400 }}>
          {failCount} need attention
        </span>
      </p>

      {/* Responsive wrapper */}
      <div className="overflow-x-auto" style={{ border: 'var(--tca-hair) solid var(--tca-rule)' }}>
        <table className="tca-table" aria-label={`Contrast pairs for ${selectedToken.name}`}>
          <thead>
            <tr>
              <th scope="col" style={{ minWidth: '100px' }}>Sample</th>
              <th scope="col" style={{ minWidth: '160px' }}>Background</th>
              <th scope="col" style={{ minWidth: '80px' }}>Ratio</th>
              <th scope="col" className="hidden sm:table-cell" style={{ minWidth: '80px' }}>Required</th>
              <th scope="col" style={{ minWidth: '140px' }}>Verdict</th>
              <th scope="col" className="hidden md:table-cell">Recommended action</th>
              <th scope="col" style={{ width: '48px' }}>
                <span className="sr-only">Expand</span>
              </th>
            </tr>
          </thead>
          <tbody ref={tbodyRef}>
            {pairs.map((pair, index) => {
              const key = pairKey(pair);
              const isExpanded = expandedKey === key;
              const meta = VERDICT_META[pair.verdict];
              const canExpand = pair.verdict === 'NearMiss' || pair.verdict === 'Fail';

              return (
                <Fragment key={key}>
                  <tr
                    tabIndex={0}
                    aria-expanded={canExpand ? isExpanded : undefined}
                    aria-label={`${selectedToken.name} on ${pair.bgToken.name}: ${formatRatio(pair.ratio)}, ${meta.label}`}
                    onKeyDown={(e) => handleRowKeyDown(e, index)}
                    onClick={() => canExpand && onExpandRow(isExpanded ? null : key)}
                    className={[isExpanded ? 'tca-row--active' : '', canExpand ? 'cursor-pointer' : ''].join(' ')}
                  >
                    {/* Sample */}
                    <td>
                      <div
                        style={{
                          backgroundColor: pair.bgToken.hex,
                          color: pair.fgHex,
                          padding: '6px 10px',
                          minWidth: '80px',
                          display: 'inline-block',
                          lineHeight: 1.4,
                          border: 'var(--tca-hair) solid var(--tca-rule)',
                        }}
                        aria-hidden="true"
                      >
                        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Aa</span>
                        <span style={{ fontSize: '0.75rem', marginLeft: '4px' }}>Sample</span>
                      </div>
                    </td>

                    {/* Background token */}
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="tca-swatch shrink-0" style={{ width: '18px', height: '18px', backgroundColor: pair.bgToken.hex }} aria-hidden="true" />
                        <div>
                          <p style={{ fontFamily: 'var(--tca-mono)', fontSize: '0.8125rem' }}>{pair.bgToken.name}</p>
                          <p style={{ fontFamily: 'var(--tca-mono)', fontSize: '0.75rem', color: 'var(--tca-muted)' }}>{pair.bgToken.hex}</p>
                        </div>
                      </div>
                    </td>

                    {/* Actual ratio */}
                    <td>
                      <span style={{ fontFamily: 'var(--tca-mono)', fontSize: '0.875rem', fontWeight: 500 }}>
                        {formatRatio(pair.ratio)}
                      </span>
                    </td>

                    {/* Required ratio */}
                    <td className="hidden sm:table-cell">
                      <span style={{ fontFamily: 'var(--tca-mono)', fontSize: '0.875rem', color: 'var(--tca-muted)' }}>
                        {formatRatio(pair.threshold)}
                      </span>
                    </td>

                    {/* Verdict */}
                    <td>
                      <span className={`tca-chip ${meta.className}`}>
                        <span className="tca-chip__dot" aria-hidden="true" />
                        <meta.Icon size={12} aria-hidden="true" />
                        {meta.label}
                      </span>
                    </td>

                    {/* Action text */}
                    <td className="hidden md:table-cell" style={{ fontSize: '0.8125rem', color: 'var(--tca-muted)' }}>
                      {meta.action}
                    </td>

                    {/* Expand toggle */}
                    <td className="text-right">
                      {canExpand && (
                        <span className="inline-flex items-center justify-center" style={{ width: '28px', height: '28px', color: 'var(--tca-muted)' }} aria-hidden="true">
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </span>
                      )}
                    </td>
                  </tr>

                  {/* Correction expansion */}
                  {isExpanded && canExpand && (
                    <tr className="tca-row--active">
                      <td colSpan={7} className="pb-4 pt-0">
                        <CorrectionPanel
                          fgToken={selectedToken}
                          fgHex={pair.fgHex}
                          bgToken={pair.bgToken}
                          correction={pair.correction}
                          threshold={pair.threshold}
                          originalRatio={pair.ratio}
                          onApply={(correctedHex) => {
                            onApplyCorrection(selectedToken.id, correctedHex);
                            onExpandRow(null);
                          }}
                          onCancel={() => onExpandRow(null)}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface CorrectionPanelProps {
  fgToken: AppToken;
  fgHex: string;
  bgToken: AppToken;
  correction: CorrectionResult | null;
  threshold: number;
  originalRatio: number;
  onApply: (correctedHex: string) => void;
  onCancel: () => void;
}

function CorrectionPanel({ fgToken, fgHex, bgToken, correction, threshold, originalRatio, onApply, onCancel }: CorrectionPanelProps) {
  const hasCorrection = correction !== null;

  return (
    <div className="tca-panel p-4 mt-1" style={{ fontSize: '0.875rem' }}>
      <p className="mb-3" style={{ fontWeight: 500 }}>
        Nearest passing colour for <span style={{ fontFamily: 'var(--tca-mono)' }}>{fgToken.name}</span> on{' '}
        <span style={{ fontFamily: 'var(--tca-mono)' }}>{bgToken.name}</span>
      </p>

      {!hasCorrection ? (
        <div className="tca-panel tca-panel--well flex gap-2.5 p-3">
          <XCircle size={15} className="shrink-0 mt-0.5" style={{ color: 'var(--tca-muted)' }} aria-hidden="true" />
          <p style={{ fontSize: '0.8125rem', color: 'var(--tca-muted)' }}>
            A lightness-only adjustment cannot make this pair pass at the required {threshold.toFixed(1)}:1 ratio.
            The hue and chroma would need to change too. Choose a different token.
          </p>
        </div>
      ) : (
        <>
          {/* Before/after comparison */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <p className="tca-section-label mb-1.5" style={{ fontSize: '0.7rem' }}>Before</p>
              <div
                className="flex items-center justify-center"
                style={{ backgroundColor: bgToken.hex, color: fgHex, height: '64px', border: 'var(--tca-hair) solid var(--tca-rule)' }}
                aria-label={`Before: ${fgHex} on ${bgToken.hex}`}
              >
                <span style={{ fontSize: '1.125rem', fontWeight: 500 }}>Aa Sample text</span>
              </div>
              <div className="mt-1.5 space-y-0.5">
                <p style={{ fontFamily: 'var(--tca-mono)', fontSize: '0.75rem', color: 'var(--tca-muted)' }}>{fgHex}</p>
              </div>
            </div>
            <div>
              <p className="tca-section-label mb-1.5" style={{ fontSize: '0.7rem' }}>After</p>
              <div
                className="flex items-center justify-center"
                style={{ backgroundColor: bgToken.hex, color: correction.hex, height: '64px', border: '1px solid var(--tca-pass)' }}
                aria-label={`After: ${correction.hex} on ${bgToken.hex}`}
              >
                <span style={{ fontSize: '1.125rem', fontWeight: 500 }}>Aa Sample text</span>
              </div>
              <div className="mt-1.5 space-y-0.5">
                <p style={{ fontFamily: 'var(--tca-mono)', fontSize: '0.75rem', color: 'var(--tca-muted)' }}>{correction.hex}</p>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="tca-panel tca-panel--well flex flex-wrap gap-4 mb-4 p-3">
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--tca-muted)' }}>Ratio before</p>
              <p style={{ fontFamily: 'var(--tca-mono)', fontWeight: 500, fontSize: '0.875rem', color: 'var(--tca-fail)' }}>
                {originalRatio.toFixed(1)}:1
              </p>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--tca-muted)' }}>Ratio after</p>
              <p style={{ fontFamily: 'var(--tca-mono)', fontWeight: 500, fontSize: '0.875rem', color: 'var(--tca-pass)' }}>
                {correction.ratio.toFixed(1)}:1
              </p>
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--tca-muted)' }}>Lightness change</p>
              <p style={{ fontFamily: 'var(--tca-mono)', fontWeight: 500, fontSize: '0.875rem' }}>
                {correction.deltaL > 0 ? '+' : ''}{(correction.deltaL * 100).toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Caveat */}
          <p className="mb-3" style={{ fontSize: '0.8125rem', color: 'var(--tca-muted)' }}>
            Correction holds hue and chroma constant, adjusting only lightness in OKLCH.
            Verify the result matches your design intent.
          </p>
        </>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-3">
        {hasCorrection && (
          <button onClick={() => onApply(correction.hex)} className="tca-btn tca-btn--primary" style={{ minHeight: '44px' }}>
            <CheckCircle2 size={14} aria-hidden="true" />
            Apply correction
          </button>
        )}
        <button onClick={onCancel} className="tca-btn tca-btn--secondary" style={{ minHeight: '44px' }}>
          {hasCorrection ? 'Cancel' : 'Close'}
        </button>
      </div>
    </div>
  );
}
