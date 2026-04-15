import type {
  CaptureResult,
  ExplanationResponse,
  ExplanationFollowUp,
  ProfileAnalyzeResponse,
  ApiError,
} from '@thegist/shared';
import { ERROR_CODES, ERROR_MESSAGES } from '@thegist/shared';
import { getConfig } from './store';

const EXPLAIN_TIMEOUT_MS = 30_000;

function explainAbortSignal(): AbortSignal {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(EXPLAIN_TIMEOUT_MS);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), EXPLAIN_TIMEOUT_MS);
  return controller.signal;
}

function isAbortError(e: unknown): boolean {
  return (
    (typeof DOMException !== 'undefined' && e instanceof DOMException && e.name === 'AbortError') ||
    (e instanceof Error && e.name === 'AbortError')
  );
}

function createApiError(code: string, message: string): ApiError {
  return {
    code,
    message,
    userMessage: ERROR_MESSAGES[code] || message,
  };
}

export async function explain(
  input: CaptureResult,
  wikiContent: string,
  twitterHandle?: string,
  followUp?: ExplanationFollowUp
): Promise<ExplanationResponse> {
  const config = getConfig();

  if (!config.apiUrl) {
    throw createApiError('config_error', 'API URL not configured');
  }

  const url = `${config.apiUrl}/v1/explanations`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (config.apiToken) {
    headers['Authorization'] = `Bearer ${config.apiToken}`;
  }

  const body = JSON.stringify({
    input: {
      type: input.type,
      content: input.content,
      url: input.url,
    },
    context: {
      wiki: wikiContent,
      twitterHandle: twitterHandle || config.twitterHandle,
    },
    ...(followUp ? { followUp } : {}),
  });

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body,
      signal: explainAbortSignal(),
    });
  } catch (err) {
    if (isAbortError(err)) {
      throw createApiError(ERROR_CODES.REQUEST_TIMEOUT, 'Request timed out');
    }
    throw createApiError('network_error', 'Failed to connect to API');
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    
    if (response.status === 401) {
      throw createApiError(
        'auth_invalid',
        'Authentication failed. Check your API token in Preferences.'
      );
    }
    
    if (response.status === 403) {
      throw createApiError(
        'auth_expired',
        'Your session has expired. Please re-authenticate.'
      );
    }
    
    if (response.status === 429) {
      throw createApiError(
        'rate_limited',
        'Rate limit exceeded. Please wait before trying again.'
      );
    }
    
    if (response.status >= 500) {
      throw createApiError(
        'server_error',
        `Server error: ${response.status}`
      );
    }

    let parsed: { error?: { message?: string } } = {};
    try {
      parsed = JSON.parse(errorBody);
    } catch {
      // ignore parse error
    }
    
    throw createApiError(
      'server_error',
      parsed?.error?.message || `Request failed: ${response.status}`
    );
  }

  const data = await response.json();
  return data as ExplanationResponse;
}

export async function fetchUrlContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TheGist/1.0',
        'Accept': 'text/html,application/xhtml+xml,text/plain',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();

    if (contentType.includes('text/html')) {
      return stripHtml(text);
    }

    return text;
  } catch (err) {
    console.error('Failed to fetch URL content:', err);
    throw err;
  }
}

function stripHtml(html: string): string {
  // Remove scripts and styles
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  
  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  
  // Decode common HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  
  // Normalize whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  // Truncate if too long
  const maxLength = 10000;
  if (text.length > maxLength) {
    text = text.substring(0, maxLength) + '...';
  }
  
  return text;
}

export async function analyzeTwitterProfile(twitterHandle: string): Promise<ProfileAnalyzeResponse> {
  const config = getConfig();

  if (!config.apiUrl) {
    throw createApiError('config_error', 'API URL not configured');
  }

  const url = `${config.apiUrl}/v1/profile/analyze`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (config.apiToken) {
    headers['Authorization'] = `Bearer ${config.apiToken}`;
  }

  const body = JSON.stringify({ twitterHandle });

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body,
    });
  } catch (err) {
    throw createApiError('network_error', 'Failed to connect to API');
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    
    if (response.status === 401) {
      throw createApiError('auth_invalid', 'Authentication failed');
    }
    
    if (response.status >= 500) {
      throw createApiError('server_error', `Server error: ${response.status}`);
    }

    let parsed: { error?: { message?: string } } = {};
    try {
      parsed = JSON.parse(errorBody);
    } catch {
      // ignore
    }
    
    throw createApiError('server_error', parsed?.error?.message || `Request failed: ${response.status}`);
  }

  const data = await response.json();
  return data as ProfileAnalyzeResponse;
}
