import { useState, useEffect, useCallback, useRef } from 'react';
import type { ExplanationResponse, ApiError } from '@thegist/shared';
import { requestExplanation } from '../lib/api';
import { getLocal, getSession, setSession } from '../lib/storage';
import { ExplanationPanel } from '../components/ExplanationPanel';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { Onboarding } from '../components/Onboarding';
import { ReadyState, type CapturedInput } from '../components/ReadyState';
import { colors, fonts } from '../lib/theme';
import { SettingsButton } from '../components/SettingsButton';

type ViewState = 'onboarding' | 'loading' | 'ready' | 'result' | 'error';

export default function App() {
  const [view, setView] = useState<ViewState | null>(null);
  const [result, setResult] = useState<ExplanationResponse | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [inputLabel, setInputLabel] = useState<string>('');
  const [capturedInput, setCapturedInput] = useState<CapturedInput | null>(null);
  const [hasPreviousResult, setHasPreviousResult] = useState(false);

  /** Persist result to session storage so it survives popup close/reopen. */
  function saveResult(res: ExplanationResponse, label: string) {
    setResult(res);
    setInputLabel(label);
    setView('result');
    void setSession('lastResult', { result: res, inputLabel: label, timestamp: Date.now() });
  }

  async function handleExplainText(text: string) {
    const label = truncate(text, 60);
    setView('loading');
    setInputLabel(label);
    try {
      const wiki = (await getLocal('wiki')) || '';
      const res = await requestExplanation({ type: 'text', content: text }, wiki);
      saveResult(res, label);
    } catch (e) {
      setError(toApiError(e));
      setView('error');
    }
  }

  /** Track whether we're currently in the ready state to allow re-detection on focus. */
  const viewRef = useRef<ViewState | null>(null);
  viewRef.current = view;

  /**
   * Detect input using the waterfall (selection → clipboard → screenshot)
   * but only capture — don't call the API yet. Sets capturedInput and view to 'ready'.
   */
  const detectInput = useCallback(async () => {
    // 1. Try to read selected text from the active tab
    let tabId: number | undefined;
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      tabId = tab?.id;
      if (tabId) {
        const results = await chrome.scripting.executeScript({
          target: { tabId },
          func: () => window.getSelection()?.toString() ?? '',
        });
        const selection = results?.[0]?.result as string | undefined;
        if (selection && selection.trim()) {
          setCapturedInput({ type: 'text', content: selection.trim(), label: 'Selection' });
          setView('ready');
          return;
        }
      }
    } catch {
      // scripting may fail on chrome:// pages
    }

    // 2. Try clipboard — read via the active tab for reliability,
    //    then fall back to the popup's own clipboard API
    try {
      let clipText = '';
      if (tabId) {
        try {
          const results = await chrome.scripting.executeScript({
            target: { tabId },
            func: async () => {
              try { return await navigator.clipboard.readText(); }
              catch { return ''; }
            },
          });
          clipText = (results?.[0]?.result as string) || '';
        } catch {
          // executeScript failed, try popup clipboard
        }
      }
      if (!clipText) {
        clipText = await navigator.clipboard.readText();
      }
      if (clipText && clipText.trim()) {
        setCapturedInput({ type: 'text', content: clipText.trim(), label: 'Clipboard' });
        setView('ready');
        return;
      }
    } catch {
      // Clipboard not accessible at all
    }

    // 3. No input found — show guidance
    setCapturedInput({ type: 'text', content: '', label: 'None' });
    setView('ready');
  }, []);

  /** Take the current capturedInput and call the explain API. */
  function explainCaptured() {
    if (!capturedInput || !capturedInput.content) return;
    void handleExplainText(capturedInput.content);
  }

  /** Load the previous result from session storage and show it. */
  async function handleViewPrevious() {
    const last = await getSession('lastResult');
    if (last?.result) {
      setResult(last.result);
      setInputLabel(last.inputLabel);
      setView('result');
    }
  }

  function handleNewExplanation() {
    setHasPreviousResult(true);
    setResult(null);
    setError(null);
    void detectInput();
  }

  // --- Init on mount ---
  useEffect(() => {
    (async () => {
      // 1. Check onboarding
      const onboarded = await getLocal('onboardingComplete');
      if (!onboarded) {
        setView('onboarding');
        return;
      }

      // 2. Check for pending context-menu capture (auto-explain)
      const stored = await chrome.storage.session.get('pendingCapture');
      if (stored.pendingCapture) {
        await chrome.storage.session.remove('pendingCapture');
        const { type, content } = stored.pendingCapture as { type: string; content: string };
        if (type === 'text') {
          await handleExplainText(content);
          return;
        }
      }

      // 3. Check if a previous result exists (set flag, don't auto-show)
      const last = await getSession('lastResult');
      if (last?.result) {
        setHasPreviousResult(true);
      }

      // 4. Detect input and show ready state
      await detectInput();
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Re-detect input when popup regains focus (user may have copied/selected something) ---
  useEffect(() => {
    function onFocus() {
      // Only re-detect if we're in the ready state — don't interrupt loading/result/error
      if (viewRef.current === 'ready') {
        void detectInput();
      }
    }
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') onFocus();
    });
    return () => {
      window.removeEventListener('focus', onFocus);
    };
  }, [detectInput]);

  // --- Rendering ---

  if (view === null) {
    return (
      <div className="min-h-[400px] bg-darker flex items-center justify-center p-4">
        <LoadingState />
      </div>
    );
  }

  if (view === 'onboarding') {
    return <Onboarding onComplete={() => window.close()} />;
  }

  if (view === 'loading') {
    return (
      <div className="min-h-[400px] bg-darker flex items-center justify-center p-4">
        <LoadingState />
      </div>
    );
  }

  if (view === 'error' && error) {
    return (
      <div className="min-h-[400px] bg-darker flex items-center justify-center p-4">
        <ErrorState
          error={error}
          onDismiss={() => window.close()}
        />
      </div>
    );
  }

  if (view === 'ready' && capturedInput) {
    return (
      <div className="relative">
        <ReadyState
          capturedInput={capturedInput}
          hasPreviousResult={hasPreviousResult}
          onExplain={explainCaptured}
          onViewPrevious={handleViewPrevious}
        />
        <div className="absolute bottom-3 right-3">
          <SettingsButton />
        </div>
      </div>
    );
  }

  if (view === 'result' && result) {
    return (
      <div className="min-h-[400px] bg-darker p-3">
        {/* Action buttons at top */}
        <div className="flex justify-between items-center mb-3">
          <button
            onClick={handleNewExplanation}
            className="text-[13px] hover:underline transition-colors"
            style={{ fontFamily: fonts.vt323, color: colors.gold }}
          >
            ← New Explanation
          </button>
          <div className="flex items-center gap-2">
            <SettingsButton />
            <button
              onClick={() => window.close()}
              className="text-[11px] text-white/40 hover:text-white/70 transition-colors"
              style={{ fontFamily: fonts.vt323 }}
            >
              Close
            </button>
          </div>
        </div>
        <ExplanationPanel
          result={result}
          inputLabel={inputLabel}
          onFollowUpResult={(followUpResult) => {
            saveResult(followUpResult, 'Follow-up');
          }}
        />
      </div>
    );
  }

  return <div className="min-h-[400px] bg-darker" />;
}

function toApiError(e: unknown): ApiError {
  if (e && typeof e === 'object' && 'code' in e) return e as ApiError;
  return {
    code: 'network_error',
    message: e instanceof Error ? e.message : 'Unknown error',
    userMessage: 'Something went wrong. Please try again.',
  };
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + '\u2026' : s;
}
