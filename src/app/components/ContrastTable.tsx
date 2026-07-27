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

const VERDICT_META: Record<Verdict, {
  label: string;
  Icon: React.ElementType;
  color: string;
  bg: string;
  action: string;
}> = {
  Pass: {
    label: 'Pass',
    Icon: CheckCircle2,
    color: '#047857',
    bg: '#ECFDF5',
    action: 'No action needed.',
  },
  LargeTextOnly: {
    label: 'Large text only',
    Icon: BookOpen,
    color: '#6D28D9',
    bg: '#EDE9FE',
    action: 'Acceptable for headings and large text (≥24px regular or ≥18.7px bold).',
  },
  NearMiss: {
    label: 'Near miss',
    Icon: AlertTriangle,
    color: '#B45309',
    bg: '#FFFBEB',
    action: 'A small lightness adjustment may fix this pair — see suggestion.',
  },
  Fail: {
    label: 'Fail',
    Icon: XCircle,
    color: '#B91C1C',
    bg: '#FEF2F2',
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
      <p className="text-muted-foreground mb-3" style={{ fontSize: '0.8125rem' }}>
        {pairs.length} background{pairs.length !== 1 ? 's' : ''} checked —{' '}
        <span style={{ color: '#047857', fontWeight: 500 }}>{passCount} pass</span>,{' '}
        <span style={{ color: failCount > 0 ? '#B91C1C' : '#5E5E5E', fontWeight: failCount > 0 ? 500 : 400 }}>
          {failCount} need attention
        </span>
      </p>

      {/* Responsive wrapper */}
      <div className="overflow-x-auto rounded border border-border">
        <table
          className="w-full border-collapse"
          style={{ fontSize: '0.875rem' }}
          aria-label={`Contrast pairs for ${selectedToken.name}`}
        >
          <thead>
            <tr className="bg-muted/40 border-b border-border">
              <th scope="col" className="text-left px-4 py-2.5 text-muted-foreground" style={{ fontWeight: 500, minWidth: '100px' }}>
                Sample
              </th>
              <th scope="col" className="text-left px-4 py-2.5 text-muted-foreground" style={{ fontWeight: 500, minWidth: '160px' }}>
                Background
              </th>
              <th scope="col" className="text-left px-4 py-2.5 text-muted-foreground" style={{ fontWeight: 500, minWidth: '80px' }}>
                Ratio
              </th>
              <th scope="col" className="text-left px-4 py-2.5 text-muted-foreground hidden sm:table-cell" style={{ fontWeight: 500, minWidth: '80px' }}>
                Required
              </th>
              <th scope="col" className="text-left px-4 py-2.5 text-muted-foreground" style={{ fontWeight: 500, minWidth: '140px' }}>
                Verdict
              </th>
              <th scope="col" className="text-left px-4 py-2.5 text-muted-foreground hidden md:table-cell" style={{ fontWeight: 500 }}>
                Recommended action
              </th>
              <th scope="col" className="px-4 py-2.5" style={{ width: '48px' }}>
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
                    className={[
                      'border-b border-border transition-colors',
                      isExpanded ? 'bg-[#F8F7FF]' : 'hover:bg-muted/30',
                      canExpand ? 'cursor-pointer' : '',
                      'focus-visible:outline-2 focus-visible:outline-[#1D4ED8] focus-visible:outline-offset-[-2px]',
                    ].join(' ')}
                  >
                    {/* Sample */}
                    <td className="px-4 py-3">
                      <div
                        className="rounded"
                        style={{
                          backgroundColor: pair.bgToken.hex,
                          color: pair.fgHex,
                          padding: '6px 10px',
                          minWidth: '80px',
                          display: 'inline-block',
                          lineHeight: 1.4,
                        }}
                        aria-hidden="true"
                      >
                        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Aa</span>
                        <span style={{ fontSize: '0.75rem', marginLeft: '4px' }}>Sample</span>
                      </div>
                    </td>

                    {/* Background token */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="shrink-0 rounded-sm border border-border"
                          style={{ width: '18px', height: '18px', backgroundColor: pair.bgToken.hex }}
                          aria-hidden="true"
                        />
                        <div>
                          <p className="text-foreground" style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.8125rem' }}>
                            {pair.bgToken.name}
                          </p>
                          <p className="text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.75rem' }}>
                            {pair.bgToken.hex}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Actual ratio */}
                    <td className="px-4 py-3">
                      <span
                        className="text-foreground"
                        style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.875rem', fontWeight: 500 }}
                      >
                        {formatRatio(pair.ratio)}
                      </span>
                    </td>

                    {/* Required ratio */}
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span
                        className="text-muted-foreground"
                        style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.875rem' }}
                      >
                        {formatRatio(pair.threshold)}
                      </span>
                    </td>

                    {/* Verdict */}
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 rounded px-2 py-1"
                        style={{
                          color: meta.color,
                          backgroundColor: meta.bg,
                          fontSize: '0.8125rem',
                          fontWeight: 500,
                        }}
                      >
                        <meta.Icon size={13} aria-hidden="true" />
                        {meta.label}
                      </span>
                    </td>

                    {/* Action text */}
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell" style={{ fontSize: '0.8125rem' }}>
                      {meta.action}
                    </td>

                    {/* Expand toggle */}
                    <td className="px-4 py-3 text-right">
                      {canExpand && (
                        <span
                          className="inline-flex items-center justify-center rounded text-muted-foreground"
                          style={{ width: '28px', height: '28px' }}
                          aria-hidden="true"
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </span>
                      )}
                    </td>
                  </tr>

                  {/* Correction expansion */}
                  {isExpanded && canExpand && (
                    <tr className="bg-[#F8F7FF]">
                      <td colSpan={7} className="px-4 pb-4 pt-0">
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
    <div
      className="rounded border border-[#C4B5FD] bg-white p-4 mt-1"
      style={{ fontSize: '0.875rem' }}
    >
      <p className="text-foreground mb-3" style={{ fontWeight: 500 }}>
        Nearest passing colour for <span style={{ fontFamily: "'DM Mono', monospace" }}>{fgToken.name}</span> on{' '}
        <span style={{ fontFamily: "'DM Mono', monospace" }}>{bgToken.name}</span>
      </p>

      {!hasCorrection ? (
        <div className="flex gap-2.5 rounded border border-border bg-muted/40 p-3">
          <XCircle size={15} className="shrink-0 text-muted-foreground mt-0.5" aria-hidden="true" />
          <p className="text-muted-foreground" style={{ fontSize: '0.8125rem' }}>
            A lightness-only adjustment cannot make this pair pass at the required {threshold.toFixed(1)}:1 ratio.
            The hue and chroma would need to change too. Choose a different token.
          </p>
        </div>
      ) : (
        <>
          {/* Before/after comparison */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <p className="text-muted-foreground mb-1.5" style={{ fontSize: '0.75rem', fontWeight: 500 }}>Before</p>
              <div
                className="rounded flex items-center justify-center border border-border"
                style={{ backgroundColor: bgToken.hex, color: fgHex, height: '64px' }}
                aria-label={`Before: ${fgHex} on ${bgToken.hex}`}
              >
                <span style={{ fontSize: '1.125rem', fontWeight: 500 }}>Aa Sample text</span>
              </div>
              <div className="mt-1.5 space-y-0.5">
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: '#5E5E5E' }}>
                  {fgHex}
                </p>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground mb-1.5" style={{ fontSize: '0.75rem', fontWeight: 500 }}>After</p>
              <div
                className="rounded flex items-center justify-center border border-[#047857]"
                style={{ backgroundColor: bgToken.hex, color: correction.hex, height: '64px' }}
                aria-label={`After: ${correction.hex} on ${bgToken.hex}`}
              >
                <span style={{ fontSize: '1.125rem', fontWeight: 500 }}>Aa Sample text</span>
              </div>
              <div className="mt-1.5 space-y-0.5">
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.75rem', color: '#5E5E5E' }}>
                  {correction.hex}
                </p>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-4 mb-4 p-3 rounded bg-muted/40 border border-border">
            <div>
              <p className="text-muted-foreground" style={{ fontSize: '0.75rem' }}>Ratio before</p>
              <p style={{ fontFamily: "'DM Mono', monospace", fontWeight: 500, fontSize: '0.875rem', color: '#B91C1C' }}>
                {originalRatio.toFixed(1)}:1
              </p>
            </div>
            <div>
              <p className="text-muted-foreground" style={{ fontSize: '0.75rem' }}>Ratio after</p>
              <p style={{ fontFamily: "'DM Mono', monospace", fontWeight: 500, fontSize: '0.875rem', color: '#047857' }}>
                {correction.ratio.toFixed(1)}:1
              </p>
            </div>
            <div>
              <p className="text-muted-foreground" style={{ fontSize: '0.75rem' }}>Lightness change</p>
              <p style={{ fontFamily: "'DM Mono', monospace", fontWeight: 500, fontSize: '0.875rem' }}>
                {correction.deltaL > 0 ? '+' : ''}{(correction.deltaL * 100).toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Caveat */}
          <p className="text-muted-foreground mb-3" style={{ fontSize: '0.8125rem' }}>
            Correction holds hue and chroma constant, adjusting only lightness in OKLCH.
            Verify the result matches your design intent.
          </p>
        </>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-3">
        {hasCorrection && (
          <button
            onClick={() => onApply(correction.hex)}
            className="flex items-center gap-1.5 rounded bg-[#1B3A5C] px-4 py-2 text-white hover:bg-[#142E4A] focus-visible:outline-2 focus-visible:outline-[#1D4ED8] focus-visible:outline-offset-2 transition-colors"
            style={{ fontSize: '0.875rem', fontWeight: 500, minHeight: '44px' }}
          >
            <CheckCircle2 size={14} aria-hidden="true" />
            Apply correction
          </button>
        )}
        <button
          onClick={onCancel}
          className="rounded border border-border px-4 py-2 text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-[#1D4ED8] focus-visible:outline-offset-2 transition-colors"
          style={{ fontSize: '0.875rem', minHeight: '44px' }}
        >
          {hasCorrection ? 'Cancel' : 'Close'}
        </button>
      </div>
    </div>
  );
}
