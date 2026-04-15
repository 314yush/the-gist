import { Context, Next } from 'hono';
import { ERROR_CODES, ERROR_MESSAGES, type ApiError } from '@thegist/shared';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_RPM || '60', 10);

function getClientId(c: Context): string {
  const installId = c.req.header('X-Install-Id');
  if (installId) return `install:${installId}`;

  const forwarded = c.req.header('X-Forwarded-For')?.split(',')[0]?.trim();
  if (forwarded) return `ip:${forwarded}`;

  const realIp = c.req.header('X-Real-IP');
  if (realIp) return `ip:${realIp}`;

  return 'unknown';
}

export async function rateLimitMiddleware(c: Context, next: Next) {
  const clientId = getClientId(c);
  const now = Date.now();

  let entry = rateLimitStore.get(clientId);

  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
    rateLimitStore.set(clientId, entry);
  }

  entry.count++;

  c.header('X-RateLimit-Limit', String(MAX_REQUESTS));
  c.header('X-RateLimit-Remaining', String(Math.max(0, MAX_REQUESTS - entry.count)));
  c.header('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

  if (entry.count > MAX_REQUESTS) {
    const error: ApiError = {
      code: ERROR_CODES.RATE_LIMITED,
      message: `Rate limit exceeded. Try again in ${Math.ceil((entry.resetAt - now) / 1000)} seconds`,
      userMessage: ERROR_MESSAGES[ERROR_CODES.RATE_LIMITED],
    };
    return c.json({ error }, 429);
  }

  await next();
}

export function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
