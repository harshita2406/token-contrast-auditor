import { useRef, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, BookOpen } from 'lucide-react';
import type { AppToken, Context, Level, Verdict } from '../types';
import { contrastRatio, getThreshold, getVerdict } from '../utils/contrast';

interface TokenQueueProps {
  tokens: AppToken[];
  corrections: Map<string, string>;
  context: Context;
  level: Level;
  selectedTokenId: string | null;
  onSelectToken: (id: string) => void;
}

interface TokenStats {
  token: AppToken;
  effectiveHex: string;
  failureCount: number;
  worstVerdict: Verdict;
}

function getWorstVerdict(verdicts: Verdict[]): Verdict {
  if (verdicts.includes('Fail')) return 'Fail';
  if (verdicts.includes('NearMiss')) return 'NearMiss';
  if (verdicts.includes('LargeTextOnly')) return 'LargeTextOnly';
  return 'Pass';
}

const VERDICT_META: Record<Verdict, { label: string; Icon: React.ElementType; color: string; bg: string }> = {
  Pass: { label: 'Passes all', Icon: CheckCircle2, color: '#047857', bg: '#ECFDF5' },
  LargeTextOnly: { label: 'Large text only', Icon: BookOpen, color: '#6D28D9', bg: '#EDE9FE' },
  NearMiss: { label: 'Near miss', Icon: AlertTriangle, color: '#B45309', bg: '#FFFBEB' },
  Fail: { label: 'Failures', Icon: XCircle, color: '#B91C1C', bg: '#FEF2F2' },
};

export function TokenQueue({ tokens, corrections, context, level, selectedTokenId, onSelectToken }: TokenQueueProps) {
  const listRef = useRef<HTMLUListElement>(null);

  // Compute stats for each token
  const textTokens = tokens.filter(t => t.role === 'text' || t.role === 'both');
  const bgTokens = tokens.filter(t => t.role === 'background' || t.role === 'both');
  const threshold = getThreshold(context, level);

  const stats: TokenStats[] = textTokens.map(token => {
    const effectiveHex = corrections.get(token.id) || token.hex;
    const verdicts: Verdict[] = bgTokens
      .filter(bg => bg.id !== token.id)
      .map(bg => {
        const ratio = contrastRatio(effectiveHex, bg.hex);
        return getVerdict(ratio, context, level);
      });
    const failureCount = verdicts.filter(v => v !== 'Pass').length;
    const worstVerdict = getWorstVerdict(verdicts);
    return { token, effectiveHex, failureCount, worstVerdict };
  }).sort((a, b) => {
    // Sort: most failures first, then by worst verdict severity
    if (b.failureCount !== a.failureCount) return b.failureCount - a.failureCount;
    const order: Verdict[] = ['Fail', 'NearMiss', 'LargeTextOnly', 'Pass'];
    return order.indexOf(a.worstVerdict) - order.indexOf(b.worstVerdict);
  });

  const selectedIndex = stats.findIndex(s => s.token.id === selectedTokenId);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.min(index + 1, stats.length - 1);
      onSelectToken(stats[next].token.id);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = Math.max(index - 1, 0);
      onSelectToken(stats[prev].token.id);
    }
  };

  // Focus selected item when it changes
  useEffect(() => {
    const el = listRef.current?.querySelector('[aria-selected="true"]') as HTMLElement | null;
    if (el && document.activeElement && listRef.current?.contains(document.activeElement)) {
      el.focus();
    }
  }, [selectedTokenId]);

  return (
    <nav aria-label="Token queue" className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border">
        <p className="text-muted-foreground" style={{ fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Foreground tokens
        </p>
        <p className="text-muted-foreground mt-0.5" style={{ fontSize: '0.75rem' }}>
          {stats.length} tokens · sorted by failures
        </p>
      </div>
      <ul
        ref={listRef}
        role="listbox"
        aria-label="Token queue — select a token to audit"
        className="flex-1 overflow-y-auto"
      >
        {stats.map((s, index) => {
          const isSelected = s.token.id === selectedTokenId;
          const meta = VERDICT_META[s.worstVerdict];
          const isApplied = corrections.has(s.token.id);
          return (
            <li
              key={s.token.id}
              role="option"
              aria-selected={isSelected}
              tabIndex={isSelected ? 0 : -1}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onClick={() => onSelectToken(s.token.id)}
              className={[
                'flex items-center gap-3 px-4 py-3 border-b border-border cursor-pointer transition-colors',
                'focus-visible:outline-2 focus-visible:outline-[#1D4ED8] focus-visible:outline-offset-[-2px]',
                isSelected
                  ? 'bg-[#EFF6FF] border-l-2 border-l-[#1D4ED8]'
                  : 'hover:bg-muted/60 border-l-2 border-l-transparent',
              ].join(' ')}
              style={{ minHeight: '64px' }}
            >
              {/* Color swatch */}
              <span
                className="shrink-0 rounded-sm border border-border"
                style={{
                  width: '28px',
                  height: '28px',
                  backgroundColor: s.effectiveHex,
                  outline: isApplied ? '2px solid #047857' : 'none',
                  outlineOffset: '1px',
                }}
                aria-hidden="true"
              />

              {/* Token info */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-foreground truncate"
                  style={{ fontSize: '0.8125rem', fontFamily: "'DM Mono', monospace", fontWeight: isSelected ? 500 : 400 }}
                >
                  {s.token.name}
                  {isApplied && <span className="ml-1.5 text-[#047857]" style={{ fontSize: '0.7rem' }}>✓ corrected</span>}
                </p>
                <p className="text-muted-foreground" style={{ fontSize: '0.75rem', fontFamily: "'DM Mono', monospace" }}>
                  {s.effectiveHex}
                </p>
              </div>

              {/* Failure badge */}
              <div className="shrink-0 text-right">
                {s.failureCount === 0 ? (
                  <span
                    className="inline-flex items-center gap-1 rounded px-2 py-0.5"
                    style={{ fontSize: '0.7rem', color: meta.color, backgroundColor: meta.bg, fontWeight: 500 }}
                    aria-label="Passes all"
                  >
                    <meta.Icon size={10} aria-hidden="true" />
                    All pass
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1 rounded px-2 py-0.5"
                    style={{ fontSize: '0.7rem', color: meta.color, backgroundColor: meta.bg, fontWeight: 500 }}
                    aria-label={`${s.failureCount} failure${s.failureCount !== 1 ? 's' : ''}`}
                  >
                    <meta.Icon size={10} aria-hidden="true" />
                    {s.failureCount} failure{s.failureCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
