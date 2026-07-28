import { AppHeader } from './AppHeader';
import { AppFooter } from './AppFooter';

/**
 * Root route (/). Placeholder for now — reuses the same shared header and
 * footer as the audit tool at /audit, with no progress rail since there is
 * no audit-flow step to show here.
 */
export function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card border-b border-border">
        <AppHeader />
      </header>

      <main className="flex-1" />

      <AppFooter />
    </div>
  );
}
