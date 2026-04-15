import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { explanationRequestSchema } from '../lib/schemas.js';
import { authMiddleware } from '../middleware/auth.js';
import { rateLimitMiddleware } from '../middleware/rateLimit.js';
import { getTwitterContext } from '../services/twitter.js';
import {
  buildSystemPrompt,
  buildUserMessage,
  buildFollowUpSystemAppendix,
  buildFollowUpUserMessage,
} from '../services/prompt.js';
import { generateExplanation } from '../services/openrouter.js';
import { resolveVisual } from '../services/visualOrchestrator.js';
import type { ExplanationResponse, ApiError } from '@thegist/shared';
import { ERROR_CODES, ERROR_MESSAGES } from '@thegist/shared';

const explanations = new Hono();

explanations.use('*', authMiddleware);
explanations.use('*', rateLimitMiddleware);

explanations.post('/', zValidator('json', explanationRequestSchema), async (c) => {
  const { input, context, followUp } = c.req.valid('json');

  try {
    let twitterContext = null;
    if (context.twitterHandle) {
      twitterContext = await getTwitterContext(context.twitterHandle);
    }

    let systemPrompt = buildSystemPrompt(context.wiki, twitterContext);
    let userMessage: string;

    if (followUp) {
      systemPrompt += buildFollowUpSystemAppendix();
      userMessage = buildFollowUpUserMessage(
        followUp.priorExplanation,
        followUp.userQuestion,
        input
      );
    } else {
      userMessage = buildUserMessage(input);
    }

    const imageBase64 = input.type === 'image' ? input.content : undefined;

    const result = await generateExplanation({
      systemPrompt,
      userMessage,
      imageBase64,
    });

    if ('error' in result) {
      const status = result.error.code === ERROR_CODES.RATE_LIMITED ? 429 : 500;
      return c.json({ error: result.error }, status);
    }

    const visual = await resolveVisual(result.explanation);

    const response: ExplanationResponse = {
      explanation: result.explanation,
      visual,
    };

    return c.json(response);
  } catch (error) {
    console.error('[explanations] Explanation generation failed:', error);

    const apiError: ApiError = {
      code: ERROR_CODES.SERVER_ERROR,
      message: error instanceof Error ? error.message : 'Unknown error',
      userMessage: ERROR_MESSAGES[ERROR_CODES.SERVER_ERROR],
    };

    return c.json({ error: apiError }, 500);
  }
});

export { explanations };
