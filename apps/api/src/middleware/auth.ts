import { Context, Next } from 'hono';
import { ERROR_CODES, ERROR_MESSAGES, type ApiError } from '@thegist/shared';

const AUTH_SECRET = process.env.AUTH_SECRET;

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const error: ApiError = {
      code: ERROR_CODES.AUTH_INVALID,
      message: 'Missing or malformed Authorization header',
      userMessage: ERROR_MESSAGES[ERROR_CODES.AUTH_INVALID],
    };
    return c.json({ error }, 401);
  }

  const token = authHeader.slice(7);

  if (!AUTH_SECRET) {
    console.error('AUTH_SECRET not configured');
    const error: ApiError = {
      code: ERROR_CODES.SERVER_ERROR,
      message: 'Server misconfiguration: AUTH_SECRET not set',
      userMessage: ERROR_MESSAGES[ERROR_CODES.SERVER_ERROR],
    };
    return c.json({ error }, 500);
  }

  if (token !== AUTH_SECRET) {
    const error: ApiError = {
      code: ERROR_CODES.AUTH_INVALID,
      message: 'Invalid token',
      userMessage: ERROR_MESSAGES[ERROR_CODES.AUTH_INVALID],
    };
    return c.json({ error }, 401);
  }

  await next();
}
