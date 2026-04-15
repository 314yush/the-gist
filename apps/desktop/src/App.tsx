import { useState, useEffect } from 'react';
import {
  Onboarding,
  FloatingPanel,
  LoadingState,
  ListeningHUD,
  ErrorState,
  Preferences,
} from './components';
import { CLIPBOARD_LISTEN_TIMEOUT_MS } from '@thegist/shared';
import { useCapture, useConfig } from './hooks/useCapture';

type AppView = 'main' | 'preferences' | 'onboarding';

export function App() {
  const { state, result, error, cancelSession, addToWiki, clearError } = useCapture();
  const { config, isLoading } = useConfig();
  const [view, setView] = useState<AppView>('main');

  useEffect(() => {
    // Show onboarding if config loaded and setup not complete
    // Also show onboarding in browser for testing
    if (!isLoading) {
      if (!config || !config.setupComplete) {
        setView('onboarding');
      }
    }
  }, [config, isLoading]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (view === 'preferences') {
          setView('main');
        } else if (
          state === 'region_offered' ||
          state === 'listening' ||
          state === 'result' ||
          state === 'error'
        ) {
          cancelSession();
          clearError();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, state, cancelSession, clearError]);

  const handleOnboardingComplete = () => {
    setView('main');
  };

  const handleOpenPreferences = () => {
    setView('preferences');
  };

  const handleClosePreferences = () => {
    setView('main');
  };

  const handleClose = () => {
    cancelSession();
    clearError();
    window.thegist?.window.close();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="w-screen h-screen bg-dark flex items-center justify-center">
        <div className="text-white/50 text-sm">Loading...</div>
      </div>
    );
  }

  if (view === 'onboarding') {
    return (
      <div className="w-screen h-screen overflow-hidden bg-dark">
        <Onboarding onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  if (view === 'preferences') {
    return (
      <div className="w-screen h-screen overflow-hidden bg-dark">
        <Preferences onClose={handleClosePreferences} />
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex items-center justify-center p-4 bg-dark">
      {state === 'listening' && (
        <ListeningHUD
          onCancel={cancelSession}
          timeoutSeconds={CLIPBOARD_LISTEN_TIMEOUT_MS / 1000}
        />
      )}

      {state === 'submitting' && (
        <LoadingState
          message="Explaining your capture"
          subtitle="Sending to the model and building your answer…"
        />
      )}

      {state === 'result' && result && (
        <FloatingPanel
          result={result}
          onClose={handleClose}
          onAddToWiki={addToWiki}
        />
      )}

      {state === 'error' && error && (
        <ErrorState
          error={error}
          onDismiss={clearError}
          onAction={handleOpenPreferences}
        />
      )}

      {state === 'idle' && (
        <IdleState onOpenPreferences={handleOpenPreferences} />
      )}
    </div>
  );
}

function IdleState({ onOpenPreferences }: { onOpenPreferences: () => void }) {
  return (
    <div className="text-center">
      <div
        className="text-[11px] uppercase tracking-widest text-white/30 mb-2"
        style={{ fontFamily: "'VT323', monospace" }}
      >
        The Gist Ready
      </div>
      <p className="text-[13px] text-white/50 mb-4">
        Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/70 mx-1">⌘ Shift L</kbd> to start
      </p>
      <button
        onClick={onOpenPreferences}
        className="text-[12px] text-white/40 hover:text-white/70 underline underline-offset-4 decoration-white/20 transition-colors"
      >
        Open Preferences
      </button>
    </div>
  );
}
