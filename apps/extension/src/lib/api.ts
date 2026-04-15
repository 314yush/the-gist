import type {
  ExplanationRequest,
  ExplanationResponse,
  AuthTokenResponse,
  ProfileAnalyzeResponse,
  GenerateWikiResponse,
  ApiError,
  UserProfile,
} from '@thegist/shared';
import { ERROR_CODES, ERROR_MESSAGES } from '@thegist/shared';
import { getLocal, setLocal, getSession, setSession } from './storage';

const EXPLANATION_TIMEOUT_MS = 30_000;

function createExplanationAbortSignal(): AbortSignal {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(EXPLANATION_TIMEOUT_MS);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), EXPLANATION_TIMEOUT_MS);
  return controller.signal;
}

/** Shared between prefetch `fetch` and `requestExplanation` so overlay explains finish within 30s total. */
export function explanationRequestAbortSignal(): AbortSignal {
  return createExplanationAbortSignal();
}

function isAbortError(e: unknown): boolean {
  return (
    (typeof DOMException !== 'undefined' && e instanceof DOMException && e.name === 'AbortError') ||
    (e instanceof Error && e.name === 'AbortError')
  );
}

export function explanationTimeoutError(): ApiError {
  return {
    code: ERROR_CODES.REQUEST_TIMEOUT,
    message: 'Request timed out',
    userMessage: ERROR_MESSAGES[ERROR_CODES.REQUEST_TIMEOUT],
  };
}

async function getApiUrl(): Promise<string> {
  return (await getLocal('apiUrl')) || 'https://thegistapi-production.up.railway.app';
}

export async function authenticate(installId: string): Promise<AuthTokenResponse> {
  const apiUrl = await getApiUrl();
  const res = await fetch(`${apiUrl}/v1/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ inviteCode: installId }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.userMessage || `Auth failed (${res.status})`);
  }

  return res.json();
}

/** Lazily authenticate and cache the token in session storage. */
async function getRequestHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token = await getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const installId = await getLocal('installId');
  if (installId) {
    headers['X-Install-Id'] = installId;
  }

  return headers;
}

async function getAuthToken(): Promise<string | undefined> {
  const existing = await getSession('authToken');
  if (existing) return existing;

  // No token — authenticate now
  let installId = await getLocal('installId');
  if (!installId) {
    installId = crypto.randomUUID();
    await setLocal('installId', installId);
  }

  try {
    const { token } = await authenticate(installId);
    await setSession('authToken', token);
    return token;
  } catch (e) {
    console.warn('[TheGist] Auto-auth failed:', e);
    return undefined;
  }
}

export async function requestExplanation(
  input: ExplanationRequest['input'],
  wiki: string,
  followUp?: ExplanationRequest['followUp'],
  signal?: AbortSignal,
): Promise<ExplanationResponse> {
  const apiUrl = await getApiUrl();
  const headers = await getRequestHeaders();

  const body: ExplanationRequest = {
    input,
    context: { wiki },
    ...(followUp ? { followUp } : {}),
  };

  const effectiveSignal = signal ?? createExplanationAbortSignal();

  let res: Response;
  try {
    res = await fetch(`${apiUrl}/v1/explanations`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: effectiveSignal,
    });
  } catch (e) {
    if (isAbortError(e) || effectiveSignal.aborted) {
      throw explanationTimeoutError();
    }
    throw e;
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    const apiError: ApiError = errorBody?.error || {
      code: 'network_error',
      message: `Request failed (${res.status})`,
      userMessage: 'Something went wrong. Please try again.',
    };
    throw apiError;
  }

  return res.json();
}

export async function analyzeTwitterProfile(handle: string): Promise<ProfileAnalyzeResponse> {
  const apiUrl = await getApiUrl();
  const headers = await getRequestHeaders();

  const res = await fetch(`${apiUrl}/v1/profile/analyze`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ twitterHandle: handle }),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new Error(errorBody?.error?.userMessage || `Profile analysis failed (${res.status})`);
  }

  return res.json();
}

export async function generateWiki(
  answers: Record<string, string>,
  twitterProfile?: UserProfile,
): Promise<GenerateWikiResponse> {
  const apiUrl = await getApiUrl();
  const headers = await getRequestHeaders();

  const res = await fetch(`${apiUrl}/v1/profile/generate-wiki`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ answers, ...(twitterProfile ? { twitterProfile } : {}) }),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new Error(errorBody?.error?.userMessage || `Wiki generation failed (${res.status})`);
  }

  return res.json();
}
