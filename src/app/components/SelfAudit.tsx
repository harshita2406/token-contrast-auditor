import { useMemo } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { runSelfAudit } from '../utils/selfAudit';

/**
 * Live self-audit for AC9: "The tool's own colour tokens pass its own audit
 * at AA. This result is displayed publicly on the page." The ratios below
 * are computed on mount from the interface's actual CSS custom properties,
 * not asserted. If a pair fails, it is shown as a fail — the threshold is
 * never adjusted to force a pass.
 */
export function SelfAudit() {
  const results = useMemo(() => runSelfAudit(), []);
  const allPass = results.every(r => r.pass);

  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-4 gap-y-1.5"
      aria-label="This interface's own colour tokens, audited live against WCAG AA"
    >
      <span className="text-muted-foreground" style={{ fontSize: '0.75rem' }}>
        Own colour tokens, audited live against WCAG AA{allPass ? ' — all pass:' : ':'}
      </span>
      {results.map(r => {
        const Icon = r.pass ? CheckCircle2 : XCircle;
        const color = r.pass ? '#047857' : '#B91C1C';
        return (
          <span
            key={r.label}
            className="inline-flex items-center gap-1"
            style={{ fontSize: '0.75rem', fontWeight: 500, color }}
          >
            <Icon size={11} aria-hidden="true" />
            {r.label} {r.ratio.toFixed(1)}:1 — {r.pass ? 'Pass' : 'Fail'}
            <span className="text-muted-foreground" style={{ fontWeight: 400 }}>
              (needs {r.threshold.toFixed(1)}:1)
            </span>
          </span>
        );
      })}
    </div>
  );
}
