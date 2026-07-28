import { ChevronLeft } from 'lucide-react';
import type { AppToken, Role } from '../types';
import { AppHeader } from './AppHeader';
import { AppFooter } from './AppFooter';

interface RolesScreenProps {
  tokens: AppToken[];
  onRoleChange: (tokenId: string, role: Role) => void;
  onStartAudit: () => void;
  onBack: () => void;
}

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'background', label: 'Background' },
  { value: 'both', label: 'Both' },
];

function ColorSwatch({ hex }: { hex: string }) {
  return (
    <span
      className="tca-swatch inline-block shrink-0"
      style={{ width: '24px', height: '24px', backgroundColor: hex }}
      role="img"
      aria-label={hex}
    />
  );
}

export function RolesScreen({ tokens, onRoleChange, onStartAudit, onBack }: RolesScreenProps) {
  const textCount = tokens.filter(t => t.role === 'text' || t.role === 'both').length;
  const bgCount = tokens.filter(t => t.role === 'background' || t.role === 'both').length;
  const bothCount = tokens.filter(t => t.role === 'both').length;

  return (
    <div className="tca-page">
      <AppHeader step="review" />

      <div className="tca-page__head tca-container">
        <button onClick={onBack} className="tca-back-link">
          <ChevronLeft size={13} aria-hidden="true" />
          Back to input
        </button>
        <h1 className="tca-h1">Review inferred token roles</h1>
        <p className="tca-lede">
          {tokens.length} tokens — {textCount} foreground, {bgCount} background
        </p>
      </div>

      {/* Note + limitation */}
      <div className="tca-container tca-callouts-row">
        <div className="tca-panel tca-callout">
          <span className="tca-callout__label">Note</span>
          <p>
            Roles are inferred from naming conventions (<code>text-*</code>, <code>surface-*</code>, etc.) and luminance. Only foreground tokens are checked against background tokens. Change a role if the inference is wrong — your override persists for this session.
          </p>
        </div>

        {/* Known limitation: both-role tokens (PRD §9) */}
        <div className="tca-panel tca-callout">
          <span className="tca-callout__label">Limitation</span>
          <p>
            Tokens marked <em>Both</em> appear in the audit queue only under their text-role failures.
            {bothCount > 0
              ? ` ${bothCount} token${bothCount !== 1 ? 's' : ''} in this set ${bothCount !== 1 ? 'are' : 'is'} marked Both — ${bothCount !== 1 ? 'their' : 'its'} failures as a background are not shown as a separate count.`
              : ' If you mark a token Both, its failures as a background will not be shown as a separate count.'}
          </p>
        </div>
      </div>

      {/* Token table */}
      <main className="flex-1 tca-container overflow-x-auto" style={{ paddingTop: '24px', paddingBottom: '24px' }}>
        <table className="tca-table">
          <thead>
            <tr>
              <th scope="col" style={{ width: '40px' }}>
                <span className="sr-only">Colour</span>
              </th>
              <th scope="col">Token name</th>
              <th scope="col">Hex</th>
              <th scope="col">Role</th>
              <th scope="col" className="hidden sm:table-cell">Inference reason</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((token) => (
              <tr key={token.id}>
                <td>
                  <ColorSwatch hex={token.hex} />
                </td>
                <td style={{ fontFamily: 'var(--tca-mono)', fontSize: '0.8125rem' }}>
                  {token.name}
                </td>
                <td style={{ fontFamily: 'var(--tca-mono)', fontSize: '0.8125rem', color: 'var(--tca-muted)' }}>
                  {token.hex}
                </td>
                <td>
                  <RoleSelector
                    tokenId={token.id}
                    tokenName={token.name}
                    role={token.role}
                    userOverride={token.userOverride}
                    onChange={onRoleChange}
                  />
                </td>
                <td className="hidden sm:table-cell" style={{ fontSize: '0.8125rem', color: 'var(--tca-muted)' }}>
                  {token.userOverride ? (
                    <span className="italic">User override</span>
                  ) : (
                    <InferenceReason token={token} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>

      {/* Footer actions */}
      <div style={{ borderTop: 'var(--tca-hair) solid var(--tca-rule)' }}>
        <div className="tca-container" style={{ paddingTop: '16px', paddingBottom: '16px' }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p style={{ fontSize: '0.8125rem', color: 'var(--tca-muted)' }}>
              The audit checks all text-capable tokens against all background tokens.
            </p>
            <button
              onClick={onStartAudit}
              disabled={textCount === 0 || bgCount === 0}
              className="tca-btn tca-btn--primary"
              aria-disabled={textCount === 0 || bgCount === 0}
            >
              Start audit
            </button>
          </div>
          {(textCount === 0 || bgCount === 0) && (
            <p className="mt-2" style={{ fontSize: '0.8125rem', color: 'var(--tca-fail)' }}>
              {textCount === 0 ? 'No foreground tokens detected.' : 'No background tokens detected.'}{' '}
              Adjust token roles above.
            </p>
          )}
        </div>
      </div>

      <AppFooter />
    </div>
  );
}

function RoleSelector({ tokenId, tokenName, role, onChange }: {
  tokenId: string;
  tokenName: string;
  role: Role;
  userOverride: boolean;
  onChange: (id: string, role: Role) => void;
}) {
  return (
    <div role="group" aria-label={`Role for ${tokenName}`} className="flex gap-1 flex-wrap">
      {ROLE_OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(tokenId, opt.value)}
          aria-pressed={role === opt.value}
          className="tca-toggle"
          style={{ border: 'var(--tca-hair) solid var(--tca-rule)', minHeight: '32px' }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function InferenceReason({ token }: { token: AppToken }) {
  const name = token.name.toLowerCase();
  if (/^(text|fg|foreground|content|on|label|caption|heading|copy|type|ink)[\-_]/.test(name)) {
    return <span>Name matches <code>text-*</code> pattern</span>;
  }
  if (/^(bg|background|surface|canvas|fill|page|backdrop|overlay|base|layer|sheet)[\-_]/.test(name)) {
    return <span>Name matches <code>surface-*</code> pattern</span>;
  }
  if (token.luminance > 0.75) return <span>High luminance ({(token.luminance * 100).toFixed(0)}%) — likely background</span>;
  if (token.luminance < 0.25) return <span>Low luminance ({(token.luminance * 100).toFixed(0)}%) — likely text</span>;
  return <span>Mid-range luminance — ambiguous, assigned <em>Both</em></span>;
}
