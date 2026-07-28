import { SelfAudit } from './SelfAudit';
import { BuiltBy } from './BuiltBy';

export function AppFooter() {
  return (
    <footer className="border-t border-border bg-card px-4 py-3 sm:px-6 shrink-0">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="text-muted-foreground" style={{ fontSize: '0.75rem' }}>
          © 2026 Token Contrast Auditor
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <SelfAudit />
          <BuiltBy />
          <p className="text-muted-foreground" style={{ fontSize: '0.75rem' }}>
            Processed locally · Nothing stored
          </p>
        </div>
      </div>
    </footer>
  );
}
