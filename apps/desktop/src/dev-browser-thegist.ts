/**
 * Dev-only: Vite in a normal browser has no Electron preload. Shims `window.thegist` so the UI loads
 * and can POST to the local API (MCP / manual browser testing).
 *
 * Set in repo `.env` (exposed to Vite):
 *   VITE_THEGIST_DEV_TOKEN=<same value as AUTH_SECRET in apps/api>
 */
import type { CaptureSessionState } from '@thegist/shared';
import type { ExplanationResponse } from './lib/ipc';

const LS = 'thegist-dev-browser-config';

type DevConfig = {
  setupComplete: boolean;
  apiUrl: string;
  apiToken: string;
  wikiPath?: string;
  twitterHandle?: string;
};

function readDevConfig(): DevConfig {
  try {
    const raw = localStorage.getItem(LS);
    if (raw) {
      const p = JSON.parse(raw) as DevConfig;
      return {
        setupComplete: p.setupComplete ?? true,
        apiUrl: p.apiUrl || import.meta.env.VITE_DEFAULT_API_URL || 'http://localhost:3000',
        apiToken: p.apiToken || import.meta.env.VITE_THEGIST_DEV_TOKEN || '',
        wikiPath: p.wikiPath,
        twitterHandle: p.twitterHandle,
      };
    }
  } catch {
    /* ignore */
  }
  return {
    setupComplete: true,
    apiUrl: import.meta.env.VITE_DEFAULT_API_URL || 'http://localhost:3000',
    apiToken: import.meta.env.VITE_THEGIST_DEV_TOKEN || '',
  };
}

function saveDevConfig(p: Partial<DevConfig>): void {
  const next = { ...readDevConfig(), ...p };
  localStorage.setItem(LS, JSON.stringify(next));
}

function transformApiToRenderer(api: {
  explanation: {
    headline: string;
    body: string;
    analogy?: string;
    mechanics?: string[];
    firstPrinciple?: string;
    suggestedWikiNode?: string;
  };
  visual: ExplanationResponse['visual'];
}): ExplanationResponse {
  const exp = api.explanation;
  return {
    headline: exp.headline,
    withoutExample: exp.analogy || '',
    withExample: exp.body,
    mechanics: (exp.mechanics || []).map((text, i) => ({ num: String(i + 1), text })),
    firstPrinciple: exp.firstPrinciple || '',
    targetNode: exp.suggestedWikiNode || 'General',
    visual: api.visual,
    priorExplanation: {
      headline: exp.headline,
      body: exp.body,
      analogy: exp.analogy,
      mechanics: exp.mechanics,
      firstPrinciple: exp.firstPrinciple,
      suggestedWikiNode: exp.suggestedWikiNode,
    },
  };
}

if (import.meta.env.DEV && typeof window !== 'undefined' && !(window as any).thegist) {
  const stateCbs: Array<(e: unknown, s: CaptureSessionState) => void> = [];
  const loadingCbs: Array<(e: unknown) => void> = [];
  const resultCbs: Array<(e: unknown, r: ExplanationResponse) => void> = [];
  const errorCbs: Array<(e: unknown, err: { code: string; message: string; action?: string }) => void> =
    [];

  const emitState = (s: CaptureSessionState) => {
    stateCbs.forEach((cb) => cb(null, s));
  };
  const emitLoading = () => loadingCbs.forEach((cb) => cb(null));

  (window as any).thegist = {
    capture: {
      onStateChange: (cb: (e: unknown, s: CaptureSessionState) => void) => {
        stateCbs.push(cb);
      },
      startSession: async () => {
        const cfg = readDevConfig();
        emitState('region_offered');
        await new Promise((r) => setTimeout(r, 20));
        emitLoading();
        emitState('submitting');
        try {
          const res = await fetch(`${cfg.apiUrl.replace(/\/$/, '')}/v1/explanations`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(cfg.apiToken ? { Authorization: `Bearer ${cfg.apiToken}` } : {}),
            },
            body: JSON.stringify({
              input: { type: 'text', content: 'Browser dev smoke test' },
              context: { wiki: '', twitterHandle: cfg.twitterHandle },
            }),
          });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            const code = body?.error?.code || 'UNKNOWN';
            const message =
              body?.error?.userMessage || body?.error?.message || `HTTP ${res.status}`;
            errorCbs.forEach((cb) =>
              cb(null, {
                code,
                message,
                action: code === 'auth_invalid' ? 'openPreferences' : undefined,
              })
            );
            emitState('error');
            return;
          }
          const data = (await res.json()) as Parameters<typeof transformApiToRenderer>[0];
          const renderer = transformApiToRenderer(data);
          resultCbs.forEach((cb) => cb(null, renderer));
          emitState('result');
        } catch (e) {
          errorCbs.forEach((cb) =>
            cb(null, {
              code: 'NETWORK',
              message: e instanceof Error ? e.message : 'Request failed',
            })
          );
          emitState('error');
        }
      },
      cancelSession: async () => {
        emitState('idle');
      },
    },
    explanation: {
      onResult: (cb: (e: unknown, r: ExplanationResponse) => void) => {
        resultCbs.push(cb);
      },
      onError: (cb: (e: unknown, err: { code: string; message: string; action?: string }) => void) => {
        errorCbs.push(cb);
      },
      onLoading: (cb: (e: unknown) => void) => {
        loadingCbs.push(cb);
      },
      addToWiki: async () => {},
      followUp: async () => ({ ok: false as const, error: 'Not in browser mock' }),
    },
    config: {
      get: async () => readDevConfig(),
      set: async (c: Partial<DevConfig>) => {
        saveDevConfig(c);
      },
      openFilePicker: async () => '/tmp/dev-wiki.md',
    },
    window: {
      close: () => {},
      minimize: () => {},
      openPreferences: () => {},
    },
    system: {
      openAccessibilitySettings: async () => {},
      openScreenRecordingSettings: async () => {},
    },
    profile: {
      analyze: async () => ({ success: false as const, error: 'Browser mock' }),
    },
  };
}
