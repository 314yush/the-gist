import { useState, useEffect, useCallback } from 'react';
import type { CaptureSessionState, ExplanationResponse, ApiError } from '../lib/ipc';

export function useCapture() {
  const [state, setState] = useState<CaptureSessionState>('idle');
  const [result, setResult] = useState<ExplanationResponse | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    if (!window.thegist) return;

    window.thegist.capture.onStateChange((_, newState) => {
      setState(newState);
      if (
        newState === 'region_offered' ||
        newState === 'listening' ||
        newState === 'submitting'
      ) {
        setError(null);
        setResult(null);
      }
    });

    window.thegist.explanation.onResult((_, res) => {
      setResult(res);
      setState('result');
    });

    window.thegist.explanation.onError((_, err) => {
      setError(err);
      setState('error');
    });

    window.thegist.explanation.onLoading(() => {
      setState('submitting');
    });
  }, []);

  const startSession = useCallback(() => {
    window.thegist?.capture.startSession();
  }, []);

  const cancelSession = useCallback(() => {
    window.thegist?.capture.cancelSession();
  }, []);

  const addToWiki = useCallback(async () => {
    if (result) {
      await window.thegist?.explanation.addToWiki(result);
    }
  }, [result]);

  const clearError = useCallback(() => {
    setError(null);
    setState('idle');
  }, []);

  return {
    state,
    result,
    error,
    startSession,
    cancelSession,
    addToWiki,
    clearError,
  };
}

export function useConfig() {
  const [config, setConfigState] = useState<{
    setupComplete: boolean;
    wikiPath?: string;
    twitterHandle?: string;
    apiUrl?: string;
    apiToken?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (window.thegist) {
      window.thegist.config.get()
        .then(setConfigState)
        .finally(() => setIsLoading(false));
    } else {
      // Browser mode - no config, show onboarding
      setIsLoading(false);
    }
  }, []);

  const updateConfig = useCallback(async (updates: Partial<typeof config>) => {
    if (!window.thegist) return;
    const newConfig = { ...config, ...updates };
    await window.thegist.config.set(newConfig);
    setConfigState(newConfig as typeof config);
  }, [config]);

  const openFilePicker = useCallback(async () => {
    return window.thegist?.config.openFilePicker() ?? null;
  }, []);

  return { config, updateConfig, openFilePicker, isLoading };
}
