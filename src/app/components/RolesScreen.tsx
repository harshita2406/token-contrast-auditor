import { Info, AlertTriangle } from 'lucide-react';
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
      className="inline-block rounded-sm border border-border shrink-0"
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <AppHeader step="review" onBackToInput={onBack} />
        <div className="max-w-4xl mx-auto px-4 pb-6 sm:px-6">
          <h1 style={{ fontWeight: 600, fontSize: '1rem', lineHeight: 1.4, color: '#1B3A5C' }}>
            Review inferred token roles
          </h1>
          <p className="text-muted-foreground" style={{ fontSize: '0.8125rem' }}>
            {tokens.length} tokens — {textCount} foreground, {bgCount} background
          </p>
        </div>
      </header>

      {/* Info banner */}
      <div className="border-b border-border bg-[#EFF6FF] px-4 py-3 sm:px-6">
        <div className="max-w-4xl mx-auto flex gap-2.5">
          <Info size={15} className="mt-0.5 shrink-0 text-[#1D4ED8]" aria-hidden="true" />
          <p className="text-[#1E3A8A]" style={{ fontSize: '0.8125rem' }}>
            Roles are inferred from naming conventions (<code>text-*</code>, <code>surface-*</code>, etc.) and luminance. Only foreground tokens are checked against background tokens. Change a role if the inference is wrong — your override persists for this session.
          </p>
        </div>
      </div>

      {/* Known limitation: both-role tokens (PRD §9) */}
      <div className="border-b border-border bg-[#FFFBEB] px-4 py-3 sm:px-6">
        <div className="max-w-4xl mx-auto flex gap-2.5">
          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-[#B45309]" aria-hidden="true" />
          <p className="text-[#78350F]" style={{ fontSize: '0.8125rem' }}>
            <strong>Known limitation:</strong> tokens marked <em>Both</em> appear in the audit queue only under their text-role failures.
            {bothCount > 0
              ? ` ${bothCount} token${bothCount !== 1 ? 's' : ''} in this set ${bothCount !== 1 ? 'are' : 'is'} marked Both — ${bothCount !== 1 ? 'their' : 'its'} failures as a background are not shown as a separate count.`
              : ' If you mark a token Both, its failures as a background will not be shown as a separate count.'}
          </p>
        </div>
      </div>

      {/* Token table */}
      <main className="flex-1 px-4 py-6 sm:px-6 overflow-x-auto">
        <div className="max-w-4xl mx-auto">
          <table className="w-full border-collapse" style={{ fontSize: '0.875rem' }}>
            <thead>
              <tr className="border-b-2 border-border">
                <th scope="col" className="text-left pb-2 pr-4 text-muted-foreground" style={{ fontWeight: 500, width: '40px' }}>
                  <span className="sr-only">Colour</span>
                </th>
                <th scope="col" className="text-left pb-2 pr-4 text-muted-foreground" style={{ fontWeight: 500 }}>
                  Token name
                </th>
                <th scope="col" className="text-left pb-2 pr-4 text-muted-foreground" style={{ fontWeight: 500 }}>
                  Hex
                </th>
                <th scope="col" className="text-left pb-2 pr-4 text-muted-foreground" style={{ fontWeight: 500 }}>
                  Role
                </th>
                <th scope="col" className="text-left pb-2 text-muted-foreground hidden sm:table-cell" style={{ fontWeight: 500 }}>
                  Inference reason
                </th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((token) => (
                <tr key={token.id} className="border-b border-border hover:bg-muted/40 transition-colors">
                  <td className="py-3 pr-4">
                    <ColorSwatch hex={token.hex} />
                  </td>
                  <td className="py-3 pr-4 text-foreground" style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.8125rem' }}>
                    {token.name}
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.8125rem' }}>
                    {token.hex}
                  </td>
                  <td className="py-3 pr-4">
                    <RoleSelector
                      tokenId={token.id}
                      tokenName={token.name}
                      role={token.role}
                      userOverride={token.userOverride}
                      onChange={onRoleChange}
                    />
                  </td>
                  <td className="py-3 text-muted-foreground hidden sm:table-cell" style={{ fontSize: '0.8125rem' }}>
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
        </div>
      </main>

      {/* Footer actions */}
      <div className="border-t border-border bg-card px-4 py-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted-foreground" style={{ fontSize: '0.8125rem' }}>
            The audit checks all text-capable tokens against all background tokens.
          </p>
          <button
            onClick={onStartAudit}
            disabled={textCount === 0 || bgCount === 0}
            className={[
              'rounded px-5 py-2.5 text-primary-foreground',
              'focus-visible:outline-2 focus-visible:outline-[#1D4ED8] focus-visible:outline-offset-2',
              'transition-opacity',
              textCount === 0 || bgCount === 0
                ? 'opacity-50 cursor-not-allowed bg-[#1B3A5C]'
                : 'bg-[#1B3A5C] hover:bg-[#142E4A] cursor-pointer',
            ].join(' ')}
            style={{ fontSize: '0.875rem', fontWeight: 500, minHeight: '44px' }}
            aria-disabled={textCount === 0 || bgCount === 0}
          >
            Start audit
          </button>
        </div>
        {(textCount === 0 || bgCount === 0) && (
          <p className="max-w-4xl mx-auto mt-2 text-[#B91C1C]" style={{ fontSize: '0.8125rem' }}>
            {textCount === 0 ? 'No foreground tokens detected.' : 'No background tokens detected.'}{' '}
            Adjust token roles above.
          </p>
        )}
      </div>

      <AppFooter />
    </div>
  );
}

function RoleSelector({ tokenId, tokenName, role, userOverride, onChange }: {
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
          className={[
            'rounded border px-2.5 py-1 transition-colors',
            'focus-visible:outline-2 focus-visible:outline-[#1D4ED8] focus-visible:outline-offset-2',
            role === opt.value
              ? 'bg-[#1B3A5C] border-[#1B3A5C] text-white'
              : 'border-border text-muted-foreground hover:border-[#1B3A5C] hover:text-foreground',
          ].join(' ')}
          style={{ fontSize: '0.75rem', fontWeight: role === opt.value ? 500 : 400, minHeight: '32px' }}
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
    return <span>Name matches <code className="text-[#5E5E5E]">text-*</code> pattern</span>;
  }
  if (/^(bg|background|surface|canvas|fill|page|backdrop|overlay|base|layer|sheet)[\-_]/.test(name)) {
    return <span>Name matches <code className="text-[#5E5E5E]">surface-*</code> pattern</span>;
  }
  if (token.luminance > 0.75) return <span>High luminance ({(token.luminance * 100).toFixed(0)}%) — likely background</span>;
  if (token.luminance < 0.25) return <span>Low luminance ({(token.luminance * 100).toFixed(0)}%) — likely text</span>;
  return <span>Mid-range luminance — ambiguous, assigned <em>Both</em></span>;
}
