import { useState, useCallback } from 'react';
import type { AppToken, ParseError, Role, Context, Level } from './types';
import { wcagLuminance, getThreshold, contrastRatio } from './utils/contrast';
import { inferRole } from './utils/roleInference';
import { parseJSON, parseCSS, parseHexList } from './utils/tokenParser';
import { getSampleForFormat } from './utils/sampleData';
import { PasteScreen } from './components/PasteScreen';
import { RolesScreen } from './components/RolesScreen';
import { AuditWorkspace } from './components/AuditWorkspace';

type Screen = 'paste' | 'roles' | 'audit';
type InputFormat = 'json' | 'css' | 'hex';
type ParseStatus = 'idle' | 'parsing' | 'error';

export default function App() {
  const [screen, setScreen] = useState<Screen>('paste');
  const [inputFormat, setInputFormat] = useState<InputFormat>('json');
  const [inputValue, setInputValue] = useState(() => getSampleForFormat('json'));
  const [parseStatus, setParseStatus] = useState<ParseStatus>('idle');
  const [parseError, setParseError] = useState<ParseError | null>(null);
  const [tokens, setTokens] = useState<AppToken[]>([]);
  const [context, setContext] = useState<Context>('body');
  const [level, setLevel] = useState<Level>('AA');
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [corrections, setCorrections] = useState<Map<string, string>>(new Map());

  const handleFormatChange = useCallback((format: InputFormat) => {
    setInputFormat(format);
    setParseStatus('idle');
    setParseError(null);
  }, []);

  const handleLoadSample = useCallback(() => {
    setInputValue(getSampleForFormat(inputFormat));
    setParseStatus('idle');
    setParseError(null);
  }, [inputFormat]);

  const handleParse = useCallback(() => {
    setParseStatus('parsing');
    setParseError(null);

    // Minimal delay so the parsing state is visible
    setTimeout(() => {
      const input = inputValue.trim();
      let result;
      if (inputFormat === 'json') result = parseJSON(input);
      else if (inputFormat === 'css') result = parseCSS(input);
      else result = parseHexList(input);

      if ('error' in result) {
        setParseStatus('error');
        setParseError(result as ParseError);
        return;
      }

      // Build AppToken list
      const appTokens: AppToken[] = result.map(pt => {
        const lum = wcagLuminance(pt.hex);
        return {
          id: pt.name,
          name: pt.name,
          hex: pt.hex,
          role: inferRole(pt.name, pt.hex),
          userOverride: false,
          luminance: lum,
        };
      });

      setTokens(appTokens);
      setCorrections(new Map());
      setParseStatus('idle');
      setScreen('roles');
    }, 280);
  }, [inputFormat, inputValue]);

  const handleRoleChange = useCallback((tokenId: string, role: Role) => {
    setTokens(prev => prev.map(t =>
      t.id === tokenId ? { ...t, role, userOverride: true } : t
    ));
  }, []);

  const handleStartAudit = useCallback(() => {
    const textTokens = tokens.filter(t => t.role === 'text' || t.role === 'both');
    const bgTokens = tokens.filter(t => t.role === 'background' || t.role === 'both');
    const threshold = getThreshold(context, level);

    // Auto-select token with most failures
    let worstId: string | null = textTokens[0]?.id ?? null;
    let worstCount = -1;
    for (const fg of textTokens) {
      const fgHex = corrections.get(fg.id) || fg.hex;
      const count = bgTokens.filter(bg =>
        bg.id !== fg.id && contrastRatio(fgHex, bg.hex) < threshold
      ).length;
      if (count > worstCount) {
        worstCount = count;
        worstId = fg.id;
      }
    }

    setSelectedTokenId(worstId);
    setScreen('audit');
  }, [tokens, context, level, corrections]);

  const handleApplyCorrection = useCallback((tokenId: string, correctedHex: string) => {
    setCorrections(prev => {
      const next = new Map(prev);
      next.set(tokenId, correctedHex);
      return next;
    });
  }, []);

  const handleUndoCorrection = useCallback((tokenId: string) => {
    setCorrections(prev => {
      const next = new Map(prev);
      next.delete(tokenId);
      return next;
    });
  }, []);

  if (screen === 'paste') {
    return (
      <PasteScreen
        format={inputFormat}
        value={inputValue}
        parseStatus={parseStatus}
        parseError={parseError}
        onFormatChange={handleFormatChange}
        onValueChange={setInputValue}
        onParse={handleParse}
        onLoadSample={handleLoadSample}
      />
    );
  }

  if (screen === 'roles') {
    return (
      <RolesScreen
        tokens={tokens}
        onRoleChange={handleRoleChange}
        onStartAudit={handleStartAudit}
        onBack={() => { setScreen('paste'); setParseStatus('idle'); }}
      />
    );
  }

  return (
    <AuditWorkspace
      tokens={tokens}
      corrections={corrections}
      context={context}
      level={level}
      selectedTokenId={selectedTokenId}
      inputFormat={inputFormat}
      inputValue={inputValue}
      onContextChange={setContext}
      onLevelChange={setLevel}
      onSelectToken={setSelectedTokenId}
      onApplyCorrection={handleApplyCorrection}
      onUndoCorrection={handleUndoCorrection}
      onBack={() => setScreen('roles')}
    />
  );
}
