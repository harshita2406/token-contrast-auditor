import { useId, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { runSelfAudit } from '../utils/selfAudit';

/**
 * Live self-audit for AC9: "The tool's own colour tokens pass its own audit
 * at AA. This result is displayed publicly on the page." The pill's label
 * and the three ratios in the panel are computed on mount from the
 * interface's actual CSS custom properties via runSelfAudit() — nothing
 * here is a hardcoded string. If a pair fails, the pill switches to the
 * danger colour and reads "UI fails WCAG AA"; the threshold is never
 * adjusted to force a pass.
 */
export function SelfAudit() {
  const panelId = useId();
  const [expanded, setExpanded] = useState(false);
  const results = useMemo(() => runSelfAudit(), []);
  const allPass = results.every(r => r.pass);
  const color = allPass ? '#047857' : '#B91C1C';
  const bg = allPass ? '#ECFDF5' : '#FEF2F2';

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        onKeyDown={(e) => { if (e.key === 'Escape') setExpanded(false); }}
        aria-expanded={expanded}
        aria-controls={panelId}
        className="inline-flex items-center gap-1.5 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-[#1D4ED8] focus-visible:outline-offset-2 cursor-pointer"
        style={{ fontSize: '0.75rem', fontWeight: 500, color, backgroundColor: bg, padding: '4px 10px 4px 8px' }}
      >
        <span className="rounded-full shrink-0" style={{ width: '6px', height: '6px', backgroundColor: color }} aria-hidden="true" />
        {allPass ? 'UI verified at WCAG AA' : 'UI fails WCAG AA'}
        {expanded ? <ChevronUp size={12} aria-hidden="true" /> : <ChevronDown size={12} aria-hidden="true" />}
      </button>

      <div
        id={panelId}
        hidden={!expanded}
        role="region"
        aria-label="Self-audit detail: this interface's own colour tokens"
        className="absolute z-10 rounded border border-border bg-card shadow-md"
        style={{ bottom: 'calc(100% + 8px)', left: 0, minWidth: '300px', padding: '10px 12px' }}
      >
        <ul className="space-y-1.5">
          {results.map(r => (
            <li key={r.label} className="flex items-center justify-between gap-4" style={{ fontSize: '0.75rem' }}>
              <span className="text-foreground">{r.label}</span>
              <span className="flex items-center gap-2 shrink-0">
                <span className="text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                  {r.ratio.toFixed(1)}:1
                </span>
                <span className="text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                  needs {r.threshold.toFixed(1)}:1
                </span>
                <span style={{ fontWeight: 600, color: r.pass ? '#047857' : '#B91C1C' }}>
                  {r.pass ? 'Pass' : 'Fail'}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
