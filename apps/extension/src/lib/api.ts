import type {
  ExplanationRequest,
  ExplanationResponse,
  AuthTokenResponse,
  ProfileAnalyzeResponse,
  GenerateWikiResponse,
  ApiError,
  UserProfile,
} from '@thegist/shared';
import { getLocal, setLocal, getSession, setSession } from './storage';

async function getApiUrl(): Promise<string> {
  return (await getLocal('apiUrl')) || 'http://localhost:3000';
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
): Promise<ExplanationResponse> {
  const apiUrl = await getApiUrl();
  const headers = await getRequestHeaders();

  const body: ExplanationRequest = {
    input,
    context: { wiki },
    ...(followUp ? { followUp } : {}),
  };

  const res = await fetch(`${apiUrl}/v1/explanations`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

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
