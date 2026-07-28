import { Check, ChevronLeft, Contrast } from 'lucide-react';

export type AppStep = 'input' | 'review' | 'results';

interface AppHeaderProps {
  step: AppStep;
  onBackToInput?: () => void;
}

const STEPS: { id: AppStep; label: string }[] = [
  { id: 'input', label: 'Input' },
  { id: 'review', label: 'Review' },
  { id: 'results', label: 'Results' },
];

/**
 * Shared identity + progress header, rendered by every screen inside its own
 * <header className="bg-card border-b border-border"> wrapper so each screen
 * can attach a second row (a page-specific heading, or functional controls)
 * underneath before the single hairline border.
 */
export function AppHeader({ step, onBackToInput }: AppHeaderProps) {
  const currentIndex = STEPS.findIndex(s => s.id === step);

  return (
    <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
      {onBackToInput && (
        <>
          <button
            onClick={onBackToInput}
            className="flex items-center gap-1 shrink-0 text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-[#1D4ED8] focus-visible:outline-offset-2 rounded transition-colors"
            style={{ fontSize: '0.8125rem', minHeight: '44px' }}
          >
            <ChevronLeft size={14} aria-hidden="true" />
            <span className="hidden sm:inline">Back to input</span>
          </button>
          <div className="h-5 w-px bg-border shrink-0" aria-hidden="true" />
        </>
      )}

      {/* Logo mark + title */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className="shrink-0 flex items-center justify-center rounded-md bg-[#1B3A5C]"
          style={{ width: '28px', height: '28px' }}
          aria-hidden="true"
        >
          <Contrast size={16} className="text-white" />
        </div>
        <div className="min-w-0">
          <p className="truncate" style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#1B3A5C', lineHeight: 1.25 }}>
            Token Contrast Auditor
          </p>
          <p
            className="text-muted-foreground truncate"
            style={{ fontSize: '0.625rem', fontWeight: 600, letterSpacing: '0.06em', lineHeight: 1.4 }}
          >
            WCAG 2.X · DESIGN SYSTEMS
          </p>
        </div>
      </div>

      {/* Step progress indicator */}
      <ol aria-label="Progress" className="hidden md:flex items-center ml-auto">
        {STEPS.map((s, i) => {
          const status: 'complete' | 'current' | 'upcoming' =
            i < currentIndex ? 'complete' : i === currentIndex ? 'current' : 'upcoming';
          return (
            <li key={s.id} className="flex items-center">
              {i > 0 && (
                <div
                  className="shrink-0"
                  style={{ width: '28px', height: '1px', backgroundColor: 'var(--border)' }}
                  aria-hidden="true"
                />
              )}
              <div
                className="flex items-center gap-1.5 px-1.5"
                aria-current={status === 'current' ? 'step' : undefined}
              >
                <span
                  className="flex items-center justify-center rounded-full shrink-0"
                  style={{
                    width: '20px',
                    height: '20px',
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    backgroundColor: status === 'current' ? '#1B3A5C' : 'transparent',
                    border: status === 'current' ? 'none' : `1.5px solid ${status === 'complete' ? '#1B3A5C' : '#5E5E5E'}`,
                    color: status === 'current' ? '#FFFFFF' : status === 'complete' ? '#1B3A5C' : '#5E5E5E',
                  }}
                  aria-hidden="true"
                >
                  {status === 'complete' ? <Check size={12} strokeWidth={2.5} /> : i + 1}
                </span>
                <span
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: status === 'current' ? 600 : 400,
                    color: status === 'upcoming' ? '#5E5E5E' : '#1C1C1E',
                  }}
                >
                  {s.label}
                </span>
              </div>
            </li>
          );
        })}
      </ol>

      {/* Compact mobile fallback — the full step rail is hidden below md */}
      <span className="md:hidden ml-auto text-muted-foreground shrink-0" style={{ fontSize: '0.75rem' }}>
        Step {currentIndex + 1} of {STEPS.length}
      </span>
    </div>
  );
}
