import Store from 'electron-store';
import type { GistConfig } from '@thegist/shared';
import { DEFAULT_CONFIG } from '@thegist/shared';

const store = new Store<GistConfig>({
  name: 'thegist-config',
  defaults: DEFAULT_CONFIG,
  schema: {
    apiUrl: { type: 'string' },
    apiToken: { type: 'string' },
    wikiPath: { type: 'string' },
    twitterHandle: { type: 'string' },
    hotkey: { type: 'string' },
    setupComplete: { type: 'boolean' },
  },
});

/**
 * Merge persisted config with process.env (after load-env in main).
 * Local dev: same repo `.env` has AUTH_SECRET for the API — use it as Bearer when the store has no token.
 */
export function getConfig(): GistConfig {
  const apiUrl =
    store.get('apiUrl') ||
    process.env.THEGIST_API_URL ||
    process.env.VITE_DEFAULT_API_URL ||
    DEFAULT_CONFIG.apiUrl;
  const apiToken =
    store.get('apiToken') ||
    process.env.THEGIST_API_TOKEN ||
    process.env.AUTH_SECRET ||
    '';

  return {
    apiUrl,
    apiToken,
    wikiPath: store.get('wikiPath'),
    twitterHandle: store.get('twitterHandle'),
    hotkey: store.get('hotkey'),
    setupComplete: store.get('setupComplete'),
  };
}

export function setConfig(config: Partial<GistConfig>): GistConfig {
  for (const [key, value] of Object.entries(config)) {
    if (value !== undefined) {
      store.set(key as keyof GistConfig, value);
    }
  }
  return getConfig();
}

export function resetConfig(): void {
  store.clear();
}

export { store };
