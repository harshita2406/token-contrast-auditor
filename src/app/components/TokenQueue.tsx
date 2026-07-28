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

// Verdict colours are the only colour in the interface — pass/warn/fail from
// brand.css. LargeTextOnly and NearMiss both read as "warn", same as the
// landing page's verdict chips; the icon still tells them apart.
const VERDICT_META: Record<Verdict, { label: string; Icon: React.ElementType; className: string }> = {
  Pass: { label: 'All pass', Icon: CheckCircle2, className: 'tca-chip--pass' },
  LargeTextOnly: { label: 'Large only', Icon: BookOpen, className: 'tca-chip--warn' },
  NearMiss: { label: 'Near miss', Icon: AlertTriangle, className: 'tca-chip--warn' },
  Fail: { label: 'Failures', Icon: XCircle, className: 'tca-chip--fail' },
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
      <div className="px-4 py-3" style={{ borderBottom: 'var(--tca-hair) solid var(--tca-rule)' }}>
        <p className="tca-section-label">Foreground tokens</p>
        <p className="mt-0.5" style={{ fontSize: '0.75rem', color: 'var(--tca-muted)' }}>
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
              className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
              style={{
                borderBottom: 'var(--tca-hair) solid var(--tca-rule)',
                borderLeft: isSelected ? '2px solid var(--tca-ink)' : '2px solid transparent',
                background: isSelected ? 'var(--tca-paper-alt)' : 'transparent',
                minHeight: '64px',
              }}
            >
              {/* Color swatch */}
              <span
                className="tca-swatch shrink-0"
                style={{
                  width: '28px',
                  height: '28px',
                  backgroundColor: s.effectiveHex,
                  outline: isApplied ? '2px solid var(--tca-pass)' : 'none',
                  outlineOffset: '1px',
                }}
                aria-hidden="true"
              />

              {/* Token info */}
              <div className="flex-1 min-w-0">
                <p
                  className="truncate"
                  style={{ fontSize: '0.8125rem', fontFamily: 'var(--tca-mono)', fontWeight: isSelected ? 500 : 400 }}
                >
                  {s.token.name}
                  {isApplied && <span className="ml-1.5" style={{ fontSize: '0.7rem', color: 'var(--tca-pass)' }}>✓ corrected</span>}
                </p>
                <p style={{ fontSize: '0.75rem', fontFamily: 'var(--tca-mono)', color: 'var(--tca-muted)' }}>
                  {s.effectiveHex}
                </p>
              </div>

              {/* Failure badge */}
              <div className="shrink-0 text-right">
                <span
                  className={`tca-chip ${meta.className}`}
                  aria-label={s.failureCount === 0 ? 'Passes all' : `${s.failureCount} failure${s.failureCount !== 1 ? 's' : ''}`}
                >
                  <span className="tca-chip__dot" aria-hidden="true" />
                  <meta.Icon size={10} aria-hidden="true" />
                  {s.failureCount === 0 ? 'All pass' : `${s.failureCount} failure${s.failureCount !== 1 ? 's' : ''}`}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
