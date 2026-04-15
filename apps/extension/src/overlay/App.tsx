import { useState, useEffect } from 'react';
import type { ExplanationResponse, ApiError } from '@thegist/shared';
import { ExplanationPanel } from '../components/ExplanationPanel';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { colors, fonts } from '../lib/theme';
import { SettingsButton } from '../components/SettingsButton';

type OverlayState = 'waiting' | 'loading' | 'result' | 'error';

export default function OverlayApp() {
  const [state, setState] = useState<OverlayState>('waiting');
  const [result, setResult] = useState<ExplanationResponse | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [inputLabel, setInputLabel] = useState('');

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const { data } = e;
      if (!data || typeof data.type !== 'string') return;

      switch (data.type) {
        case 'EXPLAIN_START':
          setState('loading');
          if (data.text) {
            setInputLabel(data.text.length > 60 ? data.text.slice(0, 59) + '\u2026' : data.text);
          }
          break;
        case 'EXPLAIN_RESULT':
          setResult(data.result);
          setState('result');
          break;
        case 'EXPLAIN_ERROR':
          setError(data.error || { code: 'unknown', message: 'Unknown error', userMessage: 'Something went wrong.' });
          setState('error');
          break;
      }
    }

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  function handleClose() {
    parent.postMessage({ type: 'CLOSE_OVERLAY' }, '*');
  }

  if (state === 'waiting') {
    return (
      <div className="h-screen bg-darker flex flex-col items-center justify-center p-4 gap-3">
        <p className="text-[13px] text-white/40 text-center" style={{ fontFamily: fonts.vt323 }}>
          Select text on any page, then press ⌘⇧L to explain it.
        </p>
        <button
          onClick={handleClose}
          className="text-[13px] hover:underline transition-colors"
          style={{ fontFamily: fonts.vt323, color: colors.gold }}
        >
          ✕ Close
        </button>
      </div>
    );
  }

  if (state === 'loading') {
    return (
      <div className="h-screen bg-darker flex items-center justify-center p-4">
        <LoadingState />
      </div>
    );
  }

  if (state === 'error' && error) {
    return (
      <div className="h-screen bg-darker flex items-center justify-center p-4">
        <ErrorState error={error} onDismiss={handleClose} />
      </div>
    );
  }

  if (state === 'result' && result) {
    return (
      <div className="h-screen bg-darker overflow-y-auto p-3">
        <div className="flex justify-between items-center mb-3">
          <button
            onClick={handleClose}
            className="text-[13px] hover:underline transition-colors"
            style={{ fontFamily: fonts.vt323, color: colors.gold }}
          >
            ✕ Close
          </button>
          <SettingsButton />
        </div>
        <ExplanationPanel
          result={result}
          inputLabel={inputLabel}
          onFollowUpResult={(followUpResult) => {
            setResult(followUpResult);
            setInputLabel('Follow-up');
          }}
        />
      </div>
    );
  }

  return <div className="h-screen bg-darker" />;
}
