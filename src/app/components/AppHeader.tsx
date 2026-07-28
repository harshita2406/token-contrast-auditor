import { Link } from 'react-router-dom';
import { Check, Contrast } from 'lucide-react';

export type AppStep = 'input' | 'review' | 'results';

interface AppHeaderProps {
  /** Show the three-step progress rail (tool screens). Omit on the landing page. */
  step?: AppStep;
  /** Show a single "Try it" CTA linking to /audit instead of the step rail. Landing page only. */
  showTryIt?: boolean;
}

const STEPS: { id: AppStep; label: string }[] = [
  { id: 'input', label: 'Input' },
  { id: 'review', label: 'Review' },
  { id: 'results', label: 'Results' },
];

/**
 * The header is identical on every screen: logo mark, product name, and the
 * mono eyebrow, all left aligned. The only thing that ever changes is the
 * right-hand side — either the landing page's "Try it" CTA, or the tool's
 * step rail. Nothing else is ever added here; page-specific headings and the
 * "back" link live in each screen's own content area instead.
 */
export function AppHeader({ step, showTryIt }: AppHeaderProps) {
  const currentIndex = step ? STEPS.findIndex(s => s.id === step) : -1;

  return (
    <header className="tca-header">
      <div className="tca-header__inner tca-container">
        <Link to="/" className="tca-header__brand">
          <span className="tca-header__mark" aria-hidden="true">
            <Contrast size={16} />
          </span>
          <span className="tca-header__id">
            <span className="tca-header__title">Token Contrast Auditor</span>
            <span className="tca-header__eyebrow">WCAG 2.X · Design systems</span>
          </span>
        </Link>

        {step && (
          <div className="tca-header__right">
            <StepRail currentIndex={currentIndex} />
          </div>
        )}

        {showTryIt && (
          <Link to="/audit" className="tca-header__right tca-btn tca-btn--primary">
            Try it
          </Link>
        )}
      </div>
    </header>
  );
}

function StepRail({ currentIndex }: { currentIndex: number }) {
  return (
    <>
      <ol aria-label="Progress" className="tca-steps tca-steps--desktop">
        {STEPS.map((s, i) => {
          const status: 'complete' | 'current' | 'upcoming' =
            i < currentIndex ? 'complete' : i === currentIndex ? 'current' : 'upcoming';
          return (
            <li key={s.id} className={`tca-step tca-step--${status}`}>
              {i > 0 && <span className="tca-step__connector" aria-hidden="true" />}
              <div className="tca-step__inner" aria-current={status === 'current' ? 'step' : undefined}>
                <span className="tca-step__box" aria-hidden="true">
                  {status === 'complete' ? <Check size={12} strokeWidth={2.5} /> : i + 1}
                </span>
                <span className="tca-step__label">{s.label}</span>
              </div>
            </li>
          );
        })}
      </ol>
      <span className="tca-step-mobile">
        Step {currentIndex + 1} of {STEPS.length}
      </span>
    </>
  );
}
