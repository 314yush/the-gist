/** Typed chrome.storage helpers for local and session storage. */

interface LocalData {
  installId: string;
  apiUrl: string;
  wiki: string;
  onboardingComplete: boolean;
}

interface LastResult {
  result: import('@thegist/shared').ExplanationResponse;
  inputLabel: string;
  timestamp: number;
}

interface SessionData {
  authToken: string;
  lastResult: LastResult;
}

// --- chrome.storage.local ---

export async function getLocal<K extends keyof LocalData>(key: K): Promise<LocalData[K] | undefined> {
  const result = await chrome.storage.local.get(key);
  return result[key];
}

export async function setLocal<K extends keyof LocalData>(key: K, value: LocalData[K]): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

export async function getLocalMulti<K extends keyof LocalData>(keys: K[]): Promise<Partial<Pick<LocalData, K>>> {
  return chrome.storage.local.get(keys) as Promise<Partial<Pick<LocalData, K>>>;
}

// --- chrome.storage.session ---

export async function getSession<K extends keyof SessionData>(key: K): Promise<SessionData[K] | undefined> {
  const result = await chrome.storage.session.get(key);
  return result[key];
}

export async function setSession<K extends keyof SessionData>(key: K, value: SessionData[K]): Promise<void> {
  await chrome.storage.session.set({ [key]: value });
}
