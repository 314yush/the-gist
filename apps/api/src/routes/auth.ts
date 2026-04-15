import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { authTokenRequestSchema } from '../lib/schemas.js';
import type { AuthTokenResponse, ApiError } from '@thegist/shared';
import { ERROR_CODES, ERROR_MESSAGES } from '@thegist/shared';

const auth = new Hono();

auth.post('/token', zValidator('json', authTokenRequestSchema), async (c) => {
  const { email, inviteCode } = c.req.valid('json');

  const AUTH_SECRET = process.env.AUTH_SECRET;
  const INVITE_CODE = process.env.INVITE_CODE;

  if (!AUTH_SECRET) {
    const error: ApiError = {
      code: ERROR_CODES.SERVER_ERROR,
      message: 'AUTH_SECRET not configured',
      userMessage: ERROR_MESSAGES[ERROR_CODES.SERVER_ERROR],
    };
    return c.json({ error }, 500);
  }

  if (INVITE_CODE && inviteCode !== INVITE_CODE) {
    const error: ApiError = {
      code: ERROR_CODES.AUTH_INVALID,
      message: 'Invalid invite code',
      userMessage: 'Invalid invite code. Please check and try again.',
    };
    return c.json({ error }, 401);
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const response: AuthTokenResponse = {
    token: AUTH_SECRET,
    expiresAt: expiresAt.toISOString(),
  };

  return c.json(response);
});

export { auth };
