import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { analyzeTwitterProfile, generateProfileMarkdown, generateWikiFromProfile } from '../services/profile.js';
import { authMiddleware } from '../middleware/auth.js';
import type { ApiError } from '@thegist/shared';
import { ERROR_CODES, ERROR_MESSAGES } from '@thegist/shared';
import { generateWikiRequestSchema } from '../lib/schemas.js';

const profile = new Hono();

const analyzeRequestSchema = z.object({
  twitterHandle: z.string().regex(/^[a-zA-Z0-9_]{1,15}$/, 'Invalid Twitter handle'),
});

profile.use('*', authMiddleware);

profile.post('/analyze', zValidator('json', analyzeRequestSchema), async (c) => {
  const { twitterHandle } = c.req.valid('json');

  try {
    const userProfile = await analyzeTwitterProfile(twitterHandle);

    if (!userProfile) {
      const error: ApiError = {
        code: ERROR_CODES.SERVER_ERROR,
        message: 'Failed to analyze Twitter profile',
        userMessage: 'Could not analyze Twitter profile. Please check the handle and try again.',
      };
      return c.json({ error }, 500);
    }

    const markdown = generateProfileMarkdown(userProfile);

    return c.json({
      profile: userProfile,
      markdown,
    });
  } catch (error) {
    console.error('[profile] Profile analysis failed:', error);

    const apiError: ApiError = {
      code: ERROR_CODES.SERVER_ERROR,
      message: error instanceof Error ? error.message : 'Unknown error',
      userMessage: ERROR_MESSAGES[ERROR_CODES.SERVER_ERROR],
    };

    return c.json({ error: apiError }, 500);
  }
});

profile.post('/generate-wiki', zValidator('json', generateWikiRequestSchema), async (c) => {
  const { answers, twitterProfile } = c.req.valid('json');

  try {
    const result = await generateWikiFromProfile(answers, twitterProfile);

    if ('error' in result) {
      return c.json({ error: result.error }, 500);
    }

    return c.json({ wiki: result.wiki });
  } catch (error) {
    console.error('[profile] Wiki generation failed:', error);

    const apiError: ApiError = {
      code: ERROR_CODES.SERVER_ERROR,
      message: error instanceof Error ? error.message : 'Unknown error',
      userMessage: ERROR_MESSAGES[ERROR_CODES.SERVER_ERROR],
    };

    return c.json({ error: apiError }, 500);
  }
});

export { profile };
