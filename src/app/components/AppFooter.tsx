import { SelfAudit } from './SelfAudit';
import { BuiltBy } from './BuiltBy';

export function AppFooter() {
  return (
    <footer className="border-t border-border bg-card py-3 shrink-0">
      <div className="tca-container flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
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
